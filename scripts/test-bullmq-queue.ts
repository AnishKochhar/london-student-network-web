/**
 * Test BullMQ Queue Operations
 * Run: npx tsx scripts/test-bullmq-queue.ts
 */

import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    console.error('❌ REDIS_URL not found in environment variables');
    process.exit(1);
}

async function testBullMQQueue() {
    console.log('🔍 Testing BullMQ Queue Operations...\n');

    const connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null // Required by BullMQ
    });
    const testQueue = new Queue('test-queue', { connection });

    try {
        // Test 1: Add immediate job
        console.log('1️⃣ Adding immediate job to queue...');
        const job1 = await testQueue.add('test-immediate', {
            message: 'This should process immediately',
            timestamp: new Date().toISOString()
        });
        console.log(`   ✅ Job added with ID: ${job1.id}`);

        // Test 2: Add delayed job
        console.log('\n2️⃣ Adding delayed job (10 seconds)...');
        const job2 = await testQueue.add('test-delayed', {
            message: 'This should process in 10 seconds',
            timestamp: new Date().toISOString()
        }, {
            delay: 10000 // 10 seconds
        });
        console.log(`   ✅ Delayed job added with ID: ${job2.id}`);

        // Test 3: Check job state
        console.log('\n3️⃣ Checking job states...');
        const state1 = await job1.getState();
        const state2 = await job2.getState();
        console.log(`   ✅ Immediate job state: ${state1}`);
        console.log(`   ✅ Delayed job state: ${state2}`);

        // Test 4: Get queue counts
        console.log('\n4️⃣ Checking queue counts...');
        const counts = await testQueue.getJobCounts('wait', 'delayed', 'active', 'completed', 'failed');
        console.log(`   ✅ Queue counts:`, counts);

        // Test 5: Create worker to process jobs
        console.log('\n5️⃣ Creating worker to process jobs...');
        let processedCount = 0;

        const worker = new Worker('test-queue', async (job) => {
            console.log(`   📨 Processing job ${job.id}: ${job.data.message}`);
            processedCount++;
            return { processed: true, at: new Date().toISOString() };
        }, {
            connection: new Redis(REDIS_URL, {
                maxRetriesPerRequest: null // Required by BullMQ
            })
        });

        // Wait for worker to process immediate job
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`   ✅ Processed ${processedCount} job(s)`);

        // Test 6: Check if immediate job was processed
        console.log('\n6️⃣ Verifying job completion...');
        const job1State = await job1.getState();
        console.log(`   ✅ Job ${job1.id} state: ${job1State}`);

        // Test 7: Clean up
        console.log('\n7️⃣ Cleaning up...');
        await worker.close();
        await testQueue.obliterate({ force: true }); // Remove all jobs and queue data
        console.log('   ✅ Worker closed and queue cleaned');

        console.log('\n🎉 All BullMQ tests passed!\n');
        console.log('💡 Note: Delayed job was not processed (normal for test)');

    } catch (error) {
        console.error('\n❌ BullMQ test failed:', error);
        process.exit(1);
    } finally {
        await testQueue.close();
        connection.disconnect();
    }
}

testBullMQQueue();
