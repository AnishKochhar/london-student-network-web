import { sql } from '@vercel/postgres';
import { SQLEvent, ContactFormInput, SocietyRegisterFormData, UserRegisterFormData, SQLRegistrations, OrganiserAccountEditFormData } from './types';
import { convertSQLEventToEvent, formatDOB, selectUniversity, capitalize, convertSQLRegistrationsToRegistrations, capitalizeFirst } from './utils';
import bcrypt from 'bcrypt';
import { Tag } from './types';

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
        const events = await sql`
            SELECT * FROM events
            WHERE organiser_uid = ${organiser_uid}
            ORDER BY start_time ASC
        `;
        
        return events.rows.map(convertSQLEventToEvent)
    } catch (error) {
        console.error('Error fetching user events:', error);
        throw new Error('Unable to fetch user\'s events')
    }
}

export async function insertEvent(event: SQLEvent) {
	try {
		await sql`
		INSERT INTO events (title, description, organiser, organiser_uid, start_time, end_time, day, month, year, location_building, location_area, location_address, image_url, event_type, sign_up_link, for_externals, capacity)
		VALUES (${event.title}, ${event.description}, ${event.organiser}, ${event.organiser_uid}, ${event.start_time}, ${event.end_time}, ${event.day}, ${event.month}, ${event.year}, ${event.location_building}, ${event.location_area}, ${event.location_address}, ${event.image_url}, ${event.event_type}, ${event.sign_up_link ?? null}, ${event.for_externals ?? null}, ${event.capacity ?? null})
		`
		return { success: true };
	} catch (error) {
		console.error('Error creating event:', error);
		return { success: false, error };
	}
}

export async function updateEvent(event: SQLEvent) {
	console.log('SQL query for ', event.id)
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
				capacity = ${event.capacity ?? null}
			WHERE id = ${event.id}
		`;
		return { success: true };
	} catch (error) {
		console.error('Error updating event:', error);
		return { success: false, error };
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
		FROM users
		WHERE id = ${id} 
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
		FROM users
		WHERE id = ${id} 
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
        }));
    } catch (error) {
        console.error('Error fetching predefined tags:', error);
        throw new Error('Failed to fetch predefined tags');
    }
}

export async function updateDescription(id: string, newDescription: string) {
	try {
		await sql`
		UPDATE users
		SET description = ${newDescription}
		WHERE id = ${id} 
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
		UPDATE users
		SET 
			logo_url = ${data.imageUrl},
			description = ${data.description},
			website = ${data.website},
			tags = ${formattedTags}::text[] 
		WHERE id = ${id}
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
			SELECT id, name, description, website, tags, logo_url
			FROM users
			WHERE role = 'organiser' 
			AND id=${id}
			AND name != 'Just A Little Test Society'  -- Exclude the test society
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
			SELECT id, name, description, website, tags, logo_url
			FROM users
			WHERE role = 'organiser'
			AND name != 'Just A Little Test Society'  -- Exclude the test society
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
			SELECT id, name, description, website, tags, logo_url
			FROM users
			WHERE role = 'organiser'
			AND name != 'Just A Little Test Society'  -- Exclude the test society
		`;
  
		return data.rows;
	} catch (error) {
		console.error('Database error:', error);
	  	throw new Error('Failed to get all organiser card details');
	}
}

export async function insertOrganiser(formData: SocietyRegisterFormData) {
	try {
		const hashedPassword = await bcrypt.hash(formData.password, 10);
		const name = formData.name.split(' ').map(capitalize).join(' ')
		
		await sql`
			INSERT INTO users (name, email, password, role, logo_url)
			VALUES (${name}, ${formData.email}, ${hashedPassword}, ${'organiser'}, ${formData.imageUrl})
			ON CONFLICT (email) DO NOTHING
		`;

		return { success: true };
	} catch (error) {
		console.error('Error creating user:', error);
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

export async function insertUser(formData: UserRegisterFormData) {
	try {
		const hashedPassword = await bcrypt.hash(formData.password, 10);
		const username = `${capitalize(formData.firstname)} ${capitalize(formData.surname)}`
		
		const result =  await sql`
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

export async function getEmail(id: string) {
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