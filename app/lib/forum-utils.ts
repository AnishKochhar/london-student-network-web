// Formats content by replacing newlines
export function formatContent(content: string = '') {
  if (!content) return '';
  
  return content
    .replace(/\\n/g, '\n')
    .replace(/\n\n+/g, '\n\n');
}

// Calculates a human-readable "time ago" string
export function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}

// Generates avatar initials from a name
export function getAvatarInitials(name: string = 'Anonymous User') {
  return name.split(' ')
    .map(part => part[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');
}

export function getScoreColor(score: number): string {
  if (score > 0) return 'text-green-400';
  if (score < 0) return 'text-red-400';
  return 'text-gray-400';
}