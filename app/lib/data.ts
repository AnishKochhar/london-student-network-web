import { sql } from '@vercel/postgres';
import { SQLEvent, ContactFormInput, SocietyRegisterFormData, UserRegisterFormData, SQLRegistrations, OrganiserAccountEditFormData, CompanyRegisterFormData, InsertTokenResult, EventRegistrationEmail, Event, FormData, Tickets } from './types';
import { FallbackStatistics } from './utils/general';
import { selectUniversity } from './utils/events';
import { formatDOB } from './utils/events';
import { capitalize, capitalizeFirst } from './utils/general';
import { convertSQLEventToEvent, createSQLEventObject, convertSQLRegistrationsToRegistrations, convertSQLTicketResultToTicketInfo } from './utils/type-manipulation';
import bcrypt from 'bcrypt';
import { Tag } from './types';
import { getRedisClientInstance } from './singletons-private';
import '@vercel/postgres';

declare module '@vercel/postgres' { // overload for transactions
  interface VercelPool {
    begin<T>(callback: (sql: VercelPool) => Promise<T>): Promise<T>;
	array<T>(values: T[], type?: string): { type: string, value: string };
  }
}

const redis = await getRedisClientInstance();

// TODO: Organise based on usecases

export async function fetchWebsiteStats() {
	// return FallbackStatistics
	try {
		const stats = await sql`
        SELECT
            (SELECT COUNT(*) FROM events) AS total_events,
            (SELECT COUNT(DISTINCT university_attended) FROM user_information) AS total_universities,
            (SELECT COUNT(*) FROM users WHERE role = 'organiser' AND is_test_account = FALSE) AS total_societies
    	`;
		return stats.rows

	} catch (error) {
		console.error('Database error:', error)
		return FallbackStatistics
	}
}

export async function checkOwnershipOfEvent(userId: string, eventId: string) {
	try {
		const data = await sql<SQLEvent> `
		SELECT organiser_uid
		FROM events
		WHERE id::TEXT LIKE '%' || ${eventId}
		`

		return data?.rows[0]?.organiser_uid === userId;
	} catch (error) {
		console.error('database function error:', error);
		throw new Error('Failed to verify ownership in database function');
	}
}


export async function fetchEvents() {
	try {
		const data = await sql<SQLEvent>`SELECT * FROM events`
		return data.rows.map(convertSQLEventToEvent)
	} catch (error) {
		console.error('Database error:', error)
		throw new Error('Failed to fetch events data')
	}
}

// export async function fetchAllUpcomingEvents() {
// 	try {
// 		const data = await sql<SQLEvent>`
// 			SELECT * FROM events
// 			WHERE (year, month, day) >= (EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(DAY FROM CURRENT_DATE))
// 			ORDER BY year, month, day
// 		`;
// 		return data.rows.map(convertSQLEventToEvent);
// 	} catch (error) {
// 		console.error('Database error:', error);
// 		throw new Error('Failed to fetch upcoming events');
// 	}
// }

export async function fetchAllUpcomingEvents() {
	try {
	  // Fetch all upcoming events
	  const eventsResult = await sql<SQLEvent>`
		SELECT *
		FROM events
		WHERE (year, month, day) >= (
		  EXTRACT(YEAR FROM CURRENT_DATE),
		  EXTRACT(MONTH FROM CURRENT_DATE),
		  EXTRACT(DAY FROM CURRENT_DATE)
		)
		ORDER BY year, month, day
	  `;
	  const events = eventsResult.rows;

    // For each event, fetch its tickets separately
    const eventsWithTickets = await Promise.all(
		events.map(async (event) => {
		  const ticketsResult = await sql<SQLTicketResult>`
			SELECT ticket_name, ticket_price, tickets_available
			FROM tickets
			WHERE event_uuid::TEXT LIKE '%' || ${event.id}
		  `;
		  return {
			...convertSQLEventToEvent(event),
			tickets_info: convertSQLTicketResultToTicketInfo(ticketsResult.rows),
		  };
		})
	  );

	  return eventsWithTickets;

	} catch (error) {
	  console.error('Database error:', error);
	  throw new Error('Failed to fetch upcoming events');
	}
  }

export async function fetchUpcomingEvents() {
	try {
		// Fetch all upcoming events
		const eventsResult = await sql<SQLEvent>`
		  SELECT *
		  FROM events
		  WHERE (year, month, day) >= (
			EXTRACT(YEAR FROM CURRENT_DATE),
			EXTRACT(MONTH FROM CURRENT_DATE),
			EXTRACT(DAY FROM CURRENT_DATE)
		  )
		  ORDER BY year, month, day
		  LIMIT 5;
		`;
		const events = eventsResult.rows;
  
	  // For each event, fetch its tickets separately
	  const eventsWithTickets = await Promise.all(
		  events.map(async (event) => {
			const ticketsResult = await sql<SQLTicketResult>`
			  SELECT ticket_name, ticket_price, tickets_available
			  FROM tickets
			  WHERE event_uuid::TEXT LIKE '%' || ${event.id}
			`;
			return {
			  ...convertSQLEventToEvent(event),
			  tickets_info: convertSQLTicketResultToTicketInfo(ticketsResult.rows),
			};
		  })
		);
  
		return eventsWithTickets;
  
	  } catch (error) {
		console.error('Database error:', error);
		throw new Error('Failed to fetch upcoming events');
	  }
	}

// export async function fetchUserEvents(organiser_uid: string) {
// 	try {
//         const events = await sql<SQLEvent>`
//             SELECT e.*, t.ticket_name, t.ticket_price, t.tickets_available
//             FROM events e
//             LEFT JOIN tickets t ON e.id = t.event_uuid
//             WHERE e.organiser_uid = ${organiser_uid}
//             ORDER BY e.start_time ASC
//         `;
        // console.log(events.rows.map(convertSQLEventToEvent));
//         return events.rows.map(row => ({
//             ...convertSQLEventToEvent(row)
//         }));
//     } catch (error) {
//         console.error('Error fetching user events:', error);
//         throw new Error('Unable to fetch user\'s events')
//     }
// }
export async function fetchEventById(id: string) {
	try {
		const result1 = await sql<SQLEvent>`
			SELECT *
			FROM events
			WHERE id::text LIKE '%' || ${id};
		`;

		const result2 = await sql<SQLTicketResult>`
			SELECT ticket_uuid, ticket_name, ticket_price, tickets_available
			FROM tickets
			WHERE event_uuid::text LIKE '%' || ${id};
		`;
		// , tickets_price: result2.rows[0]?.ticket_price || '0'

		return { 
			success: true,
			event: {
			...convertSQLEventToEvent(result1.rows[0]),
			tickets_info: convertSQLTicketResultToTicketInfo(result2.rows) },
			organiser_uid: result1.rows[0].organiser_uid
		};
	} catch (error) {
		console.error('Database error:', error);
		throw new Error('Failed to fetch event');
	}
}

export async function fetchUserEvents(organiser_uid: string): Promise<Event[]> {
	try {
	  const events = await sql<SQLEvent & SQLTicketResult>`
		SELECT 
		  e.*,
		  t.ticket_name,
		  t.ticket_price,
		  t.tickets_available
		FROM events e
		LEFT JOIN tickets t ON e.id = t.event_uuid
		WHERE e.organiser_uid = ${organiser_uid}
		ORDER BY e.start_time ASC
	  `;
  
	  const eventMap = new Map<string, Event>();
	  
	  events.rows.forEach(row => {
		const baseEvent = convertSQLEventToEvent(row);
		
		if (!eventMap.has(baseEvent.id)) {
		  eventMap.set(baseEvent.id, {
			...baseEvent,
			tickets_info: []
		  });
		}
  
		const currentEvent = eventMap.get(baseEvent.id)!;
		
		if (row.ticket_name) {
		  currentEvent.tickets_info.push({
			ticketName: row.ticket_name,
			price: row.ticket_price ? Number(row.ticket_price) : undefined,
			capacity: row.tickets_available ?? undefined
		  });
		}
	  });
  
	  return Array.from(eventMap.values());
	} catch (error) {
	  console.error('Error fetching user events:', error);
	  throw new Error('Unable to fetch user\'s events');
	}
  }
  
  // Helper types
  interface EventRow {
	// Event columns
	id: string;
	title: string;
	description: string;
	organiser: string;
	time: string;
	date: string;
	location_building: string;
	location_area: string;
	location_address: string;
	image_url: string;
	image_contain: boolean;
	event_type: number;
	sign_up_link?: string;
	for_externals?: string;
	
	// Ticket columns
	// ticket_uuid?: string;
	ticket_name?: string;
	ticket_price?: number;
	tickets_available?: number;
	// price_id?: string;
	// ticket_created_at?: Date;
  
}
export interface TicketInfo {
	ticketName: string;
	price?: number;
	capacity?: number;
}

export interface SQLTicketResult {
	ticket_name: string;
	ticket_price?: number;
	tickets_available?: number;
	event_uuid?: string;
	ticket_uuid?: string;
}



export async function fetchRegistrationEmailEventInformation(event_id: string) {
	try {
		const result = await sql<EventRegistrationEmail>`
			SELECT title, organiser, day, month, year, start_time, end_time, location_building, location_area, location_address
			FROM events
			WHERE id::text LIKE '%' || ${event_id};
		`;
		if (result.rows.length === 0) {
			return { success: false };
		}
		return { success: true, event: result.rows[0] };
	} catch (error) {
		console.error('Database error:', error);
		throw new Error('Failed to fetch event');
	}
}

export async function getUserById(user_id: string) {
	try {
		const result = await sql`
		SELECT name, email
		FROM users
		WHERE id::TEXT LIKE '%' || ${user_id};
		`

		if (result.rowCount > 0) {
			return result.rows[0];
		} else {
			return { error: "couldn't find user for the given id"};
		}
	} catch(error) {
		console.error('Database error:', error);
		throw new Error('Failed to get user by ID');
	}
}





export async function fetchTicketDetails(ticketIds: string[]) {
	try {
		await sql.query(`BEGIN`);

		let tickets: Tickets[] = [];

		for (let i = 0; i < ticketIds.length; i++){
			const result = await sql<Tickets>`
			SELECT ticket_name, ticket_price, tickets_available, price_id, ticket_uuid
			FROM tickets
			WHERE ticket_uuid::TEXT LIKE '%' || ${ticketIds[i]};
			`
			if (result.rowCount === 1) { // do not have any flexibility on rowCount, as it may lead to users overpaying for an issue on our end
				tickets.push(result.rows[0]);
			}
		}

		await sql.query(`COMMIT`);

		if (tickets.length !== ticketIds.length) {
			return { success: false, error: "the server couldn't find the ticket information"}
		} else {
			return { success: true, tickets}
		}

	} catch(error) {
		await sql.query('ROLLBACK');
		console.error('Database error:', error);
		throw new Error('failed to fetch ticket details, given an array of ticket ids');
	}
}

export async function checkForFreeTickets(userId: string, eventId: string) {
	try {
		const result = await sql<{ticket_uuid: string}>`
		SELECT ticket_uuid
		FROM event_registrations
		WHERE event_id::TEXT LIKE '%' || ${eventId}
		AND user_id::TEXT LIKE '%' || ${userId};
		`

		if (result.rowCount === 0) {
			return { hasFreeTicket: false };
		}
		else {
			const ticketIds: string[] = result.rows.map(row => row.ticket_uuid);
	
			for (let i = 0; i < ticketIds.length; i++){
				const result = await sql<Tickets>`
				SELECT price_id
				FROM tickets
				WHERE ticket_uuid::TEXT LIKE '%' || ${ticketIds[i]};
				`
				if (result.rowCount === 0) {
					return { hasFreeTicket: true };
				}
			}

			return { hasFreeTicket: false };
	
		}
	} catch(error) {
		console.error('Database error:', error);
		throw new Error('Database error with trying to fetch user registrations');
	}
}

export async function fetchHolisticEventInformation(event_id: string) { // for registration emails
	try {
		const result = await sql`
			SELECT title, organiser, day, month, year, start_time, end_time, location_building, location_area, location_address
			FROM events
			WHERE id = ${event_id}
		`;
		if (result.rows.length === 0) {
			return { success: false };
		}
		return { success: true, event: result.rows[0] };
	} catch (error) {
		console.error('Database error:', error);
		throw new Error('Failed to fetch event');
	}
}

export async function fetchEventWithUserId(event_id: string, user_id: string) {
	try {
		const data = await sql<SQLEvent>`
			SELECT * FROM events
			WHERE organiser_uid = ${user_id} AND id = ${event_id}
			LIMIT 1
		`;
		console.log('Data rows: ', data.rows);
		if (data.rows.length === 0) {
			return { success: false };
		} else {
			return { success: true, event: convertSQLEventToEvent(data.rows[0]) }
		}
	} catch (error) {
		console.error('Database error:', error);
		throw new Error('Failed to fetch event');
	}
}

// export async function insertEvent(event: SQLEvent) {
// 	try {
// 		const result = await sql` 
// 		INSERT INTO events (title, description, organiser, organiser_uid, start_time, end_time, day, month, year, location_building, location_area, location_address, image_url, event_type, sign_up_link, for_externals, capacity, image_contain)
// 		VALUES (${event.title}, ${event.description}, ${event.organiser}, ${event.organiser_uid}, ${event.start_time}, ${event.end_time}, ${event.day}, ${event.month}, ${event.year}, ${event.location_building}, ${event.location_area}, ${event.location_address}, ${event.image_url}, ${event.event_type}, ${event.sign_up_link ?? null}, ${event.for_externals ?? null}, ${event.capacity ?? null}, ${event.image_contain})
// 		RETURNING id
// 		`

// 		// Get the id of the newly inserted event
// 		const eventId = result.rows[0].id;

// 		// Insert into the tickets table using the event id and ticket price

		
// 		return { success: true, id: eventId };
// 	} catch (error) {
// 		console.error('Error creating event:', error);
// 		return { success: false, error };
// 	}
// }

export async function insertEventFunction(event: SQLEvent) { // DO NOT USE
	try {
	  // Start a transaction to insert the event and its tickets atomically
	  const eventId = await sql.begin(async (tx) => {
		// Insert the event
		const eventResult = await tx.sql`
		  INSERT INTO events (
			title, description, organiser, organiser_uid,
			start_time, end_time, day, month, year,
			location_building, location_area, location_address,
			image_url, event_type, sign_up_link, for_externals,
			image_contain
		  )
		  VALUES (
			${event.title}, ${event.description}, ${event.organiser}, ${event.organiser_uid},
			${event.start_time}, ${event.end_time}, ${event.day}, ${event.month}, ${event.year},
			${event.location_building}, ${event.location_area}, ${event.location_address},
			${event.image_url}, ${event.event_type}, ${event.sign_up_link ?? null}, ${event.for_externals ?? null},
			${event.image_contain}
		  )
		  RETURNING id
		`;
		const eventId = eventResult.rows[0].id;
  
		// Insert associated tickets if provided
		// if (event.ticket_info && event.ticket_info.length > 0) {
		//   for (const ticket of event.ticket_info) {
		// 	await tx.sql`
		// 	  INSERT INTO tickets (
		// 		event_uuid, ticket_name, ticket_price, tickets_available
		// 	  )
		// 	  VALUES (
		// 		${eventId}, ${ticket.ticketName}, ${ticket.price}, ${ticket.capacity}
		// 	  )
		// 	`;
		//   }
		// }
  
		return eventId;
	  });
  
	  return { success: true, id: eventId };
	} catch (error) {
	  console.error('Error creating event:', error);
	  return { success: false, error };
	}
}

export async function insertEvent(event: SQLEvent) {
	try {
	  // Start transaction explicitly
	  await sql.query(`BEGIN`);
  
	  // Insert the event
	  const eventResult = await sql`
		INSERT INTO events (
		  title, description, organiser, organiser_uid,
		  start_time, end_time, day, month, year,
		  location_building, location_area, location_address,
		  image_url, event_type, sign_up_link, for_externals,
		  image_contain
		)
		VALUES (
		  ${event.title}, ${event.description}, ${event.organiser}, ${event.organiser_uid},
		  ${event.start_time}, ${event.end_time}, ${event.day}, ${event.month}, ${event.year},
		  ${event.location_building}, ${event.location_area}, ${event.location_address},
		  ${event.image_url}, ${event.event_type}, ${event.sign_up_link ?? null}, ${event.for_externals ?? null},
		  ${event.image_contain}
		)
		RETURNING id
	  `;
	  const eventId = eventResult.rows[0].id;
  
	  // Insert associated tickets if provided
	//   if (event.ticket_info && event.ticket_info.length > 0) {
	// 	for (const ticket of event.ticket_info) {
	// 	  await sql`
	// 		INSERT INTO tickets (
	// 		  event_uuid, ticket_name, ticket_price, tickets_available
	// 		)
	// 		VALUES (
	// 		  ${eventId}, ${ticket.ticketName}, ${ticket.price}, ${ticket.capacity}
	// 		)
	// 	  `;
	// 	}
	//   }
  
	  // Commit the transaction
	  await sql.query(`COMMIT`);
  
	  return { success: true, id: eventId };
	} catch (error) {
	  // Rollback the transaction on error
	  await sql.query(`ROLLBACK`);
	  console.error('Error creating event:', error);
	  return { success: false, error };
	}
  }
  

  
// export async function insertIntoTickets(tickets_price: string, eventId: string, priceId: string) {
// 	try {

// 		await sql`
// 		INSERT INTO tickets (price_id, ticket_price, event_uuid)
// 		VALUES (${priceId}, ${tickets_price}, ${eventId}::UUID)
// 		`

// 		return { success: true }
// 	} catch (error) {
// 		console.error('Error inserting ticket into tickets table:', error);
// 		return { success: false, error };
// 	}
// }

export async function insertIntoTicketsFunction(
  eventId: string,
  tickets: Array<{
    ticketName: string;
    price: number;
    priceId: string | null;
    capacity: number | null;
  }>
) {
  try {
    // Start transaction
    const result = await sql.begin(async (tx) => {
      const ticketUUIDs: string[] = [];

      // Insert tickets
      for (const ticket of tickets) {
        const ticketResult = await tx.sql<{ ticket_uuid: string }>`
          INSERT INTO tickets (
            event_uuid,
            ticket_name,
            ticket_price,
            price_id,
            tickets_available
          )
          VALUES (
            ${eventId},
            ${ticket.ticketName},
            ${ticket.price},
            ${ticket.priceId},
            ${ticket.capacity}
          )
          RETURNING ticket_uuid
        `;
        ticketUUIDs.push(ticketResult.rows[0].ticket_uuid);
      }

      // Insert into junction table using array parameter
      await tx.sql`
        INSERT INTO event_tickets (event_uuid, ticket_uuid)
        SELECT 
          ${eventId}, 
          unnest(ARRAY[${ticketUUIDs.join(',')}]::uuid[])
      `;

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error('Database insertion error:', error);
    return {
      success: false,
      error: 'Failed to save ticket information to database',
    };
  }
}

// export async function insertIntoTickets(
// 	eventId: string,
// 	tickets: Array<{
// 	  ticketName: string;
// 	  price: number;
// 	  priceId: string | null;
// 	  capacity: number | null;
// 	}>
//   ) {
// 	try {
// 	  await sql.query('BEGIN');
	  
// 	  const ticketUUIDs = await Promise.all(
// 		tickets.map(async (ticket) => {
// 		  const res = await sql.query<{ ticket_uuid: string }>(
// 			`INSERT INTO tickets (
// 			  event_uuid,
// 			  ticket_name,
// 			  ticket_price,
// 			  price_id,
// 			  tickets_available
// 			) VALUES (
// 			  $1::uuid,
// 			  $2,
// 			  $3,
// 			  $4,
// 			  $5
// 			) RETURNING ticket_uuid`,
// 			[
// 			  eventId,
// 			  ticket.ticketName,
// 			  ticket.price,
// 			  ticket.priceId,
// 			  ticket.capacity
// 			]
// 		  );
// 		  return res.rows[0].ticket_uuid;
// 		})
// 	  );
  
// 	  // Insert into junction table
// 	  await sql.query(
// 		`INSERT INTO event_tickets (event_uuid, ticket_uuid)
// 		 SELECT $1::uuid, unnest($2::uuid[])`,
// 		[eventId, ticketUUIDs]
// 	  );
  
// 	  await sql.query('COMMIT');
// 	  return { success: true };
// 	} catch (error) {
// 	  await sql.query('ROLLBACK');
// 	  console.error('Insertion error:', error);
// 	  return { success: false, error: 'Database insertion failed' };
// 	}
//   }

//   export async function insertIntoTickets(
// 	eventId: string,
// 	tickets: Array<{
// 	  ticketName: string;
// 	  price: number;
// 	  priceId: string | null;
// 	  capacity: number | null;
// 	}>
//   ) {
// 	try {
// 	  await sql.query('BEGIN');
	  
// 	  // Insert all tickets in one query
// 	  const ticketValues = tickets.map(t => 
// 		`('${eventId}', '${t.ticketName}', ${t.price}, ${t.priceId ? `'${t.priceId}'` : 'NULL'}, ${t.capacity})`
// 	  ).join(',');
  
// 	  const ticketsRes = await sql.query(`
// 		INSERT INTO tickets (
// 		  event_uuid,
// 		  ticket_name,
// 		  ticket_price,
// 		  price_id,
// 		  tickets_available
// 		) VALUES ${ticketValues}
// 		RETURNING ticket_uuid
// 	  `);
  
// 	  const ticketUUIDs = ticketsRes.rows.map(r => r.ticket_uuid);
  
// 	  // Insert into junction table using CTE
// 	  await sql.query(`
// 		WITH inserted_tickets AS (
// 		  SELECT unnest($2::uuid[]) AS ticket_uuid
// 		)
// 		INSERT INTO event_tickets (event_uuid, ticket_uuid)
// 		SELECT $1::uuid, ticket_uuid
// 		FROM inserted_tickets
// 	  `, [eventId, ticketUUIDs]);
  
// 	  await sql.query('COMMIT');
// 	  return { success: true };
// 	} catch (error) {
// 	  await sql.query('ROLLBACK');
// 	  console.error('Insertion error:', error);
// 	  return { success: false, error: 'Database insertion failed' };
// 	}
//   }

  export async function insertIntoTickets(
	eventId: string,
	tickets: Array<{
	  ticketName: string;
	  price: number;
	  priceId: string | null;
	  capacity: number | null;
	}>
  ) {
	try {
	  await sql.query('BEGIN');
  
	  // 1. Insert tickets using parameterized queries
	  const ticketsRes = await sql.query(
		`INSERT INTO tickets (
		  event_uuid,
		  ticket_name,
		  ticket_price,
		  price_id,
		  tickets_available
		) SELECT * FROM unnest(
		  $1::uuid[],
		  $2::text[],
		  $3::numeric[],
		  $4::text[],
		  $5::integer[]
		)
		RETURNING ticket_uuid`,
		[
		  tickets.map(() => eventId), // event_uuid array
		  tickets.map(t => t.ticketName), // ticket_name array
		  tickets.map(t => t.price), // ticket_price array
		  tickets.map(t => t.priceId), // price_id array
		  tickets.map(t => t.capacity) // tickets_available array
		]
	  );
  
	  const ticketUUIDs = ticketsRes.rows.map(r => r.ticket_uuid);
  
	  // 2. Insert into junction table
	  await sql.query(
		`INSERT INTO event_tickets (event_uuid, ticket_uuid)
		 SELECT $1::uuid, unnest($2::uuid[])`,
		[eventId, ticketUUIDs]
	  );
  
	  await sql.query('COMMIT');
	  return { success: true };
	} catch (error) {
	  await sql.query('ROLLBACK');
	  console.error('Insertion error:', error);
	  return { success: false, error: 'Database insertion failed' };
	}
  }

// export async function insertIntoTickets(
// 	eventId: string,
// 	tickets: Array<{
// 	  ticketName: string;
// 	  price: number;
// 	  priceId: string | null;
// 	  capacity: number | null;
// 	}>
//   ) {
// 	try {
// 	  // Start the transaction explicitly
// 	  await sql.query(`BEGIN`);
  
// 	  const ticketUUIDs: string[] = [];
// 	  // Insert tickets one by one and collect their UUIDs
// 	  for (const ticket of tickets) {
// 		const ticketResult = await sql<{ ticket_uuid: string }>`
// 		  INSERT INTO tickets (
// 			event_uuid,
// 			ticket_name,
// 			ticket_price,
// 			price_id,
// 			tickets_available
// 		  )
// 		  VALUES (
// 			${eventId},
// 			${ticket.ticketName},
// 			${ticket.price},
// 			${ticket.priceId},
// 			${ticket.capacity}
// 		  )
// 		  RETURNING ticket_uuid
// 		`;
// 		ticketUUIDs.push(ticketResult.rows[0].ticket_uuid);
// 	  }
  
// 	  // Insert into the junction table using unnest on an array of UUIDs
// 	  await sql.query(`
// 		INSERT INTO event_tickets (event_uuid, ticket_uuid)
// 		SELECT 
// 		  '${eventId}'::uuid,
// 		  unnest(ARRAY[${ticketUUIDs.map(uuid => `'${uuid}'`).join(',')}]::uuid[])
// 	  `);
  
// 	  // Commit the transaction
// 	  await sql.query(`COMMIT`);
  
// 	  return { success: true };
// 	} catch (error) {
// 	  // Rollback the transaction if an error occurs
// 	  await sql.query(`ROLLBACK`);
// 	  console.error('Database insertion error:', error);
// 	  return {
// 		success: false,
// 		error: 'Failed to save ticket information to database',
// 	  };
// 	}
//   }
  

// export async function deleteTickets(
// 	tickets: Array<{ eventId: string; ticketName: string; price: number }>
//   ): Promise<{ success: boolean; error?: string }> {
// 	try {
// 	  // Prepare parallel arrays for unnesting
// 	  const eventIds = tickets.map(t => t.eventId);
// 	  const ticketNames = tickets.map(t => t.ticketName);
// 	  const prices = tickets.map(t => t.price);
  
// 	  const result = await sql.begin(async (tx) => {
// 		// Delete from the junction table first
// 		await tx.sql`
// 		  DELETE FROM event_tickets
// 		  WHERE ticket_uuid IN (
// 			SELECT ticket_uuid
// 			FROM tickets
// 			WHERE (event_uuid, ticket_name, ticket_price) IN (
// 			  SELECT * FROM unnest(
// 			  	ARRAY[${eventIds.join(',')}]::uuid[],
// 				ARRAY[${ticketNames.join(',')}]::text[],
// 				ARRAY[${prices.join(',')}]::numeric[]
// 			  )
// 			)
// 		  )
// 		`;

// 		// Delete from the tickets table
// 		await tx.sql`
// 		  DELETE FROM tickets
// 		  WHERE (event_uuid, ticket_name, ticket_price) IN (
// 			SELECT * FROM unnest(
// 			  	ARRAY[${eventIds.join(',')}]::uuid[],
// 				ARRAY[${ticketNames.join(',')}]::test[],
// 				ARRAY[${prices.join(',')}]::numeric[]
// 			)
// 		  )
// 		`;
  
// 		return { success: true };
// 	  });
  
// 	  return result;
// 	} catch (error) {
// 	  console.error("Database deletion error:", error);
// 	  return { success: false, error: "Failed to delete tickets" };
// 	}
// }

// export async function deleteTickets(
// 	tickets: Array<{ eventId: string; ticketId: string }>
//   ): Promise<{ success: boolean; error?: string }> {
// 	try {
// 	  // Start transaction
// 	  await sql`BEGIN`;
  
// 	  // Extract just the ticket UUIDs
// 	  const ticketIds = tickets.map(t => t.ticketId);
// 	  const eventIds = tickets.map(t => t.eventId);
  
// 	  // Delete from junction table first
// 	  await sql`
// 		DELETE FROM event_tickets
// 		WHERE ticket_uuid = ANY(unnest(ARRAY[${ticketIds.map(uuid => `'${uuid}'`).join(',')}]::uuid[]))
// 	  `;
  
// 	  // Delete from main tickets table

// 	  await sql`
// 		DELETE FROM tickets
// 		WHERE ticket_uuid = ANY(unnest(ARRAY[${ticketIds.map(uuid => `'${uuid}'`).join(',')}]::uuid[]))
// 		  AND event_uuid = ANY(unnest(ARRAY[${eventIds.map(id => `'${id}'`).join(',')}]::uuid[]))
// 	  `;
  
// 	  // Commit transaction
// 	  await sql`COMMIT`;
// 	  return { success: true };
// 	} catch (error) {
// 	  // Rollback transaction in case of error
// 	  await sql`ROLLBACK`;
// 	  console.error("Database deletion error:", error);
// 	  return { success: false, error: "Failed to delete tickets" };
// 	}
//   }
  
export async function deleteTickets(
	tickets: Array<{ eventId: string; ticketId: string }>
  ): Promise<{ success: boolean; error?: string }> {
	try {
	  await sql.query('BEGIN');
	  
	  const ticketIds = tickets.map(t => t.ticketId);
  
	  // Delete from junction table
	  await sql.query(
		`DELETE FROM event_tickets
		 WHERE ticket_uuid = ANY($1::uuid[])`,
		[ticketIds]
	  );
  
	  // Delete from main tickets table
	  await sql.query(
		`DELETE FROM tickets
		 WHERE ticket_uuid = ANY($1::uuid[])`,
		[ticketIds]
	  );
  
	  await sql.query('COMMIT');
	  return { success: true };
	} catch (error) {
	  await sql.query('ROLLBACK');
	  console.error("Deletion error:", error);
	  return { success: false, error: "Failed to delete tickets" };
	}
}


export async function fetchEventTickets(eventId: string): Promise<
  Array<{
    ticketId: string;
    ticketName: string;
    price: number;
    priceId: string | null;
    capacity: number | null;
  }>
> {
  const result = await sql<{
    ticketId: string;
    ticketName: string;
    price: number | null;
    priceId: string | null;
    capacity: number | null;
  }>`
    SELECT 
      t.ticket_uuid AS "ticketId",
      t.ticket_name AS "ticketName",
      t.ticket_price AS "price",
      t.price_id AS "priceId",
      t.tickets_available AS "capacity"
    FROM event_tickets et
    JOIN tickets t ON et.ticket_uuid = t.ticket_uuid
    WHERE et.event_uuid = ${eventId}
  `;
  return result.rows;
}



export async function fetchPriceId(eventId: string) {
	try {

		const result = await sql`
		SELECT price_id
		FROM tickets
		WHERE event_uuid::text LIKE '%' || ${eventId}
		`

		return { success: true, priceId: result.rows[0].price_id }
	} catch (error) {
		console.error('Error fetching price_id from tickets table:', eventId, error);
		return { success: false, error };
	}
}

export async function updateTicket(eventId: string, newPriceId: string, ticketPrice: string) {
    try {
        const result = await sql`
        UPDATE tickets
        SET price_id = ${newPriceId}, ticket_price = ${ticketPrice}
        WHERE event_uuid::text LIKE '%' || ${eventId}
        RETURNING price_id, ticket_price --- returns the updated price_id and ticket_price
        `;

        return { success: true, newPriceId: result.rows[0].price_id, ticketPrice: result.rows[0].ticket_price };
    } catch (error) {
        console.error('Error updating tickets table:', error);
        return { success: false, error };
    }
}


// export async function updateEvent(event: SQLEvent) {
// 	// console.log('SQL query for ', event.id)
// 	try {
// 		await sql`
// 			UPDATE events
// 			SET
// 				title = ${event.title},
// 				description = ${event.description},
// 				organiser = ${event.organiser},
// 				start_time = ${event.start_time},
// 				end_time = ${event.end_time},
// 				day = ${event.day},
// 				month = ${event.month},
// 				year = ${event.year},
// 				location_building = ${event.location_building},
// 				location_area = ${event.location_area},
// 				location_address = ${event.location_address},
// 				image_url = ${event.image_url},
// 				event_type = ${event.event_type},
// 				sign_up_link = ${event.sign_up_link ?? null},
// 				for_externals = ${event.for_externals ?? null},
// 				capacity = ${event.capacity ?? null},
// 				image_contain = ${event.image_contain}
// 			WHERE id = ${event.id}
// 		`;
// 		return { message: 'succesfully updated database', status: 200 };
// 	} catch (error) {
// 		console.error('Error updating event:', error);
// 		return { message: 'failed to update database with event', status: 500, error };
// 	}
// }


export async function updateEvent(dataToUpdate: FormData, id: string) {
	try {
	  const sqlEvent = await createSQLEventObject(dataToUpdate);
	//   await sql.begin(async (tx) => {
		// Update event details
		await sql`
		  UPDATE events
		  SET
			title = ${sqlEvent.title},
			description = ${sqlEvent.description},
			organiser = ${sqlEvent.organiser},
			organiser_uid = ${sqlEvent.organiser_uid},
			start_time = ${sqlEvent.start_time},
			end_time = ${sqlEvent.end_time},
			day = ${sqlEvent.day},
			month = ${sqlEvent.month},
			year = ${sqlEvent.year},
			location_building = ${sqlEvent.location_building},
			location_area = ${sqlEvent.location_area},
			location_address = ${sqlEvent.location_address},
			image_url = ${sqlEvent.image_url},
			event_type = ${sqlEvent.event_type},
			sign_up_link = ${sqlEvent.sign_up_link ?? null},
			for_externals = ${sqlEvent.for_externals ?? null},
			image_contain = ${sqlEvent.image_contain}
		  WHERE id::TEXT LIKE '%' || ${id}
		`;
  
	// 	// If ticket info is provided, update the tickets
	// 	if (dataToUpdate.tickets_info && dataToUpdate.tickets_info.length > 0) {
	// 	  // Remove existing tickets associated with the event
	// 	  await tx.sql`
	// 		DELETE FROM tickets WHERE event_uuid::TEXT LIKE '%' || ${id}
	// 	  `;
  
	// 	  // Insert the new ticket info
	// 	  for (const ticket of dataToUpdate.tickets_info) {
	// 		await tx.sql`
	// 		  INSERT INTO tickets (
	// 			event_uuid,
	// 			ticket_name,
	// 			ticket_price,
	// 			tickets_available
	// 		  )
	// 		  VALUES (
	// 			${id},
	// 			${ticket.ticketName},
	// 			${ticket.price},
	// 			${ticket.capacity}
	// 		  )
	// 		`;
	// 	  }
	// 	}
	//   });

	  return { message: 'successfully updated main event in events', status: 200 };
	} catch (error) {
	  console.error('Error updating event:', error);
	  return { message: 'failed to update database with event', status: 500, error };
	}
  }
  


export async function deleteEvents(eventIds: string[]): Promise<void> {
	try {
		if (eventIds.length === 0) {
			throw new Error('No event IDs provided for deletion');
		}

		const jsonEventIds = eventIds.map(id => ({ id }));

		// Begin a transaction
		await sql.query(`BEGIN`);

		// Delete the related event
		await sql.query(
			`DELETE FROM events
            WHERE id IN (SELECT id FROM json_populate_recordset(NULL::events, $1))`,
			[JSON.stringify(jsonEventIds)]
		);

		// Delete the related ticket products
		await sql.query(
			`DELETE FROM tickets
			WHERE event_uuid IN (SELECT id FROM json_populate_recordset(NULL::events, $1))`,
			[JSON.stringify(jsonEventIds)]
		);

		// Commit the transaction
		await sql.query(`COMMIT`);


		console.log(`Deleted ${eventIds.length} events.`);
	} catch (error) {
		console.error('Database error during deletion:', error);
		throw new Error('Failed to delete events');
	}
}

export async function insertContactForm(form: ContactFormInput) {
	try {
		await sql`
		INSERT INTO contact_forms (name, email, message)
		VALUES (${form.name}, ${form.email}, ${form.message})
		`
		return { success: true };
	} catch (error) {
		console.error('Error adding contact form item:', error);
		return { success: false, error };
	}
}

export async function fetchAllContactForms() {
	try {
		const data = await sql<ContactFormInput>`SELECT * FROM contact_forms`
		return data.rows
	} catch (error) {
		console.error('Database error:', error)
		throw new Error('Failed to fetch contact form data')
	}
}

export async function fetchAccountInfo(id: string) {
	try {
		const data = await sql`
		SELECT logo_url, description, website, tags
		FROM society_information
		WHERE user_id = ${id} 
		LIMIT 1
		`
		return data.rows[0];
	} catch (error) {
		console.error('Database error:', error)
		throw new Error('Failed to fetch account information from society information table')
	}
}

export async function fetchAccountLogo(id: string) {
	try {
		const data = await sql`
		SELECT logo_url
		FROM society_information
		WHERE user_id = ${id} 
		LIMIT 1
		`
		return data.rows[0];
	} catch (error) {
		console.error('Database error:', error)
		throw new Error('Failed to fetch account logo from society information table')
	}
}

export async function seedPredefinedTags(predefinedTags: Tag[]) {
	try {
		for (const tag of predefinedTags) {
			await sql`
			INSERT INTO tags (label, value)
			VALUES (${tag.label}, ${tag.value})
			ON CONFLICT (value) DO NOTHING
			`;
		}
		console.log('Tags seeded successfully!');
		return { success: true };
	} catch (error) {
        console.error('Error seeding tags:', error);
		throw new Error('Failed to seed tags');
	}
}

export async function fetchPredefinedTags() {
    try {
        // Assuming you have some database query function like `sql`
        const tags = await sql`
            SELECT value, label FROM tags;
        `;
        
        // Return the fetched tags in the format { value, label }
        return tags.rows.map(tag => ({
            value: tag.value,
            label: tag.label
        })) as Tag[];
    } catch (error) {
        console.error('Error fetching predefined tags:', error);
        throw new Error('Failed to fetch predefined tags');
    }
}

export async function updateDescription(id: string, newDescription: string) {
	try {
		await sql`
		UPDATE society_information
		SET description = ${newDescription}
		WHERE user_id = ${id} 
		`
		return { success: true };
	} catch (error) {
		console.error('Database error:', error)
		throw new Error('Failed to update description in users table')
	}
}

export async function updateAccountInfo(id: string, data: OrganiserAccountEditFormData) {
	try {
		// console.log(data.tags); // debugging
		const formattedTags = `{${data.tags.join(',')}}`; // Format as an array string. Below, cast from string[] to text[]
	  	await sql`
		UPDATE society_information
		SET 
			logo_url = ${data.imageUrl},
			description = ${data.description},
			website = ${data.website},
			tags = ${formattedTags}::integer[]  -- Cast to integer[]
		WHERE user_id = ${id}
	    `;
	  	return { success: true };
	} catch (error) {
	  	console.error('Database error:', error);
	  	throw new Error('Failed to update account information in users table');
	}
}

export async function getOrganiser(id: string) {
	try {
	
		const data = await sql`
			SELECT u.id, u.name, society.description, society.website, society.tags, society.logo_url
			FROM users AS u
			JOIN society_information AS society ON society.user_id = u.id
			WHERE u.role = 'organiser' 
			AND u.id=${id}
			AND u.name != 'Just A Little Test Society'  -- Exclude the test society
			AND u.is_test_account = FALSE -- Exclude all test accounts
		`;
  
		return data.rows || null;
	} catch (error) {
		console.error('Database error:', error);
	  	throw new Error(`Failed to get details for a specific organiser`);
	}
}

export async function getOrganiserName(id: string) {
	try {
	
		const data = await sql`
			SELECT name
			FROM users
			WHERE role = 'organiser' 
			AND id=${id}
			AND name != 'Just A Little Test Society'  -- Exclude the test society
			AND is_test_account = FALSE -- Exclude all test accounts
		`;
  
		return data.rows[0] || null;
	} catch (error) {
		console.error('Database error:', error);
	  	throw new Error(`Failed to get details for a specific organiser`);
	}
}

export async function getOrganiserCards(page: number, limit: number) {
	try {
		const offset: number = (page - 1) * limit;
	
		const data = await sql`
			SELECT u.id, u.name, society.description, society.website, society.tags, society.logo_url
			FROM users as u
            JOIN society_information AS society ON society.user_id = u.id
			WHERE u.role = 'organiser'
			AND u.name != 'Just A Little Test Society'  -- Exclude the test society
			AND u.is_test_account = FALSE -- Exclude all test accounts
			LIMIT ${limit} OFFSET ${offset}
		`;
  
		return data.rows;
	} catch (error) {
		console.error('Database error:', error);
	  	throw new Error(`Failed to get organiser card details for page ${page.toString()}, and limit ${limit.toString()}`);
	}
}

export async function getAllOrganiserCards() {
	try {
		const data = await sql`
			SELECT u.id, u.name, society.description, society.website, society.tags, society.logo_url
			FROM users as u
            JOIN society_information AS society ON society.user_id = u.id
			WHERE u.role = 'organiser'
			AND u.name != 'Just A Little Test Society'  -- Exclude the test society
			AND u.is_test_account = FALSE -- Exclude all test accounts
		`;
  
		return data.rows;
	} catch (error) {
		console.error('Database error:', error);
	  	throw new Error('Failed to get all organiser card details');
	}
}

// MARK: Insert 'users'
export async function insertUser(formData: UserRegisterFormData) {
	try {
		const hashedPassword = await bcrypt.hash(formData.password, 10);
		const username = `${capitalize(formData.firstname)} ${capitalize(formData.surname)}`

		const result = await sql`
			INSERT INTO users (name, email, password)
			VALUES (${username}, ${formData.email}, ${hashedPassword})
			ON CONFLICT (email) DO NOTHING
			RETURNING id
		`;

		console.log(`Created a user with id: ${result.rows[0].id}`)

		return { success: true, id: result.rows[0].id };
	} catch (error) {
		console.error('Error creating user:', error);
		return { success: false, error };
	}
}

export async function insertUserInformation(formData: UserRegisterFormData, userId: string) {
	const formattedDOB = formatDOB(formData.dob) // Currently just leaves in yyyy-mm-dd form
	const university = selectUniversity(formData.university, formData.otherUniversity) // if 'other' selected, uses text input entry
	try {
		await sql`
			INSERT INTO user_information (user_id, gender, birthdate, referrer, university_attended, graduation_year, course, level_of_study, newsletter_subscribe)
        	VALUES (${userId}, ${formData.gender}, ${formattedDOB}, ${formData.referrer}, ${university}, ${formData.graduationYear}, ${formData.degreeCourse}, ${formData.levelOfStudy}, ${formData.isNewsletterSubscribed})
		`
		return { success: true };
	} catch (error) {
		console.error('Error creating user_information:', error);
		return { success: false, error };
	}
}


export async function insertOrganiserIntoUsers(formData: SocietyRegisterFormData) { 
	try {
		const hashedPassword = await bcrypt.hash(formData.password, 10);
		const name = formData.name.split(' ').map(capitalize).join(' ')
		
		const result = await sql`
			INSERT INTO users (name, email, password, role)
			VALUES (${name}, ${formData.email}, ${hashedPassword}, ${'organiser'})
			ON CONFLICT (email) DO NOTHING
			RETURNING id
		`;

		console.log(`Created a organiser with id: ${result.rows[0].id}`)

		return { success: true, id: result.rows[0].id };
	} catch (error) {
		console.error('Error creating organiser:', error);
		return { success: false, error };
	}
}

export async function insertOrganiserInformation(formData: SocietyRegisterFormData, userId: string) {
	try {
		const formattedTags = `{${formData.tags.join(',')}}`; // Format as an array string. Below, cast from string[] to text[]
		const university = selectUniversity(formData.university, formData.otherUniversity) // if 'other' selected, uses text input entry

		await sql`
			INSERT INTO society_information (user_id, logo_url, description, website, tags, university_affiliation)
			VALUES (${userId}, ${formData.imageUrl}, ${formData.description}, ${formData.website}, ${formattedTags}::integer[], ${university})
		`;
		return { success: true }
	} catch (error) {
		console.log('Error creating society_information', error)
		return { success: false, error }
	}
}

export async function insertCompany(formData: CompanyRegisterFormData) {
	try {
		const hashedPassword = await bcrypt.hash(formData.password, 10);
		const name = formData.companyName.split(' ').map(capitalizeFirst).join(' ')

		const result = await sql`
			INSERT INTO users (name, email, password, role)
			VALUES (${name}, ${formData.contactEmail}, ${hashedPassword}, ${'company'})
			ON CONFLICT (email) DO NOTHING
			RETURNING id
		`
		console.log(`Created a company with id: ${result.rows[0].id}`)
		return { success: true, id: result.rows[0].id };
	} catch (error) {
		console.error('Error creating user:', error);
		return { success: false, error };
	}
}

export async function insertCompanyInformation(formData: CompanyRegisterFormData, companyId: string) {
	try {
		const formattedMotivations = `{${formData.motivation.join(',')}}`
		await sql`
			INSERT INTO company_information (user_id, contact_name, contact_email, description, website, logo_url, motivation)
        	VALUES (${companyId}, ${formData.contactName}, ${formData.contactEmail}, ${formData.description}, ${formData.website}, ${formData.imageUrl}, ${formattedMotivations})
		`
		return { success: true };
	} catch (error) {
		console.error('Error creating company_information:', error);
		return { success: false, error };
	}
}

// /register/student: Fetches all organisers in order to identify referrers 
export async function fetchOrganisers() {
	try {
		const data = await sql<{ name: string }>`
			SELECT name FROM users
			WHERE role = 'organiser' 
			AND name != 'Just A Little Test Society'
			AND is_test_account = FALSE -- Exclude all test accounts
		`;
		return data.rows.map(row => row.name);
	} catch (error) {
		console.error('Database error:', error);
		throw new Error('Failed to fetch organisers');
	}
}

export async function updatePassword(email: string, password: string) {
	console.log(`Resetting ${email} password to ${password}`);
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		await sql`
			UPDATE users
			SET 
				password = ${hashedPassword}
			WHERE email = ${email} --- Email is UNIQUE among users table
		`
		return { success: true };
	} catch (error) {
		console.error('Error updating user password');
		return { success: false, error };
	}
}

export async function setEmailVerifiedField(email: string, token: string) {
	console.log(`setting email verified for ${email}`);
	try {
		await sql`
			UPDATE users
			SET 
				emailverified = true
			WHERE email = ${email} --- Email is UNIQUE among users table
		`

		// Remove the Redis token entry
		const tokenKey = `verification_token:${token}`;
		await redis.del(tokenKey); // Delete the token from Redis after successful update

		return { success: true };
	} catch (error) {
		console.error('Error updating user password');
		return { success: false, error };
	}
}

export async function checkSocietyName(name: string) {
	try {
		const societyName = name.split(' ').map(capitalizeFirst).join(' ')
		const result = await sql`
			SELECT name FROM users
			WHERE name = ${societyName}
			LIMIT 1
		`
		if (result.rows.length > 0) {
			return { success: true, nameTaken: true }
		} else {
			return { success: true, nameTaken: false }
		}
	} catch (error) {
		console.error('Error checking name:', error)
		return { success: false, error }
	}
}

export async function checkOrganisationName(name: string) {
	try {
		const organisationName = name.split(' ').map(capitalizeFirst).join(' ')
		const result = await sql`
			SELECT name FROM users
			WHERE name = ${organisationName} AND role = 'company'
			LIMIT 1
		`
		if (result.rows.length > 0) {
			return { success: true, nameTaken: true }
		} else {
			return { success: true, nameTaken: false }
		}
	} catch (error) {
		console.error('Error checking name:', error)
		return { success: false, error }
	}
}

export async function checkEmail(email: string) {
	try {
		const result = await sql`
			SELECT id FROM users
			WHERE email = ${email}
			LIMIT 1
		`
		if (result.rows.length > 0) {
			return { success: true, emailTaken: true }
		} else {
			return { success: true, emailTaken: false }
		}
	} catch (error) {
		console.error('Error checking email:', error)
		return { success: false, error }
	}
}

export async function getEmailFromId(id: string) {
	try {
		const data = await sql`
			SELECT email 
			FROM users
			WHERE role='organiser' and id::text LIKE '%' || ${id};
			LIMIT 1
		`
		
		return data.rows[0] || null;
	} catch (error) {
		console.error('Error checking email:', error)
		throw new Error('Failed to retrieve email for a specific organiser');
	}
}

export async function fetchOrganiserEmailFromEventId(event_id: string) {
	try {
		const data = await sql<{ email: string }>`
			SELECT users.email
			FROM events
			JOIN users ON events.organiser_uid = users.id
			WHERE users.role='organiser' AND events.id::text LIKE '%' || ${event_id}
			LIMIT 1;
		`
		if (!data.rowCount || !data.rows[0]?.email) {
			return null
		} else {
			return data.rows[0].email;
		}
	} catch (error) {
		console.error('Error checking email:', error)
		throw new Error('Failed to retrieve email for a specific organiser');
	}
}

export async function checkIfRegistered(event_id: string, user_id: string) {
	try {
		const result = await sql`
			SELECT id FROM event_registrations
			WHERE event_id = ${event_id} AND user_id = ${user_id}
			LIMIT 1
		`;
		return result.rows.length > 0;
	} catch (error) {
		console.error('Error checking registration status:', error)
		return false // Assume unregistered
	}
}

export async function registerForEvent(user_id: string, user_email: string, user_name: string, event_id: string, ticket_to_quantity: Map<string, number>) {
	try {
		await sql.query(`BEGIN`);

		for (const id of Object.keys(ticket_to_quantity)) { // first check if user has any of the requested tickets.
			let result = await sql`
			SELECT *
			FROM event_registrations
			WHERE event_id::TEXT LIKE '%' || ${event_id} AND
			ticket_uuid::TEXT LIKE '%' || ${id} AND
			user_id::TEXT LIKE '%' || ${user_id};
			`

			if (result.rowCount === 0) {
				await sql` -- add the new tickets
				INSERT INTO event_registrations (event_id, user_id, name, email, ticket_uuid, quantity)
				VALUES (${event_id}, ${user_id}, ${user_name}, ${user_email}, ${id}, ${ticket_to_quantity[id]})
				`

				await sql` -- update the tickets available
				UPDATE tickets (tickets_available)
				VALUES (tickets_available - ${ticket_to_quantity[id]})
			    WHERE ticket_uuid::TEXT LIKE '%' || ${id};
				`
			} else {
				await sql` -- increase the quantity for existing ticket
				UPDATE event_registrations (quantity)
				VALUES (quantity + ${ticket_to_quantity[id]})
				WHERE event_id::TEXT LIKE '%' || ${event_id} AND
			    ticket_uuid::TEXT LIKE '%' || ${id} AND
				user_id::TEXT LIKE '%' || ${user_id};
				`
				await sql` -- update the tickets available
				UPDATE tickets (tickets_available)
				VALUES (tickets_available - ${ticket_to_quantity[id]})
				WHERE ticket_uuid::TEXT LIKE '%' || ${id};
				`
			}
		}

		await sql.query(`COMMIT`);

		return { success: true }
	} catch (error) {

		console.error('Error registering user for event:', error);
		await sql.query(`ROLLBACK`);
		return { success: false, registered: false };
	}
}

export async function getRegistrationsForEvent(event_id: string) {
	try {
		const result = await sql<SQLRegistrations>`
		SELECT user_id, name, email, created_at
		FROM event_registrations
		WHERE event_id = ${event_id}
		`
		const registrations = result.rows.map(convertSQLRegistrationsToRegistrations);
		console.log(`Got back ${registrations}`)
		return { success: true, registrations: registrations }
	} catch (error) {
		return { success: false }
	}
}

export async function insertToken(email: string, token: string, purpose: string, customExpiry: number = 3600): Promise<InsertTokenResult> {
    try {

        let tokenKey: string;
        let emailKey: string;

        switch (purpose) {
            case 'reset':
                tokenKey = `reset_password_token:${token}`;
                emailKey = `reset_password_email:${email}`;
                break;
            case 'verify':
                tokenKey = `verification_token:${token}`;
                emailKey = `verification_email:${email}`;
                break;
            default:
                console.error('Invalid token purpose:', purpose);
                return { success: false };
        }

        // Set the token and email in Redis with a 60-minute expiry (3600 seconds)
        const expiryInSeconds = customExpiry || 3600; // 60 minutes

        // Use a pipeline for atomicity (important!)
        const pipeline = redis.pipeline();
        pipeline.set(tokenKey, email, 'EX', expiryInSeconds); // Maps token to email
        pipeline.set(emailKey, token, 'EX', expiryInSeconds); // Maps email to token

        const results = await pipeline.exec();

        // Check if both SET operations were successful. Pipeline.exec returns an array of results
        // where each result is [error, result]. A null error means success.
        if (results && results.length === 2 && results[0][0] === null && results[1][0] === null) {
            console.log(`Verification token for email ${email} inserted/updated successfully.`);
            return { success: true };
        } else {
            // Handle cases where one or both SET operations failed
            console.error('Failed to set both token and email in Redis:', results);
            return { success: false };
        }

    } catch (error) {
        console.error('Error inserting verification token:', error);
        return { success: false }; // Return false on any error
    }
}

export async function getEmailFromToken(token: string, type: string) { // type is 'verification' or 'reset_password'
	try {

		const tokenKey = `${type}_token:${token}`;
	
		// Fetch the email associated with the token from Redis
		const email = await redis.get(tokenKey);
  
		if (!email) {
			// If no email is found, the token is invalid or expired
			console.log('No email found for the provided token');
			return { success: false, error: 'Invalid or expired token' };
		}
  
		// console.log(`Email ${email} found for token ${token}`);
		return { success: true, email };
	} catch (error) {
		console.error('Error fetching email for token:', error);
		return { success: false, error };
	}
}

export async function validateToken(token: string, type: string): Promise<string> { // type is 'verification' or 'reset_password'
	try {
		console.log('function validateToken invoked');
		const tokenKey = `${type}_token:${token}`;
		
		// Check if the token exists in Redis
		const tokenExpiry = await redis.get(tokenKey);
		
		if (!tokenExpiry) {
			return 'invalid'; 
		}
		
		// Compare the token's expiry time with the current time
		const currentTime = new Date();
		const expiryTime = new Date(tokenExpiry);
		
		if (expiryTime < currentTime) {
			await redis.del(tokenKey);
			return 'expired';
		}
		
		return 'valid'; 
	} catch (error) {
		console.error('Error checking password reset token:', error);
		return 'invalid';
	}
}

export async function findUniqueForgottenPasswordEmails() {
	try {
		const result = await sql`
			SELECT DISTINCT email
			FROM contact_forms
			WHERE email != 'test@lsn.co.uk'
			AND message LIKE 'Forgotten Password request for email%';
		`;
  
	  	return result.rows;;
	} catch (error) {
		console.error('Error fetching unique forgotten password emails:', error);
		return []; // Return empty array on error
	}
}

export async function cleanupForgottenPasswordEmails() {
	try {
		await sql`
			DELETE FROM contact_forms
			WHERE email != 'test@lsn.co.uk'
			AND message LIKE 'Forgotten Password request for email%';
		`;
		  
	  	return { success: true };
	} catch (error) {
		console.error('Error cleaning up forgotten password emails:', error);
		return { success: false, error: error.message };
	}
}

export async function insertAccountId(userId: string, accountId: string) {
    try {
        await sql`
            UPDATE society_information
            SET connect_account_id = ${accountId}
            WHERE user_id::text LIKE '%' || ${userId};
        `;
        return { success: true };
    } catch (error) {
        console.error('Error updating connect_account_id:', error);
        return { success: false };
    }
}

export async function fetchAccountId(userId: string) {
    try {

		// Validate UUID format first
		// if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
		// 	console.log('not uuid form!!!');
		// 	console.log(userId);
		// 	return { success: false, accountId: '' };
		// }

		// console.log(userId);

        const data = await sql`
			SELECT connect_account_id
            FROM society_information
            WHERE user_id::TEXT LIKE '%' || ${userId};
        `;

        return data.rows[0]?.connect_account_id 
            ? { success: true, accountId: data.rows[0].connect_account_id }
            : { success: true, accountId: '' };

    } catch (error) {
        console.error('Error fetching connect_account_id:', error);
        return { success: false };
    }
}

export async function fetchAccountIdByEvent(eventId: string) {
	try {
		const eventResponse = await sql`
			SELECT organiser_uid
			FROM events
			WHERE id::text LIKE '%' || ${eventId}
		`;

		// 2. Proper empty check
		if (!eventResponse.rowCount || !eventResponse.rows[0]?.organiser_uid) {
			return { success: false };
	  	}

		const userId = eventResponse.rows[0].organiser_uid;

        const accountResponse = await sql`
			SELECT connect_account_id
            FROM society_information
           	WHERE user_id::text LIKE '%' || ${userId}
        `;


		// 4. Proper account ID validation
		if (!accountResponse.rowCount || !accountResponse.rows[0]?.connect_account_id) {
			return { success: false, accountId: '' };
		}

		return { 
			success: true, 
			accountId: accountResponse.rows[0].connect_account_id 
		};

    } catch (error) {
        console.error('Error fetching connect_account_id:', error);
        return { success: false };
    }
}

export async function checkCapacity(eventId: string) {
    try {
        // Query to count the number of registrations for the given event ID
        const registrationResult = await sql`
            SELECT COUNT(*) AS registration_count
            FROM event_registrations
            WHERE event_id::TEXT LIKE '%' || ${eventId};
        `;
        const registrationCount = parseInt(registrationResult.rows[0].registration_count, 10);

        // Query to retrieve the capacity from the events table for the given event ID
        const capacityResult = await sql`
            SELECT capacity
            FROM events
            WHERE id::TEXT LIKE '%' || ${eventId};
        `;
        const capacity = capacityResult.rows[0]?.capacity;

        // Return the registration count and capacity
		if (typeof registrationCount !== 'number' || typeof capacity !== 'number') {
			throw new Error('unexpected data types for registration count and event capacity');
		}

        return { success: true, spaceAvailable: (registrationCount >= capacity) };
    } catch (error) {
        console.error('Error in checkCapacity:', error);
        return { success: false, error: error.message};
    }
}
