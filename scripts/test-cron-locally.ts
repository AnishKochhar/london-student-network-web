/**
 * Test Cron Job Locally (without Vercel scheduler)
 * Run: npx tsx scripts/test-cron-locally.ts
 *
 * This simulates what Vercel's cron scheduler would do
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function testCronLocally() {
    console.log('🔍 Testing Cron Job Locally...\n');

    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET) {
        console.error('❌ CRON_SECRET not found in environment variables');
        process.exit(1);
    }

    console.log('📍 Testing event scanning cron job...\n');

    try {
        // Simulate Vercel calling the cron endpoint
        const response = await fetch('http://localhost:3000/api/cron/scan-event-reminders', {
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
            console.log('\n✅ Cron job executed successfully!');
            console.log(`\n📊 Summary:`);
            console.log(`   - Events processed: ${data.eventsProcessed || 0}`);
            console.log(`   - Reminders scheduled: ${data.remindersScheduled || 0}`);
            console.log(`   - External emails sent: ${data.externalEmailsSent || 0}`);

            if (data.errors && data.errors.length > 0) {
                console.log(`\n⚠️  Errors encountered:`);
                data.errors.forEach((err: string) => console.log(`   - ${err}`));
            }
        } else {
            console.error('\n❌ Cron job failed');
            console.error(`   Error: ${data.error || data.message}`);
        }

    } catch (error) {
        console.error('\n❌ Failed to call cron endpoint:', error.message);
        console.error('\n💡 Make sure your Next.js dev server is running:');
        console.error('   pnpm dev');
        process.exit(1);
    }
}

// Test authorization failure too
async function testUnauthorizedAccess() {
    console.log('\n\n🔒 Testing unauthorized access (should fail)...\n');

    try {
        const response = await fetch('http://localhost:3000/api/cron/scan-event-reminders', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer wrong-secret'
            }
        });

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);

        if (response.status === 401) {
            console.log('✅ Authorization properly blocked unauthorized access');
        } else {
            console.error('❌ Expected 401 Unauthorized, got:', response.status);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function main() {
    await testCronLocally();
    await testUnauthorizedAccess();
    console.log('\n✨ All tests complete!\n');
}

main();
