/**
 * Test Worker Locally (processes queued jobs)
 * Run: npx tsx scripts/test-worker-locally.ts
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function testWorkerLocally() {
    console.log('🔍 Testing Worker Locally...\n');

    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET) {
        console.error('❌ CRON_SECRET not found in environment variables');
        process.exit(1);
    }

    console.log('📍 Testing email reminder worker...\n');

    try {
        const response = await fetch('http://localhost:3000/api/workers/process-email-reminders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            }
        });

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        console.log('\n📦 Response data:');
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Worker executed successfully!');
            console.log(`\n💡 Note: Worker ran for ~50 seconds and processed jobs from queue`);
        } else {
            console.error('\n❌ Worker failed');
            console.error(`   Error: ${data.error || data.message}`);
        }

    } catch (error) {
        console.error('\n❌ Failed to call worker endpoint:', error.message);
        console.error('\n💡 Make sure your Next.js dev server is running:');
        console.error('   pnpm dev');
        process.exit(1);
    }
}

testWorkerLocally();
