import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
	SQLEvent,
	Event,
	FormData,
	EventFormData,
	SQLEventData,
	Registrations,
	SQLRegistrations,
	Partner,
	Tag,
} from "./types";
import { v4 as uuidv4 } from "uuid";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const capitalize = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeFirst = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const properTitleCase = (str: string) => {
	return str
		.split(" ")
		.map((word) => {
			if (word.length === 0) return word;
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");
};

export function formattedWebsite(website: string) {
	// formats website to include https:// if it doesn't already
	return website.startsWith("http") ? website : `https://${website}`;
}

export function convertSQLEventToEvent(sqlEvent: SQLEvent): Event {
	// Use new datetime fields if available, fallback to legacy fields
	let start_datetime: string | undefined;
	let end_datetime: string | undefined;
	let is_multi_day: boolean | undefined;
	let time: string;
	let date: string;

	const LONDON_TZ = 'Europe/London';

	if (sqlEvent.start_datetime && sqlEvent.end_datetime) {
		// Use new datetime fields
		start_datetime = sqlEvent.start_datetime;
		end_datetime = sqlEvent.end_datetime;
		is_multi_day = sqlEvent.is_multi_day || false;

		// Generate legacy fields for backward compatibility
		const startDate = new Date(start_datetime);
		const endDate = new Date(end_datetime);

		// Format times in London timezone
		const startTime = formatInTimeZone(startDate, LONDON_TZ, 'HH:mm');
		const endTime = formatInTimeZone(endDate, LONDON_TZ, 'HH:mm');

		time = `${startTime} - ${endTime}`;
		date = formatInTimeZone(startDate, LONDON_TZ, 'dd/MM/yyyy');
	} else {
		// Fallback to legacy fields
		date = `${String(sqlEvent.day!).padStart(2, "0")}/${String(sqlEvent.month!).padStart(2, "0")}/${sqlEvent.year}`;
		time = `${sqlEvent.start_time} - ${sqlEvent.end_time}`;

		// Try to construct datetime from legacy fields if available
		if (sqlEvent.day && sqlEvent.month && sqlEvent.year && sqlEvent.start_time && sqlEvent.end_time) {
			const [startHour, startMinute] = sqlEvent.start_time.split(':').map(Number);
			const [endHour, endMinute] = sqlEvent.end_time.split(':').map(Number);

			const startDate = new Date(sqlEvent.year, sqlEvent.month - 1, sqlEvent.day, startHour, startMinute);
			const endDate = new Date(sqlEvent.year, sqlEvent.month - 1, sqlEvent.day, endHour, endMinute);

			start_datetime = startDate.toISOString();
			end_datetime = endDate.toISOString();
			is_multi_day = false; // Legacy events are single day
		}
	}

	return {
		id: sqlEvent.id,
		title: sqlEvent.title,
		description: sqlEvent.description,
		organiser: sqlEvent.organiser,
		organiser_uid: sqlEvent.organiser_uid,
		organiser_slug: sqlEvent.organiser_slug,
		time: time,
		date: date,
		location_building: sqlEvent.location_building,
		location_area: sqlEvent.location_area,
		location_address: sqlEvent.location_address,
		image_url: sqlEvent.image_url,
		image_contain: sqlEvent.image_contain,
		event_type: sqlEvent.event_type,
		sign_up_link: sqlEvent.sign_up_link,
		capacity: sqlEvent.capacity && !isNaN(Number(sqlEvent.capacity)) && Number(sqlEvent.capacity) > 0 ? Number(sqlEvent.capacity) : undefined,
		for_externals: sqlEvent.for_externals,
		// New datetime fields
		start_datetime: start_datetime,
		end_datetime: end_datetime,
		is_multi_day: is_multi_day,
		// Event management fields
		is_hidden: sqlEvent.is_hidden,
		is_deleted: sqlEvent.is_deleted,
		send_signup_notifications: sqlEvent.send_signup_notifications,
		student_union: sqlEvent.student_union,
		// Access control fields
		visibility_level: sqlEvent.visibility_level,
		registration_level: sqlEvent.registration_level,
		allowed_universities: sqlEvent.allowed_universities,
		// Registration cutoff fields
		registration_cutoff_hours: sqlEvent.registration_cutoff_hours,
		external_registration_cutoff_hours: sqlEvent.external_registration_cutoff_hours,
	};
}

export function convertSQLRegistrationsToRegistrations(
	registrations: SQLRegistrations,
): Registrations {
	return {
		event_registration_uuid: registrations.event_registration_uuid,
		user_id: registrations.user_id,
		user_email: registrations.email,
		user_name: registrations.name,
		date_registered: registrations.created_at,
		external: registrations.external,
		quantity: registrations.quantity,
		ticket_name: registrations.ticket_name,
		ticket_price: registrations.ticket_price,
		payment_required: registrations.payment_required,
		payment_id: registrations.payment_id,
		payment_status: registrations.payment_status,
		is_cancelled: registrations.is_cancelled,
		cancelled_at: registrations.cancelled_at,
	};
}

export function convertEventsToMonthYearGroupings(events: Event[]) {
	const months: { [key: string]: Event[] } = {};

	events.forEach((event) => {
		const monthYear = `${event.date.substring(3)}`;

		if (!months[monthYear]) {
			months[monthYear] = [];
		}
		months[monthYear].push(event);
	});
	return months;
}

export function getMonthName(month: string): string {
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const monthIndex = parseInt(month, 10) - 1;
	return monthNames[monthIndex] || "Invalid month";
}

//

export async function fetchPartners(page: number, limit: number) {
	try {
		const response = await fetch("/api/societies/get-organiser-cards", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ page, limit }), // Sending page and limit in the body
		});

		if (!response.ok) {
			throw new Error("Failed to fetch organisers card data");
		}

		const data = await response.json();

		// Fetch predefined tags once
		const predefinedTags = await getPredefinedTags();

		// Map predefined tags into a lookup object for efficient access
		const tagLookup: Record<number, string> = predefinedTags.reduce(
			(acc: Record<number, string>, tag: Tag) => {
				acc[tag.value] = tag.label;
				return acc;
			},
			{},
		);

		// Map the response to the desired format
		const formattedPartners = data.map((partner: Partner) => ({
			id: partner.id,
			name: partner.name || "Unknown Name",
			keywords: (partner.tags || []).map((tag: number) => {
				return tagLookup[tag] || "Unknown Tag";
			}),
			description: partner.description || `Welcome to ${partner.name}`,
			website: partner.website || "No website available",
			logo: partner.logo_url || null,
		}));

		return formattedPartners;
	} catch (err) {
		console.error("failed to retrieve partners", err);
	}
}

export async function fetchAllPartners(cacheDurationInSeconds?: number) {
	try {
		const response = await fetch("/api/societies/get-all-organiser-cards", {
			...(cacheDurationInSeconds && {
				next: { revalidate: cacheDurationInSeconds },
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to fetch organisers card data");
		}

		const data = await response.json();

		// Fetch predefined tags once
		const predefinedTags = await getPredefinedTags();

		// Map predefined tags into a lookup object for efficient access
		const tagLookup: Record<number, string> = predefinedTags.reduce(
			(acc: Record<number, string>, tag: Tag) => {
				acc[tag.value] = tag.label;
				return acc;
			},
			{},
		);

		// Map the response to the desired format
		const formattedPartners = data.map((partner: Partner) => ({
			id: partner.id,
			name: partner.name || "Unknown Name",
			keywords: (partner.tags || []).map((tag: number) => {
				return tagLookup[tag] || "Unknown Tag";
			}),
			description: partner.description || `Welcome to ${partner.name}`,
			website: partner.website || "No website available",
			logo: partner.logo_url || null,
		}));

		return formattedPartners;
	} catch (err) {
		console.error("Failed to retrieve partners", err);
	}
}

const fetchPredefinedTags = async () => {
	// this function might not need the map, should be tested
	try {
		const response = await fetch("/api/user/fetch-predefined-tags");
		if (!response.ok) {
			throw new Error(
				`Failed to fetch predefined tags: ${response.statusText}`,
			);
		}
		const data = await response.json();

		const predefinedTags: Tag[] = data.map(
			(tag: Tag): Tag => ({
				label: tag.label,
				value: tag.value,
			}),
		);

		return predefinedTags;
	} catch (error) {
		console.error("Error fetching predefined tags:", error);
		return [];
	}
};

export async function getPredefinedTags() {
	const predefinedTags = await fetchPredefinedTags();
	return predefinedTags;
}

export default getPredefinedTags;

// MARK: Formatting and Sorting helper functions

export function sortEventsByDate(events: Event[], reverse: boolean = false): Event[] {
	return events.sort((a, b) => {
		const [dayA, monthA, yearA] = a.date.split("/").map(Number);
		const [dayB, monthB, yearB] = b.date.split("/").map(Number);
		const dateA = new Date(yearA, monthA - 1, dayA);
		const dateB = new Date(yearB, monthB - 1, dayB);
		return reverse
			? dateB.getTime() - dateA.getTime()  // Descending: furthest future first
			: dateA.getTime() - dateB.getTime();  // Ascending: chronological
	});
}

export function formatDateString(
	dateString: string,
	short: boolean = true,
): string {
	const [day, month, year] = dateString.split("/").map(Number);
	const date = new Date(year, month - 1, day);

	const dayOfWeek = date.toLocaleString("en-US", {
		weekday: short ? "short" : "long",
	});
	const dayInMonth = String(day).padStart(2, "0");
	const monthName = date.toLocaleString("en-US", {
		month: short ? "short" : "long",
	});

	return `${dayOfWeek}, ${dayInMonth} ${monthName}`;
}

// New function for formatting modern events with timestamp support
export function formatEventDateTime(event: import('./types').Event): string {
	// Use new timestamp fields if available, fallback to legacy fields
	if (event.start_datetime && event.end_datetime) {
		const LONDON_TZ = 'Europe/London';

		// Parse UTC timestamps
		const startDate = new Date(event.start_datetime);
		const endDate = new Date(event.end_datetime);

		// Convert to London timezone for display
		const startDay = formatInTimeZone(startDate, LONDON_TZ, 'EEEE');
		const startDayNum = parseInt(formatInTimeZone(startDate, LONDON_TZ, 'd'));
		const startMonth = formatInTimeZone(startDate, LONDON_TZ, 'MMMM');
		const startTime = formatInTimeZone(startDate, LONDON_TZ, 'HH:mm');

		const endDay = formatInTimeZone(endDate, LONDON_TZ, 'EEEE');
		const endDayNum = parseInt(formatInTimeZone(endDate, LONDON_TZ, 'd'));
		const endMonth = formatInTimeZone(endDate, LONDON_TZ, 'MMMM');
		const endTime = formatInTimeZone(endDate, LONDON_TZ, 'HH:mm');

		// Helper function to add ordinal suffix
		const getOrdinal = (day: number): string => {
			const j = day % 10;
			const k = day % 100;
			if (j === 1 && k !== 11) return day + "st";
			if (j === 2 && k !== 12) return day + "nd";
			if (j === 3 && k !== 13) return day + "rd";
			return day + "th";
		};

		// Check if it's multi-day (different dates in London timezone)
		const startDateString = formatInTimeZone(startDate, LONDON_TZ, 'yyyy-MM-dd');
		const endDateString = formatInTimeZone(endDate, LONDON_TZ, 'yyyy-MM-dd');
		const isSameDay = startDateString === endDateString;

		if (isSameDay) {
			// Same day: "Sunday, 21st September | 10:00 - 20:00"
			return `${startDay}, ${getOrdinal(startDayNum)} ${startMonth} | ${startTime} - ${endTime}`;
		} else {
			// Multi-day: "Sunday, 21st September 10:00 - Monday, 22nd September 20:00"
			return `${startDay}, ${getOrdinal(startDayNum)} ${startMonth} ${startTime} - ${endDay}, ${getOrdinal(endDayNum)} ${endMonth} ${endTime}`;
		}
	}

	// Fallback to legacy format
	return `${formatDateString(event.date, false)} | ${event.time}`;
}

export function formatDOB(dob: string) {
	console.log(dob);
	return dob;
}

export function selectUniversity(university: string, otherUniversity: string) {
	if (university != "Other (please specify)") return university;
	else return otherUniversity;
}

export const EVENT_TAG_TYPES: {
	[key: number]: { label: string; color: string; description: string };
} = {
	1: { label: "Social", color: "bg-[#f3a51a] opacity-95", description: "Social gatherings, parties, meet-ups, and casual events" },
	2: { label: "Academic", color: "bg-[#079fbf] opacity-95", description: "Educational events, lectures, study groups, and academic discussions" },
	4: { label: "Sporting", color: "bg-[#041A2E] opacity-95", description: "Sports activities, fitness events, tournaments, and athletic competitions" },
	8: { label: "Networking", color: "bg-[#8B5CF6] opacity-95", description: "Professional networking events and industry meet-ups" },
	16: { label: "Career", color: "bg-[#059669] opacity-95", description: "Career fairs, job opportunities, internship events, and professional development" },
	32: { label: "Cultural", color: "bg-[#DC2626] opacity-95", description: "Cultural celebrations, heritage events, and diversity initiatives" },
	64: { label: "Technology", color: "bg-[#2563EB] opacity-95", description: "Tech talks, coding events, hackathons, and innovation showcases" },
	128: { label: "Business", color: "bg-[#7C3AED] opacity-95", description: "Business events, entrepreneurship, startup pitches, and commercial activities" },
	256: { label: "Arts", color: "bg-[#DB2777] opacity-95", description: "Art exhibitions, creative workshops, design events, and artistic performances" },
	512: { label: "Music", color: "bg-[#EA580C] opacity-95", description: "Concerts, music performances, open mic nights, and musical events" },
	1024: { label: "Food", color: "bg-[#65A30D] opacity-95", description: "Food tastings, cooking events, restaurant visits, and culinary experiences" },
	2048: { label: "Wellness", color: "bg-[#0891B2] opacity-95", description: "Mental health events, fitness classes, meditation, and wellbeing activities" },
	4096: { label: "Volunteer", color: "bg-[#7C2D12] opacity-95", description: "Community service, charity events, volunteering opportunities, and social impact" },
	8192: { label: "Workshop", color: "bg-[#4338CA] opacity-95", description: "Hands-on learning sessions, skill-building workshops, and practical training" },
	16384: { label: "Seminar", color: "bg-[#B91C1C] opacity-95", description: "Educational seminars, expert talks, and knowledge-sharing sessions" },
	32768: { label: "Conference", color: "bg-[#374151] opacity-95", description: "Large-scale conferences, symposiums, and professional gatherings" },
};

export function generateDays() {
	return Array.from({ length: 31 }, (_, i) => i + 1);
}

export function generateMonths() {
	return [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
}

export function generateYears(startYear = 2024, range = 10) {
	return Array.from({ length: range }, (_, i) => startYear + i);
}

export function generateHours() {
	return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
}

export function generateMinutes() {
	return Array.from({ length: 4 }, (_, i) => String(i * 15).padStart(2, "0"));
}

export function validateEvent(formData: FormData): string | undefined {
	// Validate Date
	const { day, month, year } = formData.date;
	const date = new Date(year, month - 1, day); // month is zero-indexed
	if (
		date.getMonth() + 1 !== Number(month) ||
		date.getDate() !== Number(day)
	) {
		return "Invalid date selected!";
	}

	// Validate Time
	const { startHour, startMinute, endHour, endMinute } = formData.time;
	const startTime = new Date(
		year,
		month - 1,
		day,
		Number(startHour),
		Number(startMinute),
	);
	const endTime = new Date(
		year,
		month - 1,
		day,
		Number(endHour),
		Number(endMinute),
	);

	if (startTime > endTime) {
		return "Timings are invalid!";
	}

	if (!formData.title || !formData.organiser) {
		return "Title and organiser are required!";
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
		image_contain: data.image_contain,
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
		image_contain: data.image_contain,
		capacity: data.capacity || undefined,
		event_type: data.event_tag || 0,
		sign_up_link: data.signupLink || undefined,
		for_externals: data.forExternals || undefined,
	};
}

export function validateModernEvent(formData: EventFormData): string | undefined {
	// Validate required fields
	if (!formData.title?.trim()) return "Event title is required";
	if (!formData.description?.trim()) return "Event description is required";
	if (!formData.organiser?.trim()) return "Organiser is required";
	if (!formData.start_datetime) return "Start date is required";
	if (!formData.end_datetime) return "End date is required";
	if (!formData.start_time) return "Start time is required";
	if (!formData.end_time) return "End time is required";
	if (!formData.location_building?.trim()) return "Building/venue is required";
	if (!formData.location_area?.trim()) return "Area is required";
	if (!formData.location_address?.trim()) return "Full address is required";

	// Validate date/time logic
	const startDateTime = new Date(`${formData.start_datetime}T${formData.start_time}`);
	const endDateTime = new Date(`${formData.end_datetime}T${formData.end_time}`);

	if (startDateTime >= endDateTime) {
		return "End time must be after start time";
	}

	// Validate email format if provided
	if (formData.external_forward_email) {
		const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
		if (!emailRegex.test(formData.external_forward_email)) {
			return "Invalid email format for external forward email";
		}
	}

	// Validate URL format if provided
	if (formData.sign_up_link) {
		const urlRegex = /^https?:\/\/.+/;
		if (!urlRegex.test(formData.sign_up_link)) {
			return "Invalid URL format for sign-up link";
		}
	}

	// Validate capacity if provided
	if (formData.capacity && formData.capacity < 1) {
		return "Capacity must be at least 1";
	}

	return undefined; // No errors
}

export function createModernEventObject(data: EventFormData): Event {
	const startDateTime = new Date(`${data.start_datetime}T${data.start_time}`);
	const endDateTime = new Date(`${data.end_datetime}T${data.end_time}`);

	// Check if it's multi-day by comparing dates (not time)
	const startDateOnly = new Date(data.start_datetime);
	const endDateOnly = new Date(data.end_datetime);
	const isMultiDay = startDateOnly.toDateString() !== endDateOnly.toDateString();

	// Format time
	const formatTime = (date: Date) => {
		return date.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	};

	// Format date
	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'numeric',
			year: 'numeric'
		});
	};

	return {
		id: "",
		title: data.title,
		description: data.description,
		organiser: data.organiser,
		time: `${formatTime(startDateTime)} - ${formatTime(endDateTime)}`,
		date: formatDate(startDateTime),
		location_building: data.location_building,
		location_area: data.location_area,
		location_address: data.location_address,
		image_url: data.image_url,
		image_contain: data.image_contain,
		event_type: 0, // Default type
		capacity: data.capacity && !isNaN(Number(data.capacity)) && Number(data.capacity) > 0 ? Number(data.capacity) : undefined,
		sign_up_link: data.sign_up_link || undefined,
		for_externals: data.for_externals || undefined,
		// New timestamp fields for multi-day support
		start_datetime: startDateTime.toISOString(),
		end_datetime: endDateTime.toISOString(),
		is_multi_day: isMultiDay,
		send_signup_notifications: data.send_signup_notifications ?? true,
	};
}

/**
 * Helper function to convert London time to UTC
 * Handles BST (UTC+1) and GMT (UTC+0) automatically
 */
function londonTimeToUTC(dateString: string, timeString: string): Date {
	try {
		// Parse components
		const [year, month, day] = dateString.split('-').map(Number);
		const [hour, minute] = timeString.split(':').map(Number);

		// Create a date at noon in London to determine if DST is active
		const testDate = new Date(Date.UTC(year, month - 1, day, 12, 0));

		// Try formatInTimeZone
		let londonTimeStr;
		try {
			londonTimeStr = formatInTimeZone(testDate, 'Europe/London', 'yyyy-MM-dd HH:mm zzz');
		} catch (fmtError) {
			console.error('formatInTimeZone ERROR:', fmtError);
			throw fmtError;
		}

		// Extract offset from the formatted string
		// Can be "BST", "GMT", "GMT+1", or "GMT+0"
		let offsetHours = 0;

		if (londonTimeStr.includes('BST')) {
			// British Summer Time = UTC+1
			offsetHours = 1;
		} else if (londonTimeStr.includes('GMT+1')) {
			// GMT+1 = BST (numeric format)
			offsetHours = 1;
		} else if (londonTimeStr.includes('GMT+0') || londonTimeStr.includes('GMT')) {
			// GMT or GMT+0 = UTC+0
			offsetHours = 0;
		}

		// Create UTC date by subtracting the offset
		const result = new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute));

		return result;
	} catch (error) {
		console.error('Error converting London time to UTC:', error);
		throw error;
	}
}

export function createSQLEventData(data: EventFormData): SQLEventData {
	// User enters times in London timezone (Europe/London)
	// We need to convert to UTC for storage, accounting for BST/GMT
	// datetime-local input gives us: "2025-10-04" (date) and "19:00" (time)

	// Convert London times to UTC
	const startDateTimeUTC = londonTimeToUTC(data.start_datetime, data.start_time);
	const endDateTimeUTC = londonTimeToUTC(data.end_datetime, data.end_time);

	const sqlData = {
		title: data.title,
		description: data.description,
		organiser: data.organiser,
		organiser_uid: data.organiser_uid,
		start_datetime: startDateTimeUTC.toISOString(),
		end_datetime: endDateTimeUTC.toISOString(),
		is_multi_day: data.is_multi_day,
		location_building: data.location_building,
		location_area: data.location_area,
		location_address: data.location_address,
		image_url: data.image_url,
		image_contain: data.image_contain,
		event_type: data.tags,
		external_forward_email: data.external_forward_email || undefined,
		capacity: data.capacity && !isNaN(Number(data.capacity)) && Number(data.capacity) > 0 ? Number(data.capacity) : undefined,
		sign_up_link: data.sign_up_link || undefined,
		for_externals: data.for_externals || undefined,
		send_signup_notifications: data.send_signup_notifications ?? true,
		student_union: false, // Default to false for now, can be updated later if needed
		// Access control fields
		visibility_level: data.visibility_level || 'public',
		registration_level: data.registration_level || 'public',
		allowed_universities: data.allowed_universities || [],
		link_only: data.link_only ?? false,
		// Registration cutoff fields
		registration_cutoff_hours: data.registration_cutoff_hours != null && !isNaN(Number(data.registration_cutoff_hours)) && Number(data.registration_cutoff_hours) > 0
			? Number(data.registration_cutoff_hours)
			: undefined,
		external_registration_cutoff_hours: data.external_registration_cutoff_hours != null && !isNaN(Number(data.external_registration_cutoff_hours)) && Number(data.external_registration_cutoff_hours) > 0
			? Number(data.external_registration_cutoff_hours)
			: undefined
	};

	return sqlData;
}

export const LondonUniversities = [
	"Imperial College London",
	"King's College London",
	"University College London",
	"City, University of London",
	"Birkbeck, University of London",
	"Brunel University",
	"Goldsmiths, University of London",
	"London Business School",
	"Kingston University",
	"London School Of Economics (LSE)",
	"London South Bank University",
	"University Of Westminster",
	"SOAS, University Of London",
	"Royal Veterinary College",
	"Royal Holloway, University of London",
	"Royal College of Art",
	"Queen Mary University Of London",
	"Middlesex University",
	"University Of Greenwich",
	"University Of Roehampton",
	"University of the Arts London",
	"Courtauld Institute of Art",
	"Other (please specify)",
];

export const PartnerLogos = [
	{ src: "/partners/LSEULaw.png", name: "LSEU Law Society" },
	{
		src: "/partners/GlobalChina.png",
		name: "Global China and Asia Study Society",
	},
	{ src: "/partners/RSA_logo.png", name: "RSA" },
	{ src: "/partners/ROAR.png", name: "ROAR news" },
	{ src: "/partners/KnownImpact.png", name: "Known Impact" },
	{ src: "/partners/KCLPolitics.png", name: "KCL Politics" },
	{ src: "/partners/ICLEnt.jpeg", name: "ICL Entrepreneurs" },
	{ src: "/partners/AmericanPol.png", name: "American Politics Society" },
	{ src: "/partners/GreenFinance.png", name: "Green Finance" },
	{ src: "/partners/KCLBackpackers.webp", name: "KCL Backpackers" },
	{ src: "/partners/KCLUN.png", name: "KCL UN Women" },
	{ src: "/partners/KCLArmy.png", name: "KCL Army" },
	{ src: "/partners/LSEAmicus.png", name: "Amicus LSE" },
];

export const SocietyLogos = [
	{ name: "London Student Network", src: "/societies/LSN.png" },
	{ name: "Roar News", src: "/societies/roar.png" },
	{ name: "KCL Politics Society", src: "/societies/kcl-politics.png" },
	{
		name: "Imperial College Neurotech Society",
		src: "/societies/icl-neurotech.png",
	},
	{ name: "Imperial College Radio Society", src: "/societies/ic-radio.svg" },
	{ name: "KCL Neurotech Society", src: "/societies/kcl-neurotech.png" },
	{ name: "LSE SU European Society", src: "/societies/LSN.png" },
	{ name: "Global China and Asia Study Society", src: "/societies/LSN.png" },
	{ name: "Imperial College Finance Society", src: "/societies/LSN.png" },
	{ name: "Amicus UCL", src: "/societies/lse-amicus.png" },
	{
		name: "KCL American Politics Society",
		src: "/societies/kcl-am-politics.png",
	},
	{
		name: "Political Engagement and Activism Society",
		src: "/societies/LSN.png",
	},
	{
		name: "EISKA (European and International Studies King's Association)",
		src: "/societies/LSN.png",
	},
	{ name: "KCL Backpackers", src: "/societies/LSN.png" },
	{ name: "KCL History Society", src: "/societies/LSN.png" },
	{ name: "KCL War Studies", src: "/societies/LSN.png" },
	{ name: "Boundless Compassion Charity Support", src: "/societies/LSN.png" },
	{ name: "KCL Football (Men's)", src: "/societies/kcl-mens-football.png" },
	{ name: "Women and Politics", src: "/societies/LSN.png" },
	{ name: "KCL European Society", src: "/societies/LSN.png" },
	{ name: "KCL Political Economy Society", src: "/societies/LSN.png" },
	{ name: "Imperial College Film Society", src: "/societies/LSN.png" },
	{ name: "LSESU Entrepreneurs", src: "/societies/LSN.png" },
	{ name: "Imperial Entrepreneurs", src: "/societies/icl-entre.png" },
	{ name: "KCL Liberal Democrats", src: "/societies/LSN.png" },
	{ name: "KCL Think Tank", src: "/societies/LSN.png" },
	{ name: "Student Startups UK", src: "/societies/student-startups-uk.png" },
	{
		name: "American Society University of Westminster ",
		src: "/societies/LSN.png",
	},
	{ name: "Imperial College Law Society", src: "/societies/icl-law.png" },
	{ name: "European Affairs Institute", src: "/societies/LSN.png" },
	{ name: "Imperial College Union", src: "/societies/imperial-union.png" },
	{ name: "UCL Students' Union", src: "/societies/ucl-union.png" },
	{ name: "LSE Students' Union", src: "/societies/lse-union.svg" },
	{ name: "KCLSU Events", src: "/societies/kclsu.png" },
];

export const SponsorsInformation = [
	{ name: "Vercel" },
	{ name: "Google" },
	{ name: "Microsoft" },
	{ name: "Amazon Web Services" },
	{ name: "Meta" },
	{ name: "Apple" },
	{ name: "Netflix" },
	{ name: "Spotify" },
	{ name: "Canva" },
	{ name: "Figma" },
	{ name: "Notion" },
	{ name: "Slack" },
];

export function returnLogo(organiser: string): {
	found: boolean;
	src?: string;
} {
	const logo = SocietyLogos.find((logo) => logo.name === organiser);
	if (logo) {
		return { found: true, src: logo.src };
	}
	return { found: false };
}

export const placeholderImages = [
	{ src: "/images/placeholders/lecture-hall-1.jpg", name: "Lecture" },
	{ src: "/images/placeholders/teaching.jpg", name: "Education" },
	{ src: "/images/placeholders/social.jpg", name: "Social Gathering" },
	{ src: "/images/placeholders/running.jpg", name: "Sports" },
	{ src: "/images/placeholders/band-practice.jpg", name: "Music Practice" },
	{ src: "/images/placeholders/brainstorm.jpg", name: "Brainstorm" },
	{ src: "/images/placeholders/pub.jpg", name: "Pub" },
	{ src: "/images/placeholders/football.jpg", name: "Football" },
];

export const FallbackStatistics = {
	total_events: "90",
	total_universities: "20",
	total_societies: "50",
};

export function generateToken(): string {
	const token = uuidv4();

	if (!token) {
		console.error("Failed to generate token");
		throw new Error("Failed to generate token");
	}

	return token;
}

// MARK: Society Slug Utilities

/**
 * Reserved slugs that cannot be used for society URLs
 * These match existing routes and system pages
 */
export const RESERVED_SLUGS = [
	'admin', 'api', 'message', 'society', 'partners', 'thank-you',
	'new', 'edit', 'create', 'delete', 'update', 'settings',
	'overview', 'events', 'about', 'contact', 'login', 'register',
	'signup', 'signin', 'logout', 'account', 'profile', 'dashboard'
];

/**
 * Generate a URL-friendly slug from a society name
 * @param name - The society name to convert
 * @returns A slug suitable for URLs (e.g., "KCL Neurotech" → "kcl-neurotech")
 */
export function generateSlugFromName(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-')          // Replace spaces with hyphens
		.replace(/-+/g, '-')           // Remove consecutive hyphens
		.substring(0, 60)              // Truncate to 60 characters
		.replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
}

/**
 * Validate a slug according to our rules
 * @param slug - The slug to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSlug(slug: string): string | null {
	// 1. Length check
	if (slug.length < 3) {
		return "Slug must be at least 3 characters long";
	}
	if (slug.length > 60) {
		return "Slug must be 60 characters or less";
	}

	// 2. Format check: lowercase letters, numbers, hyphens only
	if (!/^[a-z0-9-]+$/.test(slug)) {
		return "Slug can only contain lowercase letters, numbers, and hyphens";
	}

	// 3. No leading/trailing hyphens
	if (slug.startsWith('-') || slug.endsWith('-')) {
		return "Slug cannot start or end with a hyphen";
	}

	// 4. No consecutive hyphens
	if (slug.includes('--')) {
		return "Slug cannot contain consecutive hyphens";
	}

	// 5. Reserved words check
	if (RESERVED_SLUGS.includes(slug)) {
		return "This slug is reserved for system use";
	}

	return null; // Valid
}

/**
 * Sanitize user input for slug
 * @param input - Raw user input
 * @returns Sanitized slug
 */
export function sanitizeSlugInput(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphen
		.replace(/-+/g, '-')          // Remove consecutive hyphens
		.replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
		.substring(0, 60);            // Enforce max length
}

