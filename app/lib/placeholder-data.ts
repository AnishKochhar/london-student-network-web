
// const users = [
// 	{
// 		name: 'Admin User',
// 		email: '-@-.co.uk',
// 		password: 'super-secret-password',
// 		role: 'admin',
// 		emailVerified: true,
// 	},
// 	{
// 		name: 'Test User',
// 		email: 'test@lsn.co.uk',
// 		password: 'gottabeshine',
// 		role: 'user',
// 		emailVerified: true,
// 	}
// ]

// const events = [
// 	{
// 		title: 'Andreas Schafer - From X-Rays to Brain Computer Interfaces',
// 		description: 'We are joined by Professor Andreas Schaefer, a Group Leader at the Francis Crick Institute in Kings Cross, London, where his research focuses on dissecting the cellular mechanisms of sensory processing in the brain. Techniques employed include electron microscopy, in vivo electrophysiology and imaging, genetic and optogenetic interference as well as behavioural tasks and computational modelling. Andreas also co-founded Paradromics in 2015, developing next generation brain-computer interface technology for effective therapies for brain-related disorders. It harnesses discoveries from Professor Schaefer’s laboratory of an accurate and scalable method to record and stimulate brain activity across large areas, including on the surface and in deeper regions simultaneously.\nWe are also joined by 🧠 Sam Hosovsky, the CEO of uCat, a company focusing on integrating brain computer interfaces with VR. He will be giving an insight to what his company does. ',
// 		organiser: 'Imperial Neurotech Society',
// 		organiser_uid: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
// 		start_time: '18:30',
// 		end_time: '19:30',
// 		day: 18,
// 		month: 9,
// 		year: 2024,
// 		location_building: 'Room 1.31, RSM Building',
// 		location_area: 'Imperial South Kensington Campus',
// 		location_address: 'SW7 2AZ',
// 		image: '/images/placeholders/lecture-hall-1.jpg',
// 		event_type: 2,
// 		sign_up_link: "https://google.com"
// 	},
// 	{
// 		title: 'Stop Light Social',
// 		description: 'We\'re kicking off the term with more than just a pub quiz! Join us along with 12 societies from 5 universities as we mix up the ordinary with a night of assisted socialising. Upon arrival, you\'ll get a name tag and a stoplight wristband to signal your vibe for the night!\n\nForm your quiz groups, meet new faces, and dive into our 3 crucial quiz categories for students. This is your perfect chance to explore the intercollegiate scene during Freshers - and the only night like it!',
// 		organiser: 'London Students Network',
// 		organiser_uid: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
// 		start_time: '19:30',
// 		end_time: '23:00',
// 		day: 20,
// 		month: 9,
// 		year: 2024,
// 		location_building: 'The Thirsty Bear',
// 		location_area: 'South Bank / Waterloo',
// 		location_address: '62 Stamford Street, SE1 9LX',
// 		image: '/images/placeholders/pub.jpg',
// 		event_type: 1,
// 		sign_up_link: "https://www.tickettailor.com/events/londonstudentnetwork/1386868"
// 	},
// 	{
// 		title: 'LSN inter-collegiate football tournament',
// 		description: 'A super exciting sporting spectacle. Join us to watch rivals battle to the death in under a somewhat friendly guise.',
// 		organiser: 'London Students Networks',
// 		organiser_uid: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
// 		start_time: '16:30',
// 		end_time: '18:30',
// 		day: 13,
// 		month: 9,
// 		year: 2024,
// 		location_building: 'Pitches 11 and 12, Westway',
// 		location_area: 'Westway Sports and Fitness, Latimer Road',
// 		location_address: '1 Crowthorne Road, W10 6RP',
// 		image: '/images/placeholders/football.jpg',
// 		event_type: 4,
// 		sign_up_link: "https://google.com"
// 	},
// 	{
// 		title: 'AI in Healthcare Panel Discussion',
// 		description: 'Join experts from Imperial, King\'s College London, and UCL to discuss the future of AI in healthcare. Topics will include the role of machine learning in diagnostics, AI ethics in medical research, and career opportunities in health tech. This panel discussion will be followed by a networking social with refreshments.',
// 		organiser: 'London Healthcare Society',
// 		organiser_uid: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
// 		start_time: '18:00',
// 		end_time: '20:00',
// 		day: 25,
// 		month: 9,
// 		year: 2024,
// 		location_building: 'Lecture Theatre G34, Sir Alexander Fleming Building',
// 		location_area: 'Imperial South Kensington Campus',
// 		location_address: 'SW7 2AZ',
// 		image: '/images/placeholders/brainstorm.jpg',
// 		event_type: 3,
// 		sign_up_link: "https://google.com"
// 	},
// 	{
// 		title: 'Freshers Welcome BBQ',
// 		description: 'Kick off the year with a relaxing BBQ hosted by the Student Union! Enjoy free food, games, and music while meeting new friends from across different courses and societies. Vegetarian and vegan options available.',
// 		organiser: 'Student Union',
// 		organiser_uid: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
// 		start_time: '14:00',
// 		end_time: '18:00',
// 		day: 28,
// 		month: 9,
// 		year: 2024,
// 		location_building: 'Union Lawn, Main Quad',
// 		location_area: 'University College London',
// 		location_address: 'Gower Street, WC1E 6BT',
// 		image: '/images/placeholders/social.jpg',
// 		event_type: 1,
// 		sign_up_link: "https://google.com"
// 	},
// 	{
// 		title: 'University of London Volleyball Tournament',
// 		description: 'Represent your university and compete in the University of London Volleyball Tournament. Teams from universities across London will face off in a day-long event. Whether you\'re playing or just spectating, come out to support your team and enjoy the competition.',
// 		organiser: 'London University Sports Federation',
// 		organiser_uid: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
// 		start_time: '10:00',
// 		end_time: '17:00',
// 		day: 30,
// 		month: 9,
// 		year: 2024,
// 		location_building: 'Lee Valley Athletics Centre',
// 		location_area: 'Edmonton, London',
// 		location_address: 'N9 0AR',
// 		image: '/images/placeholders/running.jpg',
// 		event_type: 4,
// 		sign_up_link: "https://google.com"
// 	},
// 	{
// 		title: 'Coding Bootcamp: Learn React.js in One Day',
// 		description: 'A fast-paced, hands-on workshop designed to teach you the fundamentals of React.js. Perfect for beginners looking to build their first web app or those with some experience in JavaScript. By the end of the day, you\'ll have built a small project to showcase your skills.',
// 		organiser: 'Tech Society - King\'s College London',
// 		organiser_uid: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
// 		start_time: '09:00',
// 		end_time: '17:00',
// 		day: 3,
// 		month: 10,
// 		year: 2024,
// 		location_building: 'Bush House, North East Wing',
// 		location_area: 'King\'s College London',
// 		location_address: 'Strand, London, WC2R 1AE',
// 		image: '/images/placeholders/teaching.jpg',
// 		event_type: 2,
// 		sign_up_link: "https://google.com"
// 	},
// 	{
// 		title: 'End of Term Charity Run & After-Party',
// 		description: 'Run for a good cause! Join us for a 5km charity run through Hyde Park, raising funds for Great Ormond Street Hospital. After the run, celebrate with a post-run party at the Student Union Bar, complete with live music and prize giveaways.',
// 		organiser: 'London University Running Club',
// 		organiser_uid: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
// 		start_time: '11:00',
// 		end_time: '15:00',
// 		day: 10,
// 		month: 12,
// 		year: 2024,
// 		location_building: 'Hyde Park',
// 		location_area: 'Central London',
// 		location_address: 'W2 2UH',
// 		image: '/images/placeholders/running.jpg',
// 		event_type: 5,
// 		sign_up_link: "https://google.com"
// 	}
// ]



// const userInformation = [
//     {
//         user_id: '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c',
//         gender: 'Male',
//         birthdate: '2001-05-15',
//         university_attended: 'Imperial College London',
//         graduation_year: '2017',
//         course: 'Computer Science',
//         level_of_study: 'Postgraduate',
//         newsletter_subscribe: true
//     },
//     {
//         user_id: '55ef371c-0cbc-4f2a-b9f1-f6078aa6638d',
//         gender: 'Female',
//         birthdate: '1998-08-22',
//         university_attended: 'King\'s College London',
//         graduation_year: '2020',
//         course: 'Biomedical Engineering',
//         level_of_study: 'Alumni',
//         newsletter_subscribe: false
//     },
//     {
//         user_id: '65ef371c-0cbc-4f2a-b9f1-f6078aa6638e',
//         gender: 'Prefer not to say',
//         birthdate: '2005-11-30',
//         university_attended: 'University College London',
//         graduation_year: '2026',
//         course: 'Physics',
//         level_of_study: 'Undergraduate',
//         newsletter_subscribe: true
//     }
// ];
