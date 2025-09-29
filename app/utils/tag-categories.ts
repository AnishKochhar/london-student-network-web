// Society tag categorization system
// Maps database tag values to organized categories for better UX

export interface TagCategory {
	id: string;
	name: string;
	icon: string;
	color: string;
	tags: Array<{
		value: number;
		label: string;
	}>;
}

export const TAG_CATEGORIES: TagCategory[] = [
	{
		id: 'academic',
		name: 'Academic',
		icon: '🎓',
		color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
		tags: [
			{ value: 35, label: 'Biology' },
			{ value: 34, label: 'Chemistry' },
			{ value: 24, label: 'Computer Science' },
			{ value: 22, label: 'Economics' },
			{ value: 15, label: 'Engineering' },
			{ value: 37, label: 'Geography' },
			{ value: 3, label: 'History' },
			{ value: 23, label: 'Law' },
			{ value: 17, label: 'Literature' },
			{ value: 2, label: 'Maths' },
			{ value: 36, label: 'Physics' },
			{ value: 5, label: 'Politics' },
			{ value: 25, label: 'Psychology' },
			{ value: 14, label: 'Science' },
			{ value: 77, label: 'Anthropology' },
			{ value: 135, label: 'Bioengineering' },
			{ value: 131, label: 'Gender Studies' },
			{ value: 28, label: 'International Relations' },
			{ value: 29, label: 'Languages' },
			{ value: 21, label: 'Film Studies' },
			{ value: 9, label: 'Philosophy' },
			{ value: 99, label: 'Neuroscience' },
			{ value: 90, label: 'Political Science' },
			{ value: 76, label: 'Sociology' },
			{ value: 117, label: 'Social Science' },
			{ value: 137, label: 'Peace Studies' },
			{ value: 98, label: 'Public Policy' }
		]
	},
	{
		id: 'technology',
		name: 'Technology',
		icon: '💻',
		color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
		tags: [
			{ value: 32, label: 'AI' },
			{ value: 42, label: 'Coding' },
			{ value: 96, label: 'Coding Bootcamp' },
			{ value: 113, label: 'Coding Club' },
			{ value: 109, label: '3D Printing' },
			{ value: 133, label: 'Creative Technology' },
			{ value: 62, label: 'Hackathons' },
			{ value: 104, label: 'Machine Learning Club' },
			{ value: 114, label: 'Innovation Hub' },
			{ value: 124, label: 'Innovation Contest' },
			{ value: 126, label: 'Design Thinking' },
			{ value: 40, label: 'Graphic Design' },
			{ value: 12, label: 'Robotics' },
			{ value: 61, label: 'Tech Talks' },
			{ value: 94, label: 'Technology Club' },
			{ value: 134, label: 'Robotics Society' }
		]
	},
	{
		id: 'business',
		name: 'Business',
		icon: '💼',
		color: 'bg-green-500/20 text-green-300 border-green-500/30',
		tags: [
			{ value: 13, label: 'Business' },
			{ value: 95, label: 'Business Society' },
			{ value: 26, label: 'Entrepreneurship' },
			{ value: 31, label: 'Finance' },
			{ value: 30, label: 'Marketing' },
			{ value: 56, label: 'Networking' },
			{ value: 122, label: 'Startup Club' },
			{ value: 123, label: 'Tech Startup' },
			{ value: 140, label: 'Startup Incubator' },
			{ value: 41, label: 'Social Media' },
			{ value: 110, label: 'Social Media Strategy' },
			{ value: 139, label: 'Marketing Research' }
		]
	},
	{
		id: 'arts-creative',
		name: 'Arts & Creative',
		icon: '🎨',
		color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
		tags: [
			{ value: 18, label: 'Art' },
			{ value: 68, label: 'Art Gallery' },
			{ value: 1, label: 'Dance' },
			{ value: 64, label: 'Dance Club' },
			{ value: 78, label: 'Dance Performance' },
			{ value: 65, label: 'Film Club' },
			{ value: 93, label: 'Film Production' },
			{ value: 141, label: 'Film Screening' },
			{ value: 102, label: 'Fine Arts' },
			{ value: 100, label: 'Creative Writing' },
			{ value: 66, label: 'Literary Magazine' },
			{ value: 57, label: 'Literary Society' },
			{ value: 16, label: 'Music' },
			{ value: 118, label: 'Music Production' },
			{ value: 142, label: 'Music Society' },
			{ value: 19, label: 'Photography' },
			{ value: 81, label: 'Photography Club' },
			{ value: 10, label: 'Theatre' },
			{ value: 138, label: 'Performing Arts' },
			{ value: 103, label: 'Documentary Club' },
			{ value: 39, label: 'Writing' },
			{ value: 43, label: 'Poetry' },
			{ value: 59, label: 'Poetry Slam' },
			{ value: 120, label: 'Writing Workshop' }
		]
	},
	{
		id: 'sports-fitness',
		name: 'Sports & Fitness',
		icon: '⚽',
		color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
		tags: [
			{ value: 7, label: 'Cycling' },
			{ value: 6, label: 'Hiking' },
			{ value: 86, label: 'Cycling Club' },
			{ value: 83, label: 'Hiking Society' },
			{ value: 87, label: 'Equestrian Club' },
			{ value: 84, label: 'Yoga' },
			{ value: 85, label: 'Swimming' },
			{ value: 63, label: 'Nature Walks' }
		]
	},
	{
		id: 'social-cultural',
		name: 'Social & Cultural',
		icon: '🌍',
		color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
		tags: [
			{ value: 50, label: 'Cultural Exchange' },
			{ value: 144, label: 'Cultural Awareness' },
			{ value: 48, label: 'LGBTQ+' },
			{ value: 74, label: 'Gender Equality' },
			{ value: 143, label: 'Feminist Society' },
			{ value: 54, label: 'Human Rights' },
			{ value: 44, label: 'Animal Rights' },
			{ value: 45, label: 'Environmentalism' },
			{ value: 8, label: 'Christianity' },
			{ value: 71, label: 'Religious Studies' },
			{ value: 92, label: 'Religious Organization' },
			{ value: 82, label: 'Meditation' },
			{ value: 47, label: 'Volunteerism' },
			{ value: 49, label: 'Social Justice' },
			{ value: 51, label: 'Travel' },
			{ value: 115, label: 'Volunteer Opportunities' },
			{ value: 116, label: 'Philanthropy' },
			{ value: 130, label: 'Animal Welfare' },
			{ value: 132, label: 'Humanitarian Aid' },
			{ value: 136, label: 'Social Innovation' }
		]
	},
	{
		id: 'gaming-entertainment',
		name: 'Gaming & Entertainment',
		icon: '🎮',
		color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
		tags: [
			{ value: 72, label: 'Board Games' },
			{ value: 89, label: 'Board Games Night' },
			{ value: 67, label: 'Chess Club' },
			{ value: 69, label: 'Video Games' },
			{ value: 75, label: 'Podcasting' },
			{ value: 108, label: 'University Radio' }
		]
	},
	{
		id: 'community-wellness',
		name: 'Community & Wellness',
		icon: '❤️',
		color: 'bg-red-500/20 text-red-300 border-red-500/30',
		tags: [
			{ value: 112, label: 'Community Outreach' },
			{ value: 27, label: 'Health & Wellbeing' },
			{ value: 125, label: 'Food Justice' },
			{ value: 127, label: 'Food Science' },
			{ value: 20, label: 'Cooking' },
			{ value: 58, label: 'Cooking Club' },
			{ value: 52, label: 'Civics' },
			{ value: 4, label: 'Debate' },
			{ value: 70, label: 'Debate Society' },
			{ value: 88, label: 'Debate Tournament' },
			{ value: 38, label: 'Public Speaking' },
			{ value: 53, label: 'Student Government' },
			{ value: 46, label: 'Student Welfare' },
			{ value: 111, label: 'Student Events' },
			{ value: 97, label: 'Mental Health Awareness' },
			{ value: 73, label: 'Public Health' },
			{ value: 129, label: 'Public Health Club' },
			{ value: 79, label: 'Mindfulness' },
			{ value: 11, label: 'Sustainability' },
			{ value: 128, label: 'Sustainable Fashion' }
		]
	},
	{
		id: 'science-research',
		name: 'Science & Research',
		icon: '🔬',
		color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
		tags: [
			{ value: 33, label: 'Astronomy' },
			{ value: 107, label: 'Astronomy Club' },
			{ value: 80, label: 'Research Club' },
			{ value: 105, label: 'Science Society' },
			{ value: 106, label: 'Physics Society' },
			{ value: 119, label: 'Psychological Society' },
			{ value: 121, label: 'Research Symposium' },
			{ value: 101, label: 'Sociology Club' },
			{ value: 60, label: 'History Club' },
			{ value: 91, label: 'History Society' }
		]
	}
];

// Helper functions
export function getTagsByCategory(categoryId: string): Array<{ value: number, label: string }> {
	const category = TAG_CATEGORIES.find(cat => cat.id === categoryId);
	return category ? category.tags : [];
}

export function getCategoryByTagValue(tagValue: number): TagCategory | null {
	for (const category of TAG_CATEGORIES) {
		if (category.tags.some(tag => tag.value === tagValue)) {
			return category;
		}
	}
	return null;
}

export function getAllTags(): Array<{ value: number, label: string, category: string }> {
	const allTags: Array<{ value: number, label: string, category: string }> = [];

	TAG_CATEGORIES.forEach(category => {
		category.tags.forEach(tag => {
			allTags.push({
				...tag,
				category: category.id
			});
		});
	});

	return allTags.sort((a, b) => a.label.localeCompare(b.label));
}

export function searchTags(query: string): Array<{ value: number, label: string, category: string }> {
	const allTags = getAllTags();
	const normalizedQuery = query.toLowerCase();

	return allTags.filter(tag =>
		tag.label.toLowerCase().includes(normalizedQuery)
	);
}

// Popular tags shortcuts (most commonly used and broadly appealing)
export const POPULAR_TAGS = [
	{ value: 13, label: 'Business' },
	{ value: 32, label: 'AI' },
	{ value: 16, label: 'Music' },
	{ value: 18, label: 'Art' },
	{ value: 4, label: 'Debate' },
	{ value: 50, label: 'Cultural Exchange' },
	{ value: 42, label: 'Coding' },
	{ value: 19, label: 'Photography' },
	{ value: 31, label: 'Finance' },
	{ value: 56, label: 'Networking' },
	{ value: 144, label: 'Cultural Awareness' },
	{ value: 5, label: 'Politics' }
];