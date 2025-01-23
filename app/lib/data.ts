import { sql } from '@vercel/postgres';
import { SQLEvent, ContactFormInput, SocietyRegisterFormData, UserRegisterFormData, SQLRegistrations, OrganiserAccountEditFormData, CompanyRegisterFormData, InsertTokenResult } from './types';
import { convertSQLEventToEvent, formatDOB, selectUniversity, capitalize, convertSQLRegistrationsToRegistrations, capitalizeFirst, FallbackStatistics } from './utils';
import bcrypt from 'bcrypt';
import { Tag } from './types';
import { getRedisClient } from './config';
import { UUID } from 'crypto';

const redis = getRedisClient();

// needs organisation

export async function fetchWebsiteStats() {
	// return FallbackStatistics
	try {
		const stats = await sql`
        SELECT
            (SELECT COUNT(*) FROM events) AS total_events,
            (SELECT COUNT(DISTINCT university_attended) FROM user_information) AS total_universities,
            (SELECT COUNT(*) FROM users WHERE role = 'organiser') AS total_societies
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
		WHERE id = ${eventId}
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

export async function fetchAllUpcomingEvents() {
	try {
		const data = await sql<SQLEvent>`
			SELECT * FROM events
			WHERE (year, month, day) >= (EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(DAY FROM CURRENT_DATE))
			ORDER BY year, month, day
		`;
		return data.rows.map(convertSQLEventToEvent);
	} catch (error) {
		console.error('Database error:', error);
		throw new Error('Failed to fetch upcoming events');
	}
}

export async function fetchUpcomingEvents() {
	try {
		const data = await sql<SQLEvent>`
			SELECT * FROM events
			WHERE (year, month, day) >= (EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(DAY FROM CURRENT_DATE))
			ORDER BY year, month, day
			LIMIT 5
		`;
		return data.rows.map(convertSQLEventToEvent);
	} catch (error) {
		console.error('Database error:', error);
		throw new Error('Failed to fetch upcoming events');
	}
}

export async function fetchUserEvents(organiser_uid: string) {
	try {
        const events = await sql<SQLEvent & { ticket_price: string }>`
            SELECT e.*, t.ticket_price
            FROM events e
            LEFT JOIN tickets t ON e.id = t.event_uuid
            WHERE e.organiser_uid = ${organiser_uid}
            ORDER BY e.start_time ASC
        `;
        console.log(events.rows.map(convertSQLEventToEvent));
        return events.rows.map(row => ({
            ...convertSQLEventToEvent(row),
            tickets_price: row.ticket_price
        }));
    } catch (error) {
        console.error('Error fetching user events:', error);
        throw new Error('Unable to fetch user\'s events')
    }
}


export async function fetchEventById(id: string) {
	try {
		const result1 = await sql<SQLEvent>`
			SELECT *
			FROM events
			WHERE id::text LIKE '%' || ${id};
		`;

		const result2 = await sql<{ ticket_price: string }>`
			SELECT ticket_price
			FROM tickets
			WHERE event_uuid::text LIKE '%' || ${id};
		`;
		// , tickets_price: result2.rows[0]?.ticket_price || '0'

		return {
			...convertSQLEventToEvent(result1.rows[0]),
			tickets_price: result2.rows[0]?.ticket_price || '0'
		};
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

export async function insertEvent(event: SQLEvent) {
	try {
		const result = await sql`
		INSERT INTO events (title, description, organiser, organiser_uid, start_time, end_time, day, month, year, location_building, location_area, location_address, image_url, event_type, sign_up_link, for_externals, capacity, image_contain)
		VALUES (${event.title}, ${event.description}, ${event.organiser}, ${event.organiser_uid}, ${event.start_time}, ${event.end_time}, ${event.day}, ${event.month}, ${event.year}, ${event.location_building}, ${event.location_area}, ${event.location_address}, ${event.image_url}, ${event.event_type}, ${event.sign_up_link ?? null}, ${event.for_externals ?? null}, ${event.capacity ?? null}, ${event.image_contain})
		RETURNING id
		`

		// Get the id of the newly inserted event
		const eventId = result.rows[0].id;

		// Insert into the tickets table using the event id and ticket price

		
		return { success: true, id: eventId };
	} catch (error) {
		console.error('Error creating event:', error);
		return { success: false, error };
	}
}

export async function insertIntoTickets(tickets_price: string, eventId: string, priceId: string) {
	try {

		await sql`
		INSERT INTO tickets (price_id, ticket_price, event_uuid)
		VALUES (${priceId}, ${tickets_price}, ${eventId}::UUID)
		`

		return { success: true }
	} catch (error) {
		console.error('Error inserting ticket into tickets table:', error);
		return { success: false, error };
	}
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


export async function updateEvent(event: SQLEvent) {
	// console.log('SQL query for ', event.id)
	try {
		await sql`
			UPDATE events
			SET
				title = ${event.title},
				description = ${event.description},
				organiser = ${event.organiser},
				start_time = ${event.start_time},
				end_time = ${event.end_time},
				day = ${event.day},
				month = ${event.month},
				year = ${event.year},
				location_building = ${event.location_building},
				location_area = ${event.location_area},
				location_address = ${event.location_address},
				image_url = ${event.image_url},
				event_type = ${event.event_type},
				sign_up_link = ${event.sign_up_link ?? null},
				for_externals = ${event.for_externals ?? null},
				capacity = ${event.capacity ?? null},
				image_contain = ${event.image_contain}
			WHERE id = ${event.id}
		`;
		return { message: 'succesfully updated database', status: 200 };
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

		// Use json_populate_recordset to delete the events by ID
		await sql.query(
			`DELETE FROM events
             WHERE id IN (SELECT id FROM json_populate_recordset(NULL::events, $1))`,
			[JSON.stringify(jsonEventIds)]
		);


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
		throw new Error('Failed to fetch account information from users table')
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
		throw new Error('Failed to fetch account logo from users table')
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
			WHERE role = 'organiser' AND name != 'Just A Little Test Society'
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
			WHERE role='organiser' and id = ${id} --- we really want to ensure no user email is leaked by accident
			LIMIT 1
		`
		
		return data.rows[0] || null;
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

export async function registerForEvent(user_id: string, user_email: string, user_name: string, event_id: string) {
	try {
		await sql`
		INSERT INTO event_registrations (event_id, user_id, name, email)
		VALUES (${event_id}, ${user_id}, ${user_name}, ${user_email})
		`
		return { success: true }
	} catch (error) {
		console.error('Error registering user for event:', error)
		return { success: false, registered: false }
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
