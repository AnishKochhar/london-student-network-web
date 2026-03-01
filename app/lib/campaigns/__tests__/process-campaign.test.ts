import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Mock Setup - vi.hoisted ensures these are available for vi.mock factories
// ============================================

const { mockSqlFn, mockSendEmail, mockFetchTemplate } = vi.hoisted(() => ({
    mockSqlFn: vi.fn(),
    mockSendEmail: vi.fn(),
    mockFetchTemplate: vi.fn(),
}));

vi.mock("@vercel/postgres", () => ({
    sql: mockSqlFn,
}));

vi.mock("@/app/lib/config/private/sendgrid", () => ({
    default: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/app/lib/campaigns/queries", () => ({
    fetchTemplateById: (...args: unknown[]) => mockFetchTemplate(...args),
}));

// Mock email template utilities
vi.mock("@/app/lib/campaigns/email-templates", () => ({
    wrapWithLSNBranding: (html: string) => `<branded>${html}</branded>`,
    replaceVariables: (text: string, vars: Record<string, string>) => {
        let result = text;
        for (const [key, value] of Object.entries(vars)) {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
        }
        return result;
    },
    htmlToPlainText: (html: string) => html.replace(/<[^>]*>/g, ""),
}));

// Import after mocks
import { processCampaign, processAllStalledCampaigns } from "../process-campaign";

// ============================================
// Helpers
// ============================================

// Track SQL calls to return different responses per call
let sqlCallIndex = 0;
let sqlResponses: Array<{ rows: unknown[] }> = [];

const CAMPAIGN_ID = "campaign-123";

function makeCampaignRow(overrides?: Partial<Record<string, unknown>>) {
    return {
        id: CAMPAIGN_ID,
        name: "Test Campaign",
        template_id: "template-1",
        from_email: "josh@londonstudentnetwork.com",
        from_name: "London Student Network",
        reply_to: "hello@londonstudentnetwork.com",
        subject_override: null,
        status: "sending",
        ...overrides,
    };
}

function makeEmailSendRow(id: string, email: string, overrides?: Partial<Record<string, unknown>>) {
    return {
        id,
        campaign_id: CAMPAIGN_ID,
        contact_id: `contact-${id}`,
        to_email: email,
        to_name: email.split("@")[0],
        to_organization: "Test Org",
        subject: "Hello {{name}}",
        status: "pending",
        ...overrides,
    };
}

function makeTemplate() {
    return {
        id: "template-1",
        name: "Test Template",
        subject: "Hello {{name}}",
        bodyHtml: "<p>Hi {{name}} from {{organization}}</p>",
        previewText: "Preview",
        signature: { name: "Josh", html: "<p>Josh</p>" },
        category: "outreach",
        updatedAt: new Date().toISOString(),
    };
}

function setupSqlResponses(responses: Array<{ rows: unknown[] }>) {
    sqlCallIndex = 0;
    sqlResponses = responses;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mockSqlFn.mockImplementation((..._args: unknown[]) => {
        const response = sqlResponses[sqlCallIndex] ?? { rows: [] };
        sqlCallIndex++;
        return Promise.resolve(response);
    });
}

// ============================================
// Tests
// ============================================

describe("processCampaign", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sqlCallIndex = 0;
        sqlResponses = [];
    });

    it("should process all pending emails in a campaign", async () => {
        const sends = [
            makeEmailSendRow("send-1", "alice@test.com"),
            makeEmailSendRow("send-2", "bob@test.com"),
            makeEmailSendRow("send-3", "charlie@test.com"),
        ];

        mockFetchTemplate.mockResolvedValue(makeTemplate());

        setupSqlResponses([
            { rows: [makeCampaignRow()] },             // fetch campaign
            { rows: sends },                           // claim batch (3 emails)
            { rows: [] },                              // update send-1 -> sent
            { rows: [] },                              // update contact-1 last_emailed_at
            { rows: [] },                              // update send-2 -> sent
            { rows: [] },                              // update contact-2 last_emailed_at
            { rows: [] },                              // update send-3 -> sent
            { rows: [] },                              // update contact-3 last_emailed_at
            { rows: [] },                              // update campaign sent_count
            { rows: [] },                              // claim next batch (empty = done)
            { rows: [{ count: 0 }] },                  // count remaining
            { rows: [] },                              // mark campaign 'sent'
        ]);

        const result = await processCampaign(CAMPAIGN_ID);

        expect(result.sent).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.totalProcessed).toBe(3);
        expect(result.remaining).toBe(0);
        expect(result.completed).toBe(true);
        expect(mockSendEmail).toHaveBeenCalledTimes(3);
    });

    it("should handle campaign not found", async () => {
        setupSqlResponses([
            { rows: [] }, // campaign not found
        ]);

        const result = await processCampaign(CAMPAIGN_ID);

        expect(result.totalProcessed).toBe(0);
        expect(result.completed).toBe(false);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("should skip campaigns not in 'sending' status", async () => {
        setupSqlResponses([
            { rows: [makeCampaignRow({ status: "draft" })] },
        ]);

        const result = await processCampaign(CAMPAIGN_ID);

        expect(result.totalProcessed).toBe(0);
        expect(result.completed).toBe(false);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("should handle SendGrid failures gracefully", async () => {
        const sends = [
            makeEmailSendRow("send-1", "alice@test.com"),
            makeEmailSendRow("send-2", "bob@test.com"),
        ];

        mockFetchTemplate.mockResolvedValue(makeTemplate());

        // First send succeeds, second fails
        mockSendEmail
            .mockResolvedValueOnce({ success: true })
            .mockRejectedValueOnce(new Error("SendGrid rate limit exceeded"));

        setupSqlResponses([
            { rows: [makeCampaignRow()] },             // fetch campaign
            { rows: sends },                           // claim batch
            { rows: [] },                              // update send-1 -> sent
            { rows: [] },                              // update contact-1
            { rows: [] },                              // update send-2 -> dropped
            { rows: [] },                              // update campaign sent_count
            { rows: [] },                              // claim next batch (empty)
            { rows: [{ count: 0 }] },                  // count remaining
            { rows: [] },                              // mark campaign complete
        ]);

        const result = await processCampaign(CAMPAIGN_ID);

        expect(result.sent).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.totalProcessed).toBe(2);
        expect(result.completed).toBe(true);
    });

    it("should respect maxBatches option", async () => {
        const batch1 = [
            makeEmailSendRow("send-1", "alice@test.com"),
        ];

        mockFetchTemplate.mockResolvedValue(makeTemplate());

        setupSqlResponses([
            { rows: [makeCampaignRow()] },             // fetch campaign
            { rows: batch1 },                          // claim batch 1
            { rows: [] },                              // update send-1 -> sent
            { rows: [] },                              // update contact-1
            { rows: [] },                              // update campaign sent_count
            // maxBatches=1 so no more claiming
            { rows: [{ count: 5 }] },                  // count remaining
        ]);

        const result = await processCampaign(CAMPAIGN_ID, { maxBatches: 1 });

        expect(result.sent).toBe(1);
        expect(result.remaining).toBe(5);
        expect(result.completed).toBe(false);
    });

    it("should handle empty campaign with no pending emails", async () => {
        mockFetchTemplate.mockResolvedValue(makeTemplate());

        setupSqlResponses([
            { rows: [makeCampaignRow()] },             // fetch campaign
            { rows: [] },                              // claim batch (empty immediately)
            { rows: [{ count: 0 }] },                  // count remaining
            { rows: [] },                              // mark campaign complete
        ]);

        const result = await processCampaign(CAMPAIGN_ID);

        expect(result.totalProcessed).toBe(0);
        expect(result.completed).toBe(true);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("should personalize email content with recipient variables", async () => {
        const sends = [
            makeEmailSendRow("send-1", "alice@test.com", {
                to_name: "Alice",
                to_organization: "Imperial College",
            }),
        ];

        mockFetchTemplate.mockResolvedValue(makeTemplate());

        setupSqlResponses([
            { rows: [makeCampaignRow()] },
            { rows: sends },
            { rows: [] }, // update send status
            { rows: [] }, // update contact
            { rows: [] }, // update campaign sent_count
            { rows: [] }, // claim next batch (empty)
            { rows: [{ count: 0 }] },
            { rows: [] }, // mark complete
        ]);

        await processCampaign(CAMPAIGN_ID);

        expect(mockSendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "alice@test.com",
                subject: "Hello Alice",
            })
        );

        // Check HTML contains personalized content
        const callArgs = mockSendEmail.mock.calls[0][0];
        expect(callArgs.html).toContain("Alice");
        expect(callArgs.html).toContain("Imperial College");
    });

    it("should handle sends without contact_id (no contact update)", async () => {
        const sends = [
            makeEmailSendRow("send-1", "external@test.com", {
                contact_id: null,
            }),
        ];

        mockFetchTemplate.mockResolvedValue(makeTemplate());

        setupSqlResponses([
            { rows: [makeCampaignRow()] },
            { rows: sends },
            { rows: [] },                              // update send -> sent
            // No contact update since contact_id is null
            { rows: [] },                              // update campaign sent_count
            { rows: [] },                              // claim next batch (empty)
            { rows: [{ count: 0 }] },
            { rows: [] },                              // mark complete
        ]);

        const result = await processCampaign(CAMPAIGN_ID);

        expect(result.sent).toBe(1);
        expect(result.completed).toBe(true);
    });

    it("should use subject_override when set on campaign", async () => {
        const sends = [
            makeEmailSendRow("send-1", "alice@test.com", { to_name: "Alice" }),
        ];

        mockFetchTemplate.mockResolvedValue(makeTemplate());

        setupSqlResponses([
            { rows: [makeCampaignRow({ subject_override: "Custom Subject for {{name}}" })] },
            { rows: sends },
            { rows: [] },
            { rows: [] },
            { rows: [] },
            { rows: [] },
            { rows: [{ count: 0 }] },
            { rows: [] },
        ]);

        await processCampaign(CAMPAIGN_ID);

        const callArgs = mockSendEmail.mock.calls[0][0];
        expect(callArgs.subject).toBe("Custom Subject for Alice");
    });
});

describe("processAllStalledCampaigns", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sqlCallIndex = 0;
        sqlResponses = [];
    });

    it("should return empty array when no stalled campaigns", async () => {
        setupSqlResponses([
            { rows: [] }, // no stalled campaigns
        ]);

        const results = await processAllStalledCampaigns();
        expect(results).toEqual([]);
    });

    it("should find and process stalled campaigns", async () => {
        mockFetchTemplate.mockResolvedValue(makeTemplate());

        setupSqlResponses([
            { rows: [{ id: "campaign-a" }] },          // find stalled
            // Process campaign-a
            { rows: [makeCampaignRow({ id: "campaign-a" })] },
            { rows: [] },                              // claim batch (empty)
            { rows: [{ count: 0 }] },                  // count remaining
            { rows: [] },                              // mark complete
        ]);

        const results = await processAllStalledCampaigns();
        expect(results).toHaveLength(1);
        expect(results[0].completed).toBe(true);
    });
});
