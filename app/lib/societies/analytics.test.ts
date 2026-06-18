/**
 * Phase 13 tests — interaction analytics foundation (store mode).
 */

import { describe, it, expect } from "vitest";
import { createSociety, recordInteraction } from "./mutations";
import { getInteractionStats } from "./queries";

describe("interaction analytics", () => {
    it("records interactions and aggregates views/clicks + top societies", async () => {
        const a = await createSociety({ name: "KCL Views A", universityId: "kcl" });
        const b = await createSociety({ name: "KCL Views B", universityId: "kcl" });

        await recordInteraction(a.id, "profile_view");
        await recordInteraction(a.id, "profile_view");
        await recordInteraction(a.id, "membership_click");
        await recordInteraction(b.id, "profile_view");
        await recordInteraction(b.id, "instagram_click");

        const stats = await getInteractionStats();

        expect(stats.totalViews).toBeGreaterThanOrEqual(3);
        expect(stats.totalClicks).toBeGreaterThanOrEqual(2);
        expect(stats.byType["profile_view"]).toBeGreaterThanOrEqual(3);
        expect(stats.byType["membership_click"]).toBeGreaterThanOrEqual(1);

        // A (2 views) ranks above B (1 view) in top societies.
        const aRank = stats.topSocieties.findIndex((s) => s.societyId === a.id);
        const bRank = stats.topSocieties.findIndex((s) => s.societyId === b.id);
        expect(aRank).toBeGreaterThanOrEqual(0);
        expect(aRank).toBeLessThan(bRank);
        expect(stats.topSocieties[aRank].name).toBe("KCL Views A");
        expect(stats.topSocieties[aRank].views).toBe(2);
    });

    it("records an interaction with a userId + metadata", async () => {
        const s = await createSociety({ name: "UCL Meta Society", universityId: "ucl" });
        await recordInteraction(s.id, "share", {
            userId: "user-123",
            metadata: { channel: "whatsapp" },
        });
        const stats = await getInteractionStats();
        expect(stats.byType["share"]).toBeGreaterThanOrEqual(1);
    });
});
