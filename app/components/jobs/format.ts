/**
 * Small presentation helpers for opportunity cards (client-safe, no deps).
 */

const AVATAR_GRADIENTS = [
    "from-sky-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-sky-600",
];

/** Deterministic gradient for an organisation's avatar based on its name. */
export function avatarGradient(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

/** Up-to-two-letter initials for an organisation name. */
export function initials(name: string): string {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
