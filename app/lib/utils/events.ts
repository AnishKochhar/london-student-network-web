import { SQLEvent, Event, FormData, Registrations, SQLRegistrations, Partner, Tag } from '../types';

export async function fetchPartners(page: number, limit: number) {
    try {
        const response = await fetch('/api/societies/get-organiser-cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ page, limit }), // Sending page and limit in the body
        });

        if (!response.ok) {
            throw new Error('Failed to fetch organisers card data');
        }

        const data = await response.json();

        // Fetch predefined tags once
        const predefinedTags = await getPredefinedTags();

        // Map predefined tags into a lookup object for efficient access
        const tagLookup: Record<number, string> = predefinedTags.reduce((acc: Record<number, string>, tag: Tag) => {
            acc[tag.value] = tag.label;
            return acc;
        }, {});

        // Map the response to the desired format
        const formattedPartners = data.map((partner: Partner) => ({
            id: partner.id,
            name: partner.name || 'Unknown Name',
            keywords: (partner.tags || []).map((tag: number) => {
                return tagLookup[tag] || 'Unknown Tag';
            }),
            description: partner.description || 'No description provided',
            website: partner.website || 'No website available',
            logo: partner.logo_url || null,

        }));
        
        return formattedPartners;
    } catch (err) {
        console.error('failed to retrieve partners', err);
    }
}

export async function fetchAllPartners() {
    try {
        const response = await fetch('/api/societies/get-all-organiser-cards');

        if (!response.ok) {
            throw new Error('Failed to fetch organisers card data');
        }

        const data = await response.json();

        // Fetch predefined tags once
        const predefinedTags = await getPredefinedTags();

        // Map predefined tags into a lookup object for efficient access
        const tagLookup: Record<number, string> = predefinedTags.reduce((acc: Record<number, string>, tag: Tag) => {
            acc[tag.value] = tag.label;
            return acc;
        }, {});

        // Map the response to the desired format
        const formattedPartners = data.map((partner: Partner) => ({
            id: partner.id,
            name: partner.name || 'Unknown Name',
            keywords: (partner.tags || []).map((tag: number) => {
                return tagLookup[tag] || 'Unknown Tag';
            }),
            description: partner.description || 'No description provided',
            website: partner.website || 'No website available',
            logo: partner.logo_url || null,

        }));
        
        return formattedPartners;
    } catch (err) {
        console.error('Failed to retrieve partners', err);
    }
}

const fetchPredefinedEventTags = async () => { // this function might not need the map, should be tested
    try {
        const response = await fetch('/api/user/fetch-predefined-tags');
        if (!response.ok) {
            throw new Error(`Failed to fetch predefined tags: ${response.statusText}`);
        }
        const data = await response.json();

        const predefinedTags: Tag[] = data.map((tag: Tag): Tag => ({
            label: tag.label,
            value: tag.value, 
        }));

        return predefinedTags;

    } catch (error) {
        console.error('Error fetching predefined tags:', error);
        return []; 
    }
}
async function getPredefinedTags() {
    const predefinedTags = await fetchPredefinedEventTags();
    return predefinedTags;
}

export default getPredefinedTags

export function sortEventsByDate(events: Event[]): Event[] {
	return events.sort((a, b) => {
		const [dayA, monthA, yearA] = a.date.split('/').map(Number)
		const [dayB, monthB, yearB] = b.date.split('/').map(Number)
		const dateA = new Date(yearA, monthA - 1, dayA)
		const dateB = new Date(yearB, monthB - 1, dayB)
		return dateA.getTime() - dateB.getTime()
	})
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

    // Validate ticket price
    // if (formData?.tickets_price && formData?.tickets_price !== '') {
    //     const ticketsPrice = formData.tickets_price;
    //     const priceNumber = Number(ticketsPrice);

    //     if (typeof ticketsPrice !== 'string' || isNaN(priceNumber) || !/^\d+(\.\d{1,2})?$/.test(ticketsPrice)) {
    //         return "Invalid ticket price!";
    //     }

        // Ensure the price is greater than 0.30 or is exactly '0'
        // if (priceNumber !== 0 && priceNumber < 0.30) {
        //     return "Ticket price must be greater than 30p or exactly 0.";
        // }

        // Ensure payments are enabled for the society
        
    // }

    if (formData?.tickets_info && Array.isArray(formData?.tickets_info)) {
        for (let i = 0; i < formData.tickets_info.length; i++) {
            const ticket = formData.tickets_info[i];
            
            // Convert to number and handle empty values
            const priceNumber = Number(ticket?.price || 0);
            
            // Only validate if price is non-zero
            if (priceNumber !== 0) {
                const priceStr = String(ticket.price);
                
                // Check valid number format
                if (isNaN(priceNumber)) {
                    return `Invalid ticket price for ticket ${ticket.ticketName || `at index ${i}`}!`;
                }
                
                // Validate decimal format
                if (!/^\d+(\.\d{1,2})?$/.test(priceStr)) {
                    return `Ticket price format invalid for ${ticket.ticketName || `ticket ${i}`} - max 2 decimal places`;
                }
                
                // Validate minimum amount
                if (priceNumber < 0.30) {
                    return `Ticket price must be at least £0.30 for ${ticket.ticketName || `ticket ${i}`}, or free`;
                }
            }
        }
    }

    if (formData.tickets_info.length === 0) { // check if there is at least 1 ticket
        return `There must be at least 1 ticket type for event: ${formData.title}`
    }

    return undefined; // valid data
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

export const LondonUniversities = [
	"Imperial College London", "King's College London", "University College London", "City, University of London", 
	"Birkbeck, University of London", "Brunel University", "Goldsmiths, University of London", "London Business School", 
	"Kingston University", "London School Of Economics (LSE)", "London South Bank University", "University Of Westminster", 
	"SOAS, University Of London", "Royal Veterinary College", "Royal Holloway, University of London", "Royal College of Art", 
	"Queen Mary University Of London", "Middlesex University", "University Of Greenwich", "University Of Roehampton", 
	"University of the Arts London", "Courtauld Institute of Art",
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
	{ name: "KCL Neurotech Society", src: '/societies/kcl-neurotech.jpeg' },
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
	{ name: "KCL Football (Men's)", src: '/societies/kcl-mens-football.png' },
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