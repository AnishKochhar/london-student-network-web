// Three-word referral code generator - simple, memorable, and catchy
export const adjectives = [
    'happy', 'bright', 'swift', 'clever', 'brave', 'calm', 'bold', 'cool', 'wise', 'kind',
    'smart', 'quick', 'strong', 'gentle', 'lucky', 'royal', 'super', 'magic', 'sunny', 'fresh',
    'mighty', 'golden', 'silver', 'cosmic', 'epic', 'wild', 'free', 'pure', 'noble', 'keen'
];

export const nouns = [
    'tiger', 'eagle', 'lion', 'wolf', 'bear', 'fox', 'hawk', 'shark', 'whale', 'dragon',
    'phoenix', 'falcon', 'panther', 'cobra', 'storm', 'flame', 'wave', 'star', 'moon', 'sun',
    'thunder', 'lightning', 'ocean', 'mountain', 'forest', 'river', 'cloud', 'wind', 'fire', 'ice'
];

export const actions = [
    'runs', 'flies', 'jumps', 'roars', 'shines', 'dances', 'soars', 'glows', 'strikes', 'races',
    'leaps', 'charges', 'blazes', 'flows', 'rises', 'sparkles', 'dashes', 'glides', 'bounces', 'zooms',
    'flashes', 'surges', 'rushes', 'sweeps', 'bursts', 'shoots', 'spins', 'swirls', 'drifts', 'rolls'
];

export function generateThreeWordCode(): string {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    return `${adjective}-${noun}-${action}`;
}

// Helper function to validate a three-word code format
export function isValidThreeWordCode(code: string): boolean {
    const parts = code.split('-');
    return parts.length === 3 &&
           adjectives.includes(parts[0]) &&
           nouns.includes(parts[1]) &&
           actions.includes(parts[2]);
}