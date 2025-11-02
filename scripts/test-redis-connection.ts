/**
 * Test Redis Connection
 * Run: npx tsx scripts/test-redis-connection.ts
 */

import Redis from 'ioredis';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    console.error('❌ REDIS_URL not found in environment variables');
    process.exit(1);
}

async function testRedisConnection() {
    console.log('🔍 Testing Redis connection...\n');
    console.log(`📍 Redis URL: ${REDIS_URL.replace(/:[^:]*@/, ':***@')}`);

    const redis = new Redis(REDIS_URL);

    try {
        // Test 1: Ping
        console.log('\n1️⃣ Testing PING...');
        const pong = await redis.ping();
        console.log(`   ✅ PING response: ${pong}`);

        // Test 2: Set a test key
        console.log('\n2️⃣ Testing SET...');
        await redis.set('test:connection', 'Hello from LSN!', 'EX', 60);
        console.log('   ✅ Set test key with 60s expiry');

        // Test 3: Get the test key
        console.log('\n3️⃣ Testing GET...');
        const value = await redis.get('test:connection');
        console.log(`   ✅ Retrieved value: ${value}`);

        // Test 4: Check Redis info
        console.log('\n4️⃣ Testing INFO...');
        const info = await redis.info('server');
        const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
        console.log(`   ✅ Redis version: ${version}`);

        // Test 5: Test TTL
        console.log('\n5️⃣ Testing TTL...');
        const ttl = await redis.ttl('test:connection');
        console.log(`   ✅ Key expires in: ${ttl} seconds`);

        // Test 6: Clean up
        console.log('\n6️⃣ Cleaning up...');
        await redis.del('test:connection');
        console.log('   ✅ Test key deleted');

        console.log('\n🎉 All Redis tests passed!\n');

    } catch (error) {
        console.error('\n❌ Redis test failed:', error);
        process.exit(1);
    } finally {
        redis.disconnect();
    }
}

testRedisConnection();
