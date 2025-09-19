// Formats content by replacing newlines
export function formatContent(content: string = "") {
    if (!content) return "";

    return content.replace(/\\n/g, "\n").replace(/\n\n+/g, "\n\n");
}

// Calculates a human-readable "time ago" string with proper timezone handling
export function getTimeAgo(dateString: string) {
    // Parse the input date string directly
    const date = new Date(dateString);
    const now = new Date();

    // Calculate difference in raw milliseconds, ignoring timezone differences
    const diffMs = now.getTime() - date.getTime();

    // Convert to minutes
    const diffInMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffInMinutes < 1) {
        return "just now";
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    } else {
        const diffInHours = Math.floor(diffInMinutes / 60);

        if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 30) {
                return `${diffInDays}d ago`;
            } else {
                const diffInMonths = Math.floor(diffInDays / 30);
                if (diffInMonths < 12) {
                    return `${diffInMonths}mo ago`;
                } else {
                    const diffInYears = Math.floor(diffInMonths / 12);
                    return `${diffInYears}y ago`;
                }
            }
        }
    }
}

// Generates avatar initials from a name
export function getAvatarInitials(name: string = "Anonymous User") {
    return name
        .split(" ")
        .map((part) => part[0]?.toUpperCase() || "")
        .slice(0, 2)
        .join("");
}

export function getScoreColor(score: number): string {
    if (score > 0) return "text-green-400";
    if (score < 0) return "text-red-400";
    return "text-gray-400";
}
