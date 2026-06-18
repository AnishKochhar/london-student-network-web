/**
 * Phase 3 tests — Source Registry Agent.
 * Runs in store mode (the seed already contains the canonical sources).
 */

import { describe, it, expect } from "vitest";
import {
    canonicalSourceDrafts,
    seedUniversitySources,
    queueSourceFetch,
    disableSource,
    enableSource,
} from "./registry";
import { listSources } from "../queries";
import { createSource, updateSource } from "../mutations";

describe("source registry", () => {
    it("offers 5 SU directories + CRM + existing-site as canonical drafts", () => {
        const drafts = canonicalSourceDrafts();
        expect(drafts.filter((d) => d.sourceType === "su_directory")).toHaveLength(
            5,
        );
        expect(drafts.some((d) => d.sourceType === "lsn_crm")).toBe(true);
        expect(drafts.some((d) => d.sourceType === "lsn_existing_site")).toBe(
            true,
        );
        // Every SU directory is high-trust.
        expect(
            drafts
                .filter((d) => d.sourceType === "su_directory")
                .every((d) => d.trustLevel === "high"),
        ).toBe(true);
    });

    it("seeding is idempotent (no duplicates on repeat)", async () => {
        const first = await seedUniversitySources();
        const totalAfterFirst = first.sources.length;
        const second = await seedUniversitySources();
        expect(second.created).toBe(0);
        expect(second.sources.length).toBe(totalAfterFirst);
    });

    it("queue fetch flips status to queued; disable/enable toggles ignored", async () => {
        const created = await createSource({
            sourceType: "website",
            sourceName: "Test society website",
            sourceUrl: "https://example.org",
            trustLevel: "low",
        });
        expect(created.fetchStatus).toBe("new");

        const queued = await queueSourceFetch(created.id);
        expect(queued?.fetchStatus).toBe("queued");

        const disabled = await disableSource(created.id);
        expect(disabled?.fetchStatus).toBe("ignored");

        const enabled = await enableSource(created.id);
        expect(enabled?.fetchStatus).toBe("new");
    });

    it("partial update does not wipe omitted fields (stripUndefined)", async () => {
        const created = await createSource({
            sourceType: "website",
            sourceName: "Has a URL",
            sourceUrl: "https://keep-me.example",
            trustLevel: "medium",
        });
        // Patch only the name — url/trust must survive.
        const updated = await updateSource(created.id, {
            sourceName: "Renamed",
        });
        expect(updated?.sourceName).toBe("Renamed");
        expect(updated?.sourceUrl).toBe("https://keep-me.example");
        expect(updated?.trustLevel).toBe("medium");
    });

    it("listSources reflects newly added sources", async () => {
        const before = (await listSources()).length;
        await createSource({
            sourceType: "instagram",
            sourceName: "@somesociety",
            trustLevel: "low",
        });
        expect((await listSources()).length).toBe(before + 1);
    });
});
