/**
 * Client-side mapping of university email domains to university names
 * Used for auto-filling the university dropdown without database calls
 * Synced with university_email_domains table
 */

export interface UniversityMapping {
	domain: string;
	name: string;
	code: string;
}

// Comprehensive mapping of all London university email domains
export const UNIVERSITY_EMAIL_MAPPINGS: UniversityMapping[] = [
	// Russell Group London universities
	{ domain: 'imperial.ac.uk', name: 'Imperial College London', code: 'imperial' },
	{ domain: 'ic.ac.uk', name: 'Imperial College London', code: 'imperial' },
	{ domain: 'ucl.ac.uk', name: 'University College London', code: 'ucl' },
	{ domain: 'uclglobal.ac.uk', name: 'University College London', code: 'ucl' },
	{ domain: 'kcl.ac.uk', name: "King's College London", code: 'kcl' },
	{ domain: 'kings.ac.uk', name: "King's College London", code: 'kcl' },
	{ domain: 'lse.ac.uk', name: 'London School Of Economics (LSE)', code: 'lse' },
	{ domain: 'carr.ac.uk', name: 'London School Of Economics (LSE)', code: 'lse' },
	{ domain: 'economics.ac.uk', name: 'London School Of Economics (LSE)', code: 'lse' },
	{ domain: 'qmul.ac.uk', name: 'Queen Mary University Of London', code: 'qmul' },

	// University of London federation members
	{ domain: 'bbk.ac.uk', name: 'Birkbeck, University of London', code: 'birkbeck' },
	{ domain: 'birkbeck.ac.uk', name: 'Birkbeck, University of London', code: 'birkbeck' },
	{ domain: 'city.ac.uk', name: 'City, University of London', code: 'city' },
	{ domain: 'castle.ac.uk', name: 'City, University of London', code: 'city' },
	{ domain: 'citystgeorges.ac.uk', name: 'City, University of London', code: 'city' },
	{ domain: 'sgul.ac.uk', name: "St George's, University of London", code: 'st-georges' },
	{ domain: 'courtauld.ac.uk', name: 'Courtauld Institute of Art', code: 'courtauld' },
	{ domain: 'gold.ac.uk', name: 'Goldsmiths, University of London', code: 'goldsmiths' },
	{ domain: 'icr.ac.uk', name: 'Institute of Cancer Research', code: 'icr' },
	{ domain: 'lbs.ac.uk', name: 'London Business School', code: 'lbs' },
	{ domain: 'lshtm.ac.uk', name: 'London School of Hygiene & Tropical Medicine', code: 'lshtm' },
	{ domain: 'ram.ac.uk', name: 'Royal Academy of Music', code: 'ram' },
	{ domain: 'cssd.ac.uk', name: 'Royal Central School of Speech and Drama', code: 'cssd' },
	{ domain: 'rhul.ac.uk', name: 'Royal Holloway, University of London', code: 'royal-holloway' },
	{ domain: 'rhbnc.ac.uk', name: 'Royal Holloway, University of London', code: 'royal-holloway' },
	{ domain: 'rvc.ac.uk', name: 'Royal Veterinary College', code: 'rvc' },
	{ domain: 'soas.ac.uk', name: 'SOAS, University Of London', code: 'soas' },

	// Other major London universities
	{ domain: 'arts.ac.uk', name: 'University of the Arts London', code: 'arts' },
	{ domain: 'cltad.ac.uk', name: 'University of the Arts London', code: 'arts' },
	{ domain: 'brunel.ac.uk', name: 'Brunel University', code: 'brunel' },
	{ domain: 'greenwich.ac.uk', name: 'University Of Greenwich', code: 'greenwich' },
	{ domain: 'gre.ac.uk', name: 'University Of Greenwich', code: 'greenwich' },
	{ domain: 'kingston.ac.uk', name: 'Kingston University', code: 'kingston' },
	{ domain: 'londonmet.ac.uk', name: 'London Metropolitan University', code: 'london-met' },
	{ domain: 'londonmetropolitan.ac.uk', name: 'London Metropolitan University', code: 'london-met' },
	{ domain: 'lsbu.ac.uk', name: 'London South Bank University', code: 'southbank' },
	{ domain: 'southbank.ac.uk', name: 'London South Bank University', code: 'southbank' },
	{ domain: 'mdx.ac.uk', name: 'Middlesex University', code: 'middlesex' },
	{ domain: 'roehampton.ac.uk', name: 'University Of Roehampton', code: 'roehampton' },
	{ domain: 'uel.ac.uk', name: 'University of East London', code: 'uel' },
	{ domain: 'uwl.ac.uk', name: 'University of West London', code: 'uwl' },
	{ domain: 'westminster.ac.uk', name: 'University Of Westminster', code: 'westminster' },

	// Specialist institutions
	{ domain: 'rca.ac.uk', name: 'Royal College of Art', code: 'rca' },
	{ domain: 'rcm.ac.uk', name: 'Royal College of Music', code: 'rcm' },
	{ domain: 'gsmd.ac.uk', name: 'Guildhall School of Music and Drama', code: 'gsmd' },
	{ domain: 'trinitylaban.ac.uk', name: 'Trinity Laban Conservatoire', code: 'trinitylaban' },
	{ domain: 'ravensbourne.ac.uk', name: 'Ravensbourne University London', code: 'ravensbourne' },
	{ domain: 'libf.ac.uk', name: 'London Institute of Banking & Finance', code: 'libf' },
	{ domain: 'regents.ac.uk', name: "Regent's University London", code: 'regents' },
];

/**
 * Extract university name from email address
 * @param email - University email address (e.g., "user@imperial.ac.uk")
 * @returns University name or null if not recognized
 */
export function extractUniversityFromEmail(email: string): string | null {
	if (!email || typeof email !== 'string') return null;

	const emailLower = email.toLowerCase().trim();
	const domain = emailLower.split('@')[1];

	if (!domain) return null;

	// Find matching university
	const university = UNIVERSITY_EMAIL_MAPPINGS.find(
		(mapping) => mapping.domain === domain
	);

	return university ? university.name : null;
}

/**
 * Check if email domain looks like a university domain
 * @param email - Email address to check
 * @returns true if .ac.uk or .edu domain (server validates if it's in our database)
 */
export function isUniversityEmail(email: string): boolean {
	if (!email || typeof email !== 'string') return false;

	const emailLower = email.toLowerCase().trim();
	const domain = emailLower.split('@')[1];

	// Accept .ac.uk (UK) or .edu (US) domains
	// Server will validate if the specific domain is in our database
	return domain?.endsWith('.ac.uk') || domain?.endsWith('.edu') || false;
}

/**
 * Get university code from email (for database operations)
 * @param email - University email address
 * @returns University code or null
 */
export function getUniversityCode(email: string): string | null {
	if (!email || typeof email !== 'string') return null;

	const emailLower = email.toLowerCase().trim();
	const domain = emailLower.split('@')[1];

	if (!domain) return null;

	const university = UNIVERSITY_EMAIL_MAPPINGS.find(
		(mapping) => mapping.domain === domain
	);

	return university ? university.code : null;
}

/**
 * Convert university code to full university name
 * @param code - University code (e.g., "imperial", "ucl")
 * @returns University name or null if code not recognized
 */
export function getUniversityNameFromCode(code: string): string | null {
	if (!code || typeof code !== 'string') return null;

	const codeLower = code.toLowerCase().trim();

	// Find first mapping with this code
	const university = UNIVERSITY_EMAIL_MAPPINGS.find(
		(mapping) => mapping.code === codeLower
	);

	return university ? university.name : null;
}
