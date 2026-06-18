/**
 * Phase 5 tests — SSRF guard for public-page fetching.
 * Pure unit tests (no network); they assert assertSafeUrl's allow/deny rules.
 */

import { describe, it, expect } from "vitest";
import { assertSafeUrl } from "./scrape";

describe("assertSafeUrl", () => {
    it("allows normal public http(s) hostnames", () => {
        expect(() => assertSafeUrl("https://www.kclsu.org/activities")).not.toThrow();
        expect(() => assertSafeUrl("http://studentsunionucl.org")).not.toThrow();
    });

    it("rejects non-http protocols", () => {
        expect(() => assertSafeUrl("file:///etc/passwd")).toThrow();
        expect(() => assertSafeUrl("ftp://example.com")).toThrow();
        expect(() => assertSafeUrl("gopher://example.com")).toThrow();
    });

    it("blocks localhost and private IPv4 ranges", () => {
        for (const u of [
            "http://localhost/",
            "http://127.0.0.1/",
            "http://10.0.0.5/",
            "http://192.168.1.1/",
            "http://172.16.0.1/",
            "http://169.254.169.254/", // cloud metadata
            "http://0.0.0.0/",
            "http://api.internal/",
        ]) {
            expect(() => assertSafeUrl(u), u).toThrow();
        }
    });

    it("blocks ALL IPv6 literals (loopback, mapped, ULA, link-local)", () => {
        for (const u of [
            "http://[::1]/",
            "http://[::ffff:127.0.0.1]/",
            "http://[::ffff:10.0.0.1]/",
            "http://[fd00::1]/",
            "http://[fe80::1]/",
            "http://[2606:4700:4700::1111]/", // even public IPv6 is rejected (we only fetch DNS hosts)
        ]) {
            expect(() => assertSafeUrl(u), u).toThrow();
        }
    });

    it("is not fooled by integer/hex/octal encodings of 127.0.0.1", () => {
        // Node's URL normalises these to dotted-quad, which the regex catches.
        for (const u of [
            "http://2130706433/",
            "http://0x7f000001/",
            "http://017700000001/",
            "http://127.0.0.1./",
        ]) {
            expect(() => assertSafeUrl(u), u).toThrow();
        }
    });
});
