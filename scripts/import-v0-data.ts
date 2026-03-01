/**
 * Import Script: Migrate =6 data to email_campaigns system
 *
 * Run with: npx tsx scripts/import-v0-data.ts
 */

import { sql } from "@vercel/postgres";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

interface Society {
    name: string;
    slug: string;
    url: string;
    category: string;
    email: string | null;
    description: string;
    tagline: string;
    memberCount: number | null;
    socialMedia: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        website?: string;
    };
    relevanceScore: number;
    relevanceReasoning: string;
    targetAudience: string[];
    outreachPriority: "high" | "medium" | "low";
    suggestedApproach: string;
}

interface V0Data {
    categorizedSocieties: Society[];
}

// Category colors for visual distinction
const categoryColors: Record<string, string> = {
    "Academic Related": "#3b82f6",
    "Community": "#22c55e",
    "Arts and Culture": "#ec4899",
    "Faith": "#8b5cf6",
    "Political": "#f59e0b",
    "Media": "#06b6d4",
    "Recreational": "#10b981",
    "Default": "#6366f1",
};

async function importV0Data() {
    console.log("🚀 Starting import of =6 data...\n");

    // Read the data file
    const dataPath = path.join(
        __dirname,
        "../../=6/data/output/imperial_societies_lsn_categorized.json"
    );

    if (!fs.existsSync(dataPath)) {
        console.error("❌ Data file not found at:", dataPath);
        console.log("   Expected path: /Users/anishkochhar/Desktop/=6/data/output/imperial_societies_lsn_categorized.json");
        process.exit(1);
    }

    const rawData = fs.readFileSync(dataPath, "utf-8");
    const data: V0Data = JSON.parse(rawData);

    console.log(`📊 Found ${data.categorizedSocieties.length} societies in data file\n`);

    // Filter societies with emails
    const societiesWithEmails = data.categorizedSocieties.filter((s) => s.email);
    console.log(`📧 ${societiesWithEmails.length} societies have email addresses\n`);

    // Step 1: Create Imperial College root category
    console.log("📁 Creating categories...\n");

    const { rows: existingImperial } = await sql`
        SELECT id FROM email_categories WHERE slug = 'imperial-college'
    `;

    let imperialId: string;

    if (existingImperial.length > 0) {
        imperialId = existingImperial[0].id;
        console.log("   ✓ Imperial College category already exists");
    } else {
        const { rows: newImperial } = await sql`
            INSERT INTO email_categories (name, slug, color, icon, description)
            VALUES (
                'Imperial College',
                'imperial-college',
                '#003E74',
                'graduation-cap',
                'Imperial College London societies'
            )
            RETURNING id
        `;
        imperialId = newImperial[0].id;
        console.log("   ✓ Created Imperial College category");
    }

    // Step 2: Get unique categories and create sub-categories
    const uniqueCategories = [...new Set(societiesWithEmails.map((s) => s.category))];
    console.log(`   Found ${uniqueCategories.length} unique sub-categories`);

    const categoryMap: Record<string, string> = {};

    for (const category of uniqueCategories) {
        const slug = category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const { rows: existing } = await sql`
            SELECT id FROM email_categories WHERE slug = ${slug}
        `;

        if (existing.length > 0) {
            categoryMap[category] = existing[0].id;
        } else {
            const color = categoryColors[category] || categoryColors["Default"];
            const { rows: newCat } = await sql`
                INSERT INTO email_categories (name, slug, parent_id, color, icon)
                VALUES (${category}, ${slug}, ${imperialId}, ${color}, 'tag')
                RETURNING id
            `;
            categoryMap[category] = newCat[0].id;
        }
    }

    console.log("   ✓ Sub-categories created/verified\n");

    // Step 3: Import contacts
    console.log("📧 Importing contacts...\n");

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const society of societiesWithEmails) {
        try {
            // Check if email already exists
            const { rows: existing } = await sql`
                SELECT id FROM email_contacts WHERE email = ${society.email}
            `;

            if (existing.length > 0) {
                skipped++;
                continue;
            }

            // Prepare metadata
            const metadata = {
                url: society.url,
                tagline: society.tagline,
                memberCount: society.memberCount,
                socialMedia: society.socialMedia,
                relevanceScore: society.relevanceScore,
                relevanceReasoning: society.relevanceReasoning,
                outreachPriority: society.outreachPriority,
                suggestedApproach: society.suggestedApproach,
            };

            // Insert contact
            await sql`
                INSERT INTO email_contacts (
                    email,
                    name,
                    organization,
                    category_id,
                    metadata,
                    tags,
                    notes,
                    source
                ) VALUES (
                    ${society.email},
                    ${society.name},
                    ${"Imperial College London"},
                    ${categoryMap[society.category]},
                    ${JSON.stringify(metadata)},
                    ${society.targetAudience || []},
                    ${society.description?.substring(0, 500) || null},
                    ${"v0_migration"}
                )
            `;

            created++;

            // Progress indicator
            if (created % 50 === 0) {
                console.log(`   ... imported ${created} contacts`);
            }
        } catch (error) {
            errors++;
            console.error(`   ❌ Error importing ${society.name}:`, error);
        }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 IMPORT SUMMARY");
    console.log("=".repeat(50));
    console.log(`   ✅ Created: ${created} contacts`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📁 Categories: ${uniqueCategories.length + 1}`);
    console.log("=".repeat(50) + "\n");

    // Verify import
    const { rows: totalContacts } = await sql`
        SELECT COUNT(*)::int as count FROM email_contacts
    `;
    const { rows: totalCategories } = await sql`
        SELECT COUNT(*)::int as count FROM email_categories
    `;

    console.log("📈 Database State:");
    console.log(`   Total contacts: ${totalContacts[0].count}`);
    console.log(`   Total categories: ${totalCategories[0].count}`);
    console.log("\n✅ Import complete!");
}

// Run the import
importV0Data()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
