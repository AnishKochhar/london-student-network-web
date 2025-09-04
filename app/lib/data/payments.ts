import { sql } from "@vercel/postgres";
// import { getRedisClientInstance } from "../singletons-private";

// const storeTransactionState = async (sessionId: string, state: string) => {
//     await fetch(`${process.env.BACKEND_API}/transactions/${sessionId}`, {
//       method: 'POST',
//       body: JSON.stringify({ state }),
//       headers: { 'Content-Type': 'application/json' }
//     });
// };

export async function checkIfEventIsPaid(event_id: string) {
  try {
    const result = await sql`
      SELECT 1
      FROM tickets
      WHERE event_uuid::text LIKE '%' || ${event_id}
      LIMIT 1
    `;
    
    // If exactly one row is returned, the event is considered paid.
    if (result.rowCount === 1) {
      return { isPaid: true, statusCode: 200 };
    }
    // If no rows are returned, the event is not paid.
    return { isPaid: false, statusCode: 200 };
    
  } catch (error) {
    console.error('Database function error:', error);
    // On error, return true (to be safe) with a 500 Internal Server Error status.
    return { isPaid: true, statusCode: 500 };
  }
}
