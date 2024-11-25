import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SQLEvent, Event, FormData, Registrations, SQLRegistrations } from "./types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function convertSQLEventToEvent(sqlEvent: SQLEvent): Event {
	const date = `${String(sqlEvent.day).padStart(2, '0')}/${String(sqlEvent.month).padStart(2, '0')}/${sqlEvent.year}`;
	const time = `${sqlEvent.start_time} - ${sqlEvent.end_time}`;

	return {
		id: sqlEvent.id,
		title: sqlEvent.title,
		description: sqlEvent.description,
		organiser: sqlEvent.organiser,
		time: time,
		date: date,
		location_building: sqlEvent.location_building,
		location_area: sqlEvent.location_area,
		location_address: sqlEvent.location_address,
		image_url: sqlEvent.image_url,
		event_type: sqlEvent.event_type,
		sign_up_link: sqlEvent.sign_up_link,
		capacity: sqlEvent.capacity,
		for_externals: sqlEvent.for_externals,
	};
}

export function convertSQLRegistrationsToRegistrations(registrations: SQLRegistrations): Registrations {
	return {
		user_id: registrations.user_id,
		user_email: registrations.email,
		user_name: registrations.name,
		date_registered: registrations.created_at,
	};
}

export function convertEventsToMonthYearGroupings(events: Event[]) {
	const months: { [key: string]: Event[] } = {}

	events.forEach((event) => {
		const monthYear = `${event.date.substring(3)}`

		if (!months[monthYear]) {
			months[monthYear] = []
		}
		months[monthYear].push(event)
	})
	return months
}

export function getMonthName(month: string): string {
	const monthNames = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	const monthIndex = parseInt(month, 10) - 1;
	return monthNames[monthIndex] || "Invalid month";
}

export function sortEventsByDate(events: Event[]): Event[] {
	return events.sort((a, b) => {
		const [dayA, monthA, yearA] = a.date.split('/').map(Number)
		const [dayB, monthB, yearB] = b.date.split('/').map(Number)
		const dateA = new Date(yearA, monthA - 1, dayA)
		const dateB = new Date(yearB, monthB - 1, dayB)
		return dateA.getTime() - dateB.getTime()
	})
}

export function formatDateString(dateString: string, short: boolean = true): string {
	const [day, month, year] = dateString.split('/').map(Number)
	const date = new Date(year, month - 1, day)

	const dayOfWeek = date.toLocaleString('en-US', { weekday: short ? 'short' : 'long' })
	const dayInMonth = String(day).padStart(2, '0')
	const monthName = date.toLocaleString('en-US', { month: short ? 'short' : 'long' })

	return `${dayOfWeek}, ${dayInMonth} ${monthName}`
}

export function formatDOB(dob: string) {
	console.log(dob)
	return dob
}

export function selectUniversity(university: string, otherUniversity: string) {
	if (university != "Other (please specify)") return university
	else return otherUniversity
}

export const EVENT_TAG_TYPES: { [key: number]: { label: string; color: string } } = {
	1: { label: 'SOCIAL', color: 'bg-[#f3a51a] opacity-95' },
	2: { label: 'ACADEMIC', color: 'bg-[#079fbf] opacity-95' },
	4: { label: 'SPORTING', color: 'bg-[#041A2E] opacity-95' },
};


export function generateDays() {
	return Array.from({ length: 31 }, (_, i) => i + 1);
}

export function generateMonths() {
	return [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
}

export function generateYears(startYear = 2024, range = 10) {
	return Array.from({ length: range }, (_, i) => startYear + i);
}

export function generateHours() {
	return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
}

export function generateMinutes() {
	return Array.from({ length: 4 }, (_, i) => String(i * 15).padStart(2, '0'));
}

export function validateEvent(formData: FormData): string | undefined {
	// Validate Date
	const { day, month, year } = formData.date;
	const date = new Date(year, month - 1, day); // month is zero-indexed
	if (date.getMonth() + 1 !== Number(month) || date.getDate() !== Number(day)) {
		return "Invalid date selected!"
	}

	// Validate Time
	const { startHour, startMinute, endHour, endMinute } = formData.time;
	const startTime = new Date(year, month - 1, day, Number(startHour), Number(startMinute));
	const endTime = new Date(year, month - 1, day, Number(endHour), Number(endMinute));

	if (startTime > endTime) {
		return "Timings are invalid!"
	}

	if (!formData.title || !formData.organiser) {
		return "Title and organiser are required!"
	}
}

export function createEventObject(data: FormData): Event {
	return {
		id: "",
		title: data.title,
		description: data.description,
		organiser: data.organiser,
		time: `${data.time.startHour}:${data.time.startMinute} - ${data.time.endHour}:${data.time.endMinute}`,
		date: `${data.date.day}/${data.date.month}/${data.date.year}`,
		location_building: data.location.building,
		location_area: data.location.area,
		location_address: data.location.address,
		image_url: data.selectedImage,
		event_type: data.event_tag || 0, 
		capacity: data.capacity,
		sign_up_link: data.signupLink || undefined,
		for_externals: data.forExternals || undefined,
	};
}

export async function createSQLEventObject(data: FormData): Promise<SQLEvent> {
	return {
		id: "", // Generated by Postgres
		title: data.title,
		description: data.description,
		organiser: data.organiser,
		organiser_uid: data.organiser_uid,
		start_time: `${data.time.startHour}:${data.time.startMinute}`,
		end_time: `${data.time.endHour}:${data.time.endMinute}`,
		day: data.date.day,
		month: data.date.month,
		year: data.date.year,
		location_building: data.location.building,
		location_area: data.location.area,
		location_address: data.location.address,
		image_url: data.selectedImage,
		capacity: data.capacity || undefined,
		event_type: data.event_tag || 0,
		sign_up_link: data.signupLink || undefined,
		for_externals: data.forExternals || undefined,
	};
	
}

export const LondonUniversities = [
	"Imperial College London", "King's College London", "University College London", "Birkbeck, University of London", 
	"Brunel University", "Goldsmiths, University of London", "London Business School", "Kingston University", 
	"London School Of Economics (LSE)", "London South Bank University", "University Of Westminster", "SOAS, University Of London",
	"Royal Veterinary College", "Royal Holloway, University of London", "Royal College of Art", "Queen Mary University Of London",
	"Middlesex University", "University Of Greenwich", "University Of Roehampton", 
	"Other (please specify)"
]

export const PartnerLogos = [
	{ src: '/partners/LSEULaw.png', name: 'LSEU Law Society' },
	{ src: '/partners/GlobalChina.png', name: 'Global China and Asia Study Society' },
	{ src: '/partners/RSA_logo.png', name: 'RSA' },
	{ src: '/partners/ROAR.png', name: 'ROAR news' },
	{ src: '/partners/KnownImpact.png', name: 'Known Impact' },
	{ src: '/partners/KCLPolitics.png', name: 'KCL Politics' },
	{ src: '/partners/ICLEnt.jpeg', name: 'ICL Entrepreneurs' },
	{ src: '/partners/AmericanPol.png', name: 'American Politics Society' },
	{ src: '/partners/GreenFinance.png', name: 'Green Finance' },
	{ src: '/partners/KCLBackpackers.webp', name: 'KCL Backpackers' },
	{ src: '/partners/KCLUN.png', name: 'KCL UN Women' },
	{ src: '/partners/KCLArmy.png', name: 'KCL Army' },
	{ src: '/partners/LSEAmicus.png', name: 'Amicus LSE' }
]

export const SocietyLogos = [
	{ name: "London Student Network", src: '/societies/LSN.png' },
	{ name: "Roar News", src: '/societies/roar.png' },
	{ name: "KCL Politics Society", src: '/societies/kcl-politics.png' },
	{ name: "Imperial College Neurotech Society", src: '/societies/icl-neurotech.png' },
	{ name: "Imperial College Radio Society", src: '/societies/ic-radio.svg' },
	{ name: "LSE SU European Society", src: '/societies/LSN.png' },
	{ name: "Global China and Asia Study Society", src: '/societies/LSN.png' },
	{ name: "Imperial College Finance Society", src: '/societies/LSN.png' },
	{ name: "Amicus UCL", src: '/societies/lse-amicus.png' },
	{ name: "KCL American Politics Society", src: '/societies/kcl-am-politics.png' },
	{ name: "Political Engagement and Activism Society", src: '/societies/LSN.png' },
	{ name: "EISKA (European and International Studies King's Association)", src: '/societies/LSN.png' },
	{ name: "KCL Backpackers", src: '/societies/LSN.png' },
	{ name: "KCL History Society", src: '/societies/LSN.png' },
	{ name: "KCL War Studies", src: '/societies/LSN.png' },
	{ name: "Boundless Compassion Charity Support", src: '/societies/LSN.png' },
	{ name: "KCL Men's Football", src: '/societies/kcl-mens-football.png' },
	{ name: "Women and Politics", src: '/societies/LSN.png' },
	{ name: "KCL European Society", src: '/societies/LSN.png' },
	{ name: "KCL Political Economy Society", src: '/societies/LSN.png' },
	{ name: "Imperial College Film Society", src: '/societies/LSN.png' },
	{ name: "LSESU Entrepreneurs", src: '/societies/LSN.png' },
	{ name: "Imperial Entrepreneurs", src: '/societies/icl-entre.png' },
	{ name: "KCL Liberal Democrats", src: '/societies/LSN.png' },
	{ name: "KCL Think Tank", src: '/societies/LSN.png' },
	{ name: "Student Startups UK", src: '/societies/student-startups-uk.png' },
	{ name: "American Society University of Westminster ", src: '/societies/LSN.png' },
	{ name: "Imperial College Law Society", src: '/societies/icl-law.png' },
	{ name: "European Affairs Institute", src: '/societies/LSN.png' },
]

export function returnLogo(organiser: string): { found: boolean, src?: string } {
	const logo = SocietyLogos.find(logo => logo.name === organiser);
	if (logo) {
		return { found: true, src: logo.src };
	}
	return { found: false };
}


export const placeholderImages = [
	{ src: '/images/placeholders/lecture-hall-1.jpg', name: 'Lecture'},
	{ src: '/images/placeholders/teaching.jpg', name: 'Education'},
	{ src: '/images/placeholders/social.jpg', name: 'Social Gathering'},
	{ src: '/images/placeholders/running.jpg', name: 'Sports'},
	{ src: '/images/placeholders/band-practice.jpg', name: 'Music Practice'},
	{ src: '/images/placeholders/brainstorm.jpg', name: 'Brainstorm'},
	{ src: '/images/placeholders/pub.jpg', name: 'Pub'},
	{ src: '/images/placeholders/football.jpg', name: 'Football'},
]