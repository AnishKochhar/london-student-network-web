import { insertEvent } from '@/app/lib/data';
import { NextResponse, NextRequest } from 'next/server';
import { createSQLEventObject } from '@/app/lib/utils';
import { FormData } from '@/app/lib/types';
import { getNextExtractedEvent } from '@/app/lib/redis-helpers';

export async function GET(request: NextRequest) { // cron requests must be GET
  try {
//   Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const events: FormData[] = [];
  const maxEventsToPush = 10;
  for (let i = 0; i < maxEventsToPush; i++) {
    const event = await getNextExtractedEvent();
    if (!event) {
        console.error('Error with getting next extracted event, to push to LSN db.');
        break;
    }
    try {
      events.push(event);
    } catch (e) {
      console.error('Failed to parse event from queue:', e);
    }
  }

  // Insert each event into the database
  let successful = 0;
  let totalAttempted = 0;
  for (const data of events) {
    const sqlEvent = await createSQLEventObject(data);
    const response = await insertEvent(sqlEvent, true);
    if (response.success) {
        successful++;
    }
    totalAttempted++;
    console.log(response.success);
  }

  return NextResponse.json({ successfulAttempts: successful, totalAttempts: totalAttempted }, { status: 200 });
  } catch (error) {
    console.error("Error in push-extracted-events route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
