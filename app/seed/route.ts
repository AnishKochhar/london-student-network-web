import { db } from '@vercel/postgres';
const client = await db.connect();

/*  UNCOMMENT THE ABOVE LINES TO USE DATABASE  */

//import bcrypt from 'bcrypt';
//import { users } from '../lib/placeholder-data';


// async function seedUsers() {
// 	await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
// 	await client.sql`
// 	  CREATE TABLE IF NOT EXISTS users (
// 		id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
// 		name VARCHAR(255),
// 		email VARCHAR(255) UNIQUE NOT NULL,
// 		password VARCHAR(255) NOT NULL,
// 		role VARCHAR(20) DEFAULT 'user',
// 		emailVerified BOOLEAN DEFAULT false
// 	  );
// 	`;

// 	const insertedUsers = await Promise.all(
// 		users.map(async (user) => {
// 			const hashedPassword = await bcrypt.hash(user.password, 10);
// 			return client.sql`
// 				INSERT INTO users (name, email, password, role, emailVerified)
// 				VALUES (${user.name}, ${user.email}, ${hashedPassword}, ${user.role}, ${user.emailVerified})
// 				ON CONFLICT (email) DO NOTHING;
// 			`;
// 		}),
// 	);

// 	return insertedUsers;
// }


// async function seedEvents() {
// await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
// await client.sql`
//   CREATE TABLE IF NOT EXISTS events (
// 	id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
// 	title VARCHAR(255) NOT NULL,
// 	description TEXT, 
// 	organiser VARCHAR(225) NOT NULL,
// 	organiser_uid UUID NOT NULL,
// 	start_time VARCHAR(255),
// 	end_time VARCHAR(255),
// 	day INT NOT NULL,
// 	month INT NOT NULL,
// 	year INT NOT NULL,
// 	location_building VARCHAR(255),
// 	location_area VARCHAR(255),
// 	location_address VARCHAR(255),
// 	image_url VARCHAR(255) NOT NULL,
// 	event_type INT NOT NULL,
// 	sign_up_link VARCHAR(255)
//   );
// `;

// 	const insertedEvents = await Promise.all(
// 		events.map(async (event) => {
// 			return client.sql`
// 				INSERT INTO events (title, description, organiser, organiser_uid, start_time, end_time, day, month, year, location_building, location_area, location_address, image_url, event_type, sign_up_link)
// 				VALUES (${event.title}, ${event.description}, ${event.organiser}, ${event.organiser_uid}, ${event.start_time}, ${event.end_time}, ${event.day}, ${event.month}, ${event.year}, ${event.location_building}, ${event.location_area}, ${event.location_address}, ${event.image}, ${event.event_type}, ${event.sign_up_link})
// 			`
// 		})
// 	)

// 	return insertedEvents
// }

// async function addColumnToTable() {
// 	await client.sql`
// 	ALTER TABLE user_information
// 	ADD COLUMN referrer VARCHAR(255)
// 	`

// 	await client.sql`
// 	ALTER TABLE users
// 	DROP COLUMN IF EXISTS referrer 
// 	`
// }

// async function addDateColumnToUserTable() {
// 	await client.sql`
// 		ALTER TABLE users
// 		ADD COLUMN created_at TIMESTAMP DEFAULT NOW()
// 	`
// }

// async function addCapacityColumnToEventTable() {
// 	await client.sql`
// 		ALTER TABLE events
// 		ADD COLUMN capacity INT
// 	`
// }

// async function seedContactFormTable() {

// 	await client.sql`
// 	  CREATE TABLE IF NOT EXISTS contact_forms (
// 		id SERIAL PRIMARY KEY,
// 		name VARCHAR(255),
// 		email VARCHAR(255) NOT NULL,
// 		message TEXT,
// 		created_at TIMESTAMP DEFAULT NOW()
// 	  );
// 	`;

// }

// async function seedUserInformation() {
//     await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

//     await client.sql`
//         CREATE TABLE IF NOT EXISTS user_information (
//             id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//             user_id UUID NOT NULL,
//             gender VARCHAR(255) NOT NULL,
//             birthdate VARCHAR(255) NOT NULL,
//             university_attended VARCHAR(255) NOT NULL,
//             graduation_year VARCHAR(255) NOT NULL,
//             course VARCHAR(255) NOT NULL,
//             level_of_study VARCHAR(255) NOT NULL,
//             newsletter_subscribe BOOLEAN DEFAULT false
//         );
//     `;

//     const insertedUserInformation = await Promise.all(
//         userInformation.map(async (user) => {
//             return client.sql`
//                 INSERT INTO user_information (user_id, gender, birthdate, university_attended, graduation_year, course, level_of_study, newsletter_subscribe)
//                 VALUES (${user.user_id}, ${user.gender}, ${user.birthdate}, ${user.university_attended}, ${user.graduation_year}, ${user.course}, ${user.level_of_study}, ${user.newsletter_subscribe})
//                 ON CONFLICT (id) DO NOTHING;
//             `;
//         })
//     );

//     return insertedUserInformation;
// }

// async function seedCompanyInformation() {
//     await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

//     await client.sql`
//         CREATE TABLE IF NOT EXISTS company_information (
//             id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//             user_id UUID NOT NULL REFERENCES users(id), -- foreign key
//             description TEXT,
//             website VARCHAR(255),
//             logo_url VARCHAR(255),
//             motivation TEXT
//         );
//     `;
// }

// async function seedSocietyInformation() {

// 	await client.sql`
//         CREATE TABLE IF NOT EXISTS society_information (
//             id SERIAL PRIMARY KEY,
//             user_id UUID NOT NULL REFERENCES users(id), -- foreign key
//             description TEXT,
//             website VARCHAR(255),
//             logo_url VARCHAR(255),
//             tags INTEGER[]
//         );
//     `;
// }

// async function seedEventRegistrationsTable() {
// 	await client.sql`
// 	  CREATE TABLE IF NOT EXISTS event_registrations (
// 		id SERIAL PRIMARY KEY,
// 		user_id VARCHAR(255),
// 		event_id VARCHAR(255),
// 		name VARCHAR(255),
// 		email VARCHAR(255),
// 		created_at TIMESTAMP DEFAULT NOW()
// 	  );
// 	`;
// }

// async function seedThreadTable() {
// 	await client.sql`
// 		CREATE TABLE IF NOT EXISTS threads (
// 			id SERIAL PRIMARY KEY,
// 			title VARCHAR(255) NOT NULL,
// 			content TEXT NOT NULL,
// 			created_at TIMESTAMP DEFAULT NOW(),
// 			updated_at TIMESTAMP DEFAULT NOW(),
// 			upvotes INT DEFAULT 0,
// 			downvotes INT DEFAULT 0,
// 			author_id UUID NOT NULL REFERENCES users(id)
// 		);
// 	`;
// }

// async function seedCommentTable() {
// 	await client.sql`
// 		CREATE TABLE IF NOT EXISTS comments (
// 			id SERIAL PRIMARY KEY,
// 			thread_id INT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
// 			parent_id INT REFERENCES comments(id) ON DELETE CASCADE,
// 			content TEXT NOT NULL,
// 			created_at TIMESTAMP DEFAULT NOW(),
// 			updated_at TIMESTAMP DEFAULT NOW(),
// 			upvotes INT DEFAULT 0,
// 			downvotes INT DEFAULT 0,
// 			author_id UUID NOT NULL REFERENCES users(id)
// 		);
// 	`;
// }

// async function seedThreadTags(){
// 	await client.sql`
// 		CREATE TABLE IF NOT EXISTS thread_tags (
// 			id SERIAL PRIMARY KEY,
// 			thread_id INT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
// 			tag VARCHAR(255) NOT NULL UNIQUE
// 		);
// 	`;
// }

// async function seedThreadVote(){
// 	await client.sql`
// 		CREATE TABLE IF NOT EXISTS thread_votes (
// 			id SERIAL PRIMARY KEY,
// 			thread_id INT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
// 			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
// 			vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
// 			created_at TIMESTAMP DEFAULT NOW(),
// 			UNIQUE (thread_id, user_id)
// 		);
// 	`;
// }

// async function seedCommentVote(){
// 	await client.sql`
// 		CREATE TABLE IF NOT EXISTS comments_votes (
// 			id SERIAL PRIMARY KEY,
// 			comment_id INT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
// 			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
// 			vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
// 			created_at TIMESTAMP DEFAULT NOW(),
// 			UNIQUE (comment_id, user_id)
// 		);
// 	`;
// }

export async function GET() {
	// try {
	// 	await client.sql`BEGIN`;
	// 	// await seedSocietyInformation()
	// 	await seedCommentVote();

	// 	await client.sql`COMMIT`;
	// 	return Response.json({ message: 'Database updated successfully' });

	// } catch (error) {
	// 	await client.sql`ROLLBACK`;
	// 	return Response.json({ error }, { status: 500 });
	// }
	return Response.json({ message: 'Nothing to see here' });
}
