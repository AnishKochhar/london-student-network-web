
export function generateYears(startYear = 2024, range = 10) {
	return Array.from({ length: range }, (_, i) => startYear + i);
}

export function generateMonths() {
	return [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
}

export function generateDays() {
	return Array.from({ length: 31 }, (_, i) => i + 1);
}


export function generateHours() {
	return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
}

export function generateMinutes() {
	return Array.from({ length: 4 }, (_, i) => String(i * 15).padStart(2, '0'));
}

export function formatDateString(dateString: string, short: boolean = true): string {
	const [day, month, year] = dateString.split('/').map(Number)
	const date = new Date(year, month - 1, day)

	const dayOfWeek = date.toLocaleString('en-US', { weekday: short ? 'short' : 'long' })
	const dayInMonth = String(day).padStart(2, '0')
	const monthName = date.toLocaleString('en-US', { month: short ? 'short' : 'long' })

	return `${dayOfWeek}, ${dayInMonth} ${monthName}`
}

export function getMonthName(month: string): string {
	const monthNames = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	const monthIndex = parseInt(month, 10) - 1;
	return monthNames[monthIndex] || "Invalid month";
}
