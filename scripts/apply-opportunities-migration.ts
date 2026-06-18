/**
 * Apply migration 017 (opportunities schema) to the database in .env.
 * One-off, idempotent (every statement uses IF NOT EXISTS).
 *
 * Run: pnpm tsx scripts/apply-opportunities-migration.ts
 */
import "dotenv/config";
import { sql } from "@vercel/postgres";
import * as fs from "fs";
import * as path from "path";

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("❌ POSTGRES_URL not set — check .env");
        process.exit(1);
    }

    const file = path.join(
        process.cwd(),
        "migrations",
        "017_add_opportunities.sql",
    );
    const content = fs.readFileSync(file, "utf8");

    // Strip `--` comments first (some contain ';' which would break the split),
    // then split on ';'. Safe: 017 has no string literals containing '--'.
    const statements = content
        .replace(/--[^\n]*/g, "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    console.log(`Applying ${statements.length} statements from 017…`);
    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        await sql.query(stmt);
        const label =
            stmt
                .split("\n")
                .find((l) => l.trim() && !l.trim().startsWith("--"))
                ?.trim()
                .slice(0, 64) ?? "";
        console.log(`  [${i + 1}/${statements.length}] ${label}`);
    }

    const { rows } = await sql.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
          AND (table_name LIKE 'opportunit%' OR table_name = 'saved_opportunities')
        ORDER BY table_name
    `);
    console.log(
        "\n✅ Tables present:",
        rows.map((r) => r.table_name).join(", "),
    );
    process.exit(0);
}

main().catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
});
