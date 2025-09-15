import { insertEvent } from '@/app/lib/data';
import { NextResponse } from 'next/server';
import { createSQLEventObject } from '@/app/lib/utils';
import { FormData } from '@/app/lib/types';
import { redis } from '@/app/lib/redis-helpers';

export async function POST(req: Request) {
  // Get up to 10 events from the Redis list
  const events: FormData[] = [];
  for (let i = 0; i < 10; i++) {
    const raw = await redis.lpop('extracted_events_queue');
    if (!raw) break;
    try {
      events.push(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to parse event from queue:', e);
    }
  }

  // Insert each event into the database
  const results = [];
  for (const data of events) {
    const sqlEvent = await createSQLEventObject(data);
    const response = await insertEvent(sqlEvent);
    results.push(response.success);
    console.log(response.success);
  }

  return NextResponse.json({ inserted: results.length, results }, { status: 200 });
}
