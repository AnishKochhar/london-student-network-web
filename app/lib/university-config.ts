/**
 * University configuration for filtering and display
 * Contains display-friendly names and logo paths
 */

export interface UniversityConfig {
    code: string;           // Database identifier (matches society_information.university_affiliation)
    displayName: string;    // Short, commonly-used name for UI
    fullName: string;       // Full official name
    logoPath: string;       // Path to logo in /public/images/universities/
}

/**
 * All supported universities with their display configurations
 * Ordered roughly by size/prominence for default display order
 */
export const UNIVERSITIES: UniversityConfig[] = [
    // Major London Universities (Russell Group + Large)
    {
        code: 'imperial',
        displayName: 'Imperial',
        fullName: 'Imperial College London',
        logoPath: '/images/universities/imperial.png',
    },
    {
        code: 'ucl',
        displayName: 'UCL',
        fullName: 'University College London',
        logoPath: '/images/universities/ucl.png',
    },
    {
        code: 'kcl',
        displayName: "King's",
        fullName: "King's College London",
        logoPath: '/images/universities/kcl.png',
    },
    {
        code: 'lse',
        displayName: 'LSE',
        fullName: 'London School of Economics',
        logoPath: '/images/universities/lse.png',
    },
    {
        code: 'qmul',
        displayName: 'Queen Mary',
        fullName: 'Queen Mary University of London',
        logoPath: '/images/universities/qmul.png',
    },

    // University of London Federation
    {
        code: 'city',
        displayName: 'City',
        fullName: 'City, University of London',
        logoPath: '/images/universities/city.png',
    },
    {
        code: 'goldsmiths',
        displayName: 'Goldsmiths',
        fullName: 'Goldsmiths, University of London',
        logoPath: '/images/universities/goldsmiths.png',
    },
    {
        code: 'soas',
        displayName: 'SOAS',
        fullName: 'SOAS University of London',
        logoPath: '/images/universities/soas.png',
    },
    {
        code: 'royal-holloway',
        displayName: 'Royal Holloway',
        fullName: 'Royal Holloway, University of London',
        logoPath: '/images/universities/royal-holloway.png',
    },
    {
        code: 'birkbeck',
        displayName: 'Birkbeck',
        fullName: 'Birkbeck, University of London',
        logoPath: '/images/universities/birkbeck.png',
    },
    {
        code: 'st-georges',
        displayName: "St George's",
        fullName: "St George's, University of London",
        logoPath: '/images/universities/st-georges.png',
    },

    // Other Major London Universities
    {
        code: 'greenwich',
        displayName: 'Greenwich',
        fullName: 'University of Greenwich',
        logoPath: '/images/universities/greenwich.png',
    },
    {
        code: 'westminster',
        displayName: 'Westminster',
        fullName: 'University of Westminster',
        logoPath: '/images/universities/westminster.png',
    },
    {
        code: 'kingston',
        displayName: 'Kingston',
        fullName: 'Kingston University',
        logoPath: '/images/universities/kingston.png',
    },
    {
        code: 'brunel',
        displayName: 'Brunel',
        fullName: 'Brunel University London',
        logoPath: '/images/universities/brunel.png',
    },
    {
        code: 'middlesex',
        displayName: 'Middlesex',
        fullName: 'Middlesex University',
        logoPath: '/images/universities/middlesex.png',
    },
    {
        code: 'roehampton',
        displayName: 'Roehampton',
        fullName: 'University of Roehampton',
        logoPath: '/images/universities/roehampton.png',
    },
    {
        code: 'uel',
        displayName: 'East London',
        fullName: 'University of East London',
        logoPath: '/images/universities/uel.png',
    },
    {
        code: 'uwl',
        displayName: 'West London',
        fullName: 'University of West London',
        logoPath: '/images/universities/uwl.png',
    },
    {
        code: 'southbank',
        displayName: 'South Bank',
        fullName: 'London South Bank University',
        logoPath: '/images/universities/southbank.png',
    },
    {
        code: 'london-met',
        displayName: 'London Met',
        fullName: 'London Metropolitan University',
        logoPath: '/images/universities/london-met.png',
    },

    // Arts & Specialist
    {
        code: 'arts',
        displayName: 'UAL',
        fullName: 'University of the Arts London',
        logoPath: '/images/universities/arts.png',
    },
    {
        code: 'rca',
        displayName: 'RCA',
        fullName: 'Royal College of Art',
        logoPath: '/images/universities/rca.png',
    },
    {
        code: 'rcm',
        displayName: 'RCM',
        fullName: 'Royal College of Music',
        logoPath: '/images/universities/rcm.png',
    },
    {
        code: 'ram',
        displayName: 'Royal Academy',
        fullName: 'Royal Academy of Music',
        logoPath: '/images/universities/ram.png',
    },
    {
        code: 'gsmd',
        displayName: 'Guildhall',
        fullName: 'Guildhall School of Music and Drama',
        logoPath: '/images/universities/gsmd.png',
    },
    {
        code: 'courtauld',
        displayName: 'Courtauld',
        fullName: 'Courtauld Institute of Art',
        logoPath: '/images/universities/courtauld.png',
    },
    {
        code: 'trinitylaban',
        displayName: 'Trinity Laban',
        fullName: 'Trinity Laban Conservatoire',
        logoPath: '/images/universities/trinitylaban.png',
    },
    {
        code: 'ravensbourne',
        displayName: 'Ravensbourne',
        fullName: 'Ravensbourne University London',
        logoPath: '/images/universities/ravensbourne.png',
    },

    // Business & Professional
    {
        code: 'lbs',
        displayName: 'LBS',
        fullName: 'London Business School',
        logoPath: '/images/universities/lbs.png',
    },
    {
        code: 'regents',
        displayName: "Regent's",
        fullName: "Regent's University London",
        logoPath: '/images/universities/regents.png',
    },

    // Medical & Science Specialist
    {
        code: 'lshtm',
        displayName: 'LSHTM',
        fullName: 'London School of Hygiene & Tropical Medicine',
        logoPath: '/images/universities/lshtm.png',
    },
    {
        code: 'rvc',
        displayName: 'RVC',
        fullName: 'Royal Veterinary College',
        logoPath: '/images/universities/rvc.png',
    },
    {
        code: 'icr',
        displayName: 'ICR',
        fullName: 'Institute of Cancer Research',
        logoPath: '/images/universities/icr.png',
    },
    {
        code: 'cssd',
        displayName: 'Central',
        fullName: 'Royal Central School of Speech and Drama',
        logoPath: '/images/universities/cssd.png',
    },
    {
        code: 'libf',
        displayName: 'LIBF',
        fullName: 'London Institute of Banking & Finance',
        logoPath: '/images/universities/libf.png',
    },
];

/**
 * Map of university codes to their configs for quick lookup
 */
export const UNIVERSITY_MAP: Record<string, UniversityConfig> = UNIVERSITIES.reduce(
    (acc, uni) => {
        acc[uni.code] = uni;
        return acc;
    },
    {} as Record<string, UniversityConfig>
);

/**
 * Get all university codes
 */
export const UNIVERSITY_CODES = UNIVERSITIES.map(u => u.code);

/**
 * Get display name for a university code
 */
export function getUniversityDisplayName(code: string): string {
    return UNIVERSITY_MAP[code]?.displayName ?? code;
}

/**
 * Get university config by code
 */
export function getUniversityConfig(code: string): UniversityConfig | undefined {
    return UNIVERSITY_MAP[code];
}
