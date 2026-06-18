/**
 * Create or promote a HOLDING admin user — for local/staging review of the
 * Society Intelligence admin pages (/admin/societies/*) before the real LSN
 * admin account is wired up.
 *
 * In production the actual LSN admin account (role = 'admin') is used; this is a
 * convenience for pre-launch review only. Delete the holding account afterwards.
 *
 * Run:
 *   pnpm tsx scripts/create-society-admin.ts <email> <password>
 *   # defaults if omitted: society-admin@lsn.local / changeme123
 *
 * Idempotent: if the email already exists it is PROMOTED to role='admin' and its
 * password reset to the one given (so you can also use it to make your existing
 * account an admin). Requires POSTGRES_URL in .env.
 */
import "dotenv/config";
import { sql } from "@vercel/postgres";
import bcrypt from "bcrypt";

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("❌ POSTGRES_URL not set — check .env");
        process.exit(1);
    }

    const email = (process.argv[2] || "society-admin@lsn.local")
        .trim()
        .toLowerCase();
    const password = process.argv[3] || "changeme123";
    if (password.length < 6) {
        console.error("❌ Password must be at least 6 characters.");
        process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 10);

    // `role = 'admin'` is what gates /admin (see app/admin/layout.tsx). We set a
    // known-valid account_type and never touch any other user's data.
    const { rows } = await sql`
        INSERT INTO users (name, email, password, account_type, role)
        VALUES ('Society Admin', ${email}, ${hashed}, 'student', 'admin')
        ON CONFLICT (email)
        DO UPDATE SET role = 'admin', password = EXCLUDED.password
        RETURNING id, email, role
    `;

    console.log("✅ Holding admin ready:", rows[0]);
    console.log(`\n   Log in at /login with:\n   email:    ${email}\n   password: ${password}\n`);
    console.log("   Then open /admin/societies");
    console.log(
        "\n   ⚠️  Delete this account (or reset its role) before / after launch.",
    );
    process.exit(0);
}

main().catch((e) => {
    console.error("❌ Failed to create admin:", e);
    process.exit(1);
});
