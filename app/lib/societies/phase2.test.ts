/**
 * Phase 2 tests for the Society Intelligence Network.
 *
 * Covers: seed integrity, store-mode CRUD, slug + name normalisation, stats, and
 * the critical NO-OUTBOUND guard test that fails if any module file imports an
 * email/queue/messaging client.
 *
 * These run in store mode (no POSTGRES_URL in the test env) so they exercise the
 * in-memory path; the DB path shares the same domain types.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
    deriveAcronym,
    generateSocietyFingerprint,
    normaliseSocietyName,
} from "./normalise";
import { generateSocietySlug } from "./slug";
import { TARGET_UNIVERSITIES, resolveUniversityId } from "./universities";
import {
    buildSeedSocieties,
    buildSeedSources,
    buildSeedUniversities,
} from "./seed-data";
import {
    getAllSocieties,
    getPublishedSocieties,
    getPublishedSociety,
    getStats,
    listUniversities,
} from "./queries";
import { createSociety, setSocietyStatus } from "./mutations";

describe("seed data", () => {
    it("seeds exactly the five target universities", async () => {
        expect(TARGET_UNIVERSITIES.map((u) => u.id).sort()).toEqual([
            "imperial",
            "kcl",
            "lse",
            "qmul",
            "ucl",
        ]);
        expect(buildSeedUniversities()).toHaveLength(5);
        expect(await listUniversities()).toHaveLength(5);
    });

    it("seed societies reference real universities and carry a normalised name", () => {
        const societies = buildSeedSocieties();
        expect(societies.length).toBeGreaterThan(0);
        const uniIds = new Set(TARGET_UNIVERSITIES.map((u) => u.id));
        for (const s of societies) {
            expect(uniIds.has(s.universityId)).toBe(true);
            expect(s.normalisedName.length).toBeGreaterThan(0);
            expect(s.universityShortName.length).toBeGreaterThan(0);
        }
    });

    it("seeds the five SU directories plus CRM + existing-site sources", () => {
        const sources = buildSeedSources();
        const directories = sources.filter(
            (s) => s.sourceType === "su_directory",
        );
        expect(directories).toHaveLength(5);
        expect(sources.some((s) => s.sourceType === "lsn_crm")).toBe(true);
        expect(sources.some((s) => s.sourceType === "lsn_existing_site")).toBe(
            true,
        );
    });
});

describe("name normalisation + fingerprinting", () => {
    it("collapses university affiliation variants to the same key", () => {
        const a = normaliseSocietyName("KCL Politics Society");
        const b = normaliseSocietyName("King's Politics Society");
        const c = normaliseSocietyName("KCLSU Politics Society");
        expect(a).toBe(b);
        expect(b).toBe(c);
        expect(a).toContain("politics");
    });

    it("keeps genuinely different societies distinct", () => {
        const ir = normaliseSocietyName("KCL International Relations Society");
        const iss = normaliseSocietyName(
            "KCL International Security Studies Society",
        );
        expect(ir).not.toBe(iss);
    });

    it("fingerprint is word-order independent within a university", () => {
        const f1 = generateSocietyFingerprint("KCL Politics Society", "kcl");
        const f2 = generateSocietyFingerprint("Politics Society KCL", "kcl");
        expect(f1).toBe(f2);
        expect(f1.startsWith("kcl:")).toBe(true);
    });

    it("derives an acronym from the distinctive words", () => {
        expect(deriveAcronym("KCL International Security Studies Society")).toBe(
            "iss",
        );
    });
});

describe("slug generation", () => {
    it("is collision-free within a university", () => {
        const taken = new Set<string>();
        const a = generateSocietySlug("Film Society", "QMUL", taken);
        taken.add(a);
        const b = generateSocietySlug("Film Society", "QMUL", taken);
        expect(a).toBe("film-society");
        expect(b).toBe("film-society-2");
    });
});

describe("university resolution", () => {
    it("resolves common free-text names; returns null when unclear", () => {
        expect(resolveUniversityId("King's College London")).toBe("kcl");
        expect(resolveUniversityId("UCL")).toBe("ucl");
        expect(resolveUniversityId("Queen Mary")).toBe("qmul");
        expect(resolveUniversityId("Some Other University")).toBeNull();
    });
});

describe("store-mode CRUD + stats", () => {
    it("creates a draft society, then publishes it", async () => {
        const created = await createSociety({
            name: "LSE Chess Society",
            universityId: "lse",
            type: "official_su_society",
            category: "Games",
            tags: ["Chess", "Strategy"],
            shortDescription: "Casual and competitive chess at LSE.",
        });
        expect(created.status).toBe("draft");
        expect(created.isPublic).toBe(false);
        expect(created.slug).toBe("lse-chess-society");
        expect(created.normalisedName).toContain("chess");
        expect(created.universityShortName).toBe("LSE");

        // Not yet public.
        const beforePub = await getPublishedSociety("lse", created.slug);
        expect(beforePub).toBeNull();

        const published = await setSocietyStatus(created.id, "published");
        expect(published?.isPublic).toBe(true);
        expect(published?.publishedAt).toBeTruthy();

        const afterPub = await getPublishedSociety("lse", created.slug);
        expect(afterPub?.id).toBe(created.id);
    });

    it("published list only contains published+public societies", async () => {
        const all = await getAllSocieties();
        const published = await getPublishedSocieties();
        expect(published.every((s) => s.status === "published" && s.isPublic)).toBe(
            true,
        );
        expect(all.length).toBeGreaterThanOrEqual(published.length);
    });

    it("stats always report outbound disabled", async () => {
        const stats = await getStats();
        expect(stats.outboundDisabled).toBe(true);
        expect(stats.perUniversity).toHaveLength(5);
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.sourceCoverage).toBeGreaterThan(0);
    });
});

describe("NO-OUTBOUND guard", () => {
    // Any of these appearing as an import target inside the societies module
    // would mean the engine can send something. That must never happen.
    const FORBIDDEN =
        /from\s+["'][^"']*(@sendgrid|sendgrid|nodemailer|twilio|bullmq|ioredis|send-email|\/send-email)/;
    const FORBIDDEN_ENV = /process\.env\.SENDGRID/;
    const FORBIDDEN_FLAG = /sendDisabled\s*:\s*false/;

    function collectSourceFiles(dir: string): string[] {
        const out: string[] = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                out.push(...collectSourceFiles(full));
            } else if (
                entry.name.endsWith(".ts") &&
                !entry.name.endsWith(".test.ts")
            ) {
                out.push(full);
            }
        }
        return out;
    }

    it("no module file imports an email/queue/messaging client", () => {
        const dir = path.join(process.cwd(), "app", "lib", "societies");
        const files = collectSourceFiles(dir);
        expect(files.length).toBeGreaterThan(0);
        const offenders: string[] = [];
        for (const f of files) {
            const src = fs.readFileSync(f, "utf8");
            if (
                FORBIDDEN.test(src) ||
                FORBIDDEN_ENV.test(src) ||
                FORBIDDEN_FLAG.test(src)
            ) {
                offenders.push(path.basename(f));
            }
        }
        expect(offenders).toEqual([]);
    });
});
