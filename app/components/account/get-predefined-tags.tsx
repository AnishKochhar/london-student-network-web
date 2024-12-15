

// const predefinedTags = [
//     { label: "Dance", value: "1" },
//     { label: "Maths", value: "2" },
//     { label: "History", value: "3" },
//     { label: "Debate", value: "4" },
//     { label: "Politics", value: "5" },
//     { label: "Hiking", value: "6" },
//     { label: "Cycling", value: "7" },
//     { label: "Christianity", value: "8" },
//     { label: "Philosophy", value: "9" },
//     { label: "Theatre", value: "10" },
//     { label: "Sustainability", value: "11" },
//     { label: "Robotics", value: "12" },
//     { label: "Business", value: "13" },
//     { label: "Science", value: "14" },
//     { label: "Engineering", value: "15" },
//     { label: "Music", value: "16" },
//     { label: "Literature", value: "17" },
//     { label: "Art", value: "18" },
//     { label: "Photography", value: "19" },
//     { label: "Cooking", value: "20" },
//     { label: "Film Studies", value: "21" },
//     { label: "Economics", value: "22" },
//     { label: "Law", value: "23" },
//     { label: "Computer Science", value: "24" },
//     { label: "Psychology", value: "25" },
//     { label: "Entrepreneurship", value: "26" },
//     { label: "Health & Wellbeing", value: "27" },
//     { label: "International Relations", value: "28" },
//     { label: "Languages", value: "29" },
//     { label: "Marketing", value: "30" },
//     { label: "Finance", value: "31" },
//     { label: "AI", value: "32" },
//     { label: "Astronomy", value: "33" },
//     { label: "Chemistry", value: "34" },
//     { label: "Biology", value: "35" },
//     { label: "Physics", value: "36" },
//     { label: "Geography", value: "37" },
//     { label: "Public Speaking", value: "38" },
//     { label: "Writing", value: "39" },
//     { label: "Graphic Design", value: "40" },
//     { label: "Social Media", value: "41" },
//     { label: "Coding", value: "42" },
//     { label: "Poetry", value: "43" },
//     { label: "Animal Rights", value: "44" },
//     { label: "Environmentalism", value: "45" },
//     { label: "Student Welfare", value: "46" },
//     { label: "Volunteerism", value: "47" },
//     { label: "LGBTQ+", value: "48" },
//     { label: "Social Justice", value: "49" },
//     { label: "Cultural Exchange", value: "50" },
//     { label: "Travel", value: "51" },
//     { label: "Civics", value: "52" },
//     { label: "Student Government", value: "53" },
//     { label: "Human Rights", value: "54" },
//     { label: "Veterans Support", value: "55" },
//     { label: "Networking", value: "56" },
//     { label: "Literary Society", value: "57" },
//     { label: "Cooking Club", value: "58" },
//     { label: "Poetry Slam", value: "59" },
//     { label: "History Club", value: "60" },
//     { label: "Tech Talks", value: "61" },
//     { label: "Hackathons", value: "62" },
//     { label: "Nature Walks", value: "63" },
//     { label: "Dance Club", value: "64" },
//     { label: "Film Club", value: "65" },
//     { label: "Literary Magazine", value: "66" },
//     { label: "Chess Club", value: "67" },
//     { label: "Art Gallery", value: "68" },
//     { label: "Video Games", value: "69" },
//     { label: "Debate Society", value: "70" },
//     { label: "Religious Studies", value: "71" },
//     { label: "Board Games", value: "72" },
//     { label: "Public Health", value: "73" },
//     { label: "Gender Equality", value: "74" },
//     { label: "Podcasting", value: "75" },
//     { label: "Sociology", value: "76" },
//     { label: "Anthropology", value: "77" },
//     { label: "Dance Performance", value: "78" },
//     { label: "Mindfulness", value: "79" },
//     { label: "Research Club", value: "80" },
//     { label: "Photography Club", value: "81" },
//     { label: "Meditation", value: "82" },
//     { label: "Hiking Society", value: "83" },
//     { label: "Yoga", value: "84" },
//     { label: "Swimming", value: "85" },
//     { label: "Cycling Club", value: "86" },
//     { label: "Equestrian Club", value: "87" },
//     { label: "Debate Tournament", value: "88" },
//     { label: "Board Games Night", value: "89" },
//     { label: "Political Science", value: "90" },
//     { label: "History Society", value: "91" },
//     { label: "Religious Organization", value: "92" },
//     { label: "Film Production", value: "93" },
//     { label: "Technology Club", value: "94" },
//     { label: "Business Society", value: "95" },
//     { label: "Coding Bootcamp", value: "96" },
//     { label: "Mental Health Awareness", value: "97" },
//     { label: "Public Policy", value: "98" },
//     { label: "Neuroscience", value: "99" },
//     { label: "Creative Writing", value: "100" },
//     { label: "Sociology Club", value: "101" },
//     { label: "Fine Arts", value: "102" },
//     { label: "Documentary Club", value: "103" },
//     { label: "Machine Learning Club", value: "104" },
//     { label: "Science Society", value: "105" },
//     { label: "Physics Society", value: "106" },
//     { label: "Astronomy Club", value: "107" },
//     { label: "University Radio", value: "108" },
//     { label: "3D Printing", value: "109" },
//     { label: "Social Media Strategy", value: "110" },
//     { label: "Student Events", value: "111" },
//     { label: "Community Outreach", value: "112" },
//     { label: "Coding Club", value: "113" },
//     { label: "Innovation Hub", value: "114" },
//     { label: "Volunteer Opportunities", value: "115" },
//     { label: "Philanthropy", value: "116" },
//     { label: "Social Science", value: "117" },
//     { label: "Music Production", value: "118" },
//     { label: "Psychological Society", value: "119" },
//     { label: "Writing Workshop", value: "120" },
//     { label: "Research Symposium", value: "121" },
//     { label: "Startup Club", value: "122" },
//     { label: "Tech Startup", value: "123" },
//     { label: "Innovation Contest", value: "124" },
//     { label: "Food Justice", value: "125" },
//     { label: "Design Thinking", value: "126" },
//     { label: "Food Science", value: "127" },
//     { label: "Sustainable Fashion", value: "128" },
//     { label: "Public Health Club", value: "129" },
//     { label: "Animal Welfare", value: "130" },
//     { label: "Gender Studies", value: "131" },
//     { label: "Humanitarian Aid", value: "132" },
//     { label: "Creative Technology", value: "133" },
//     { label: "Robotics Society", value: "134" },
//     { label: "Bioengineering", value: "135" },
//     { label: "Social Innovation", value: "136" },
//     { label: "Peace Studies", value: "137" },
//     { label: "Performing Arts", value: "138" },
//     { label: "Marketing Research", value: "139" },
//     { label: "Startup Incubator", value: "140" },
//     { label: "Film Screening", value: "141" },
//     { label: "Music Society", value: "142" },
//     { label: "Feminist Society", value: "143" },
//     { label: "Cultural Awareness", value: "144" },
// ];

// const seed = async () => {
//     try {
//         const response = await fetch('/api/user/seed-predefined-tags', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(predefinedTags),
//         });

//         if (!response.ok) {
//             throw new Error(`Failed to seed tags: ${response.statusText}`);
//         }

//         console.log('Tags seeded successfully!');
//     } catch (error) {
//         console.error('Error seeding tags:', error);
//     }
// };

const fetchPredefinedTags = async () => {
    try {
        const response = await fetch('/api/user/fetch-predefined-tags');
        if (!response.ok) {
            throw new Error(`Failed to fetch predefined tags: ${response.statusText}`);
        }
        const data = await response.json();

        const predefinedTags = data.map(tag => ({
            label: tag.label,
            value: tag.value, 
        }));

        return predefinedTags;

    } catch (error) {
        console.error('Error fetching predefined tags:', error);
        return []; 
    }
}

export async function getPredefinedTags() {
    const predefinedTags = await fetchPredefinedTags();
    return predefinedTags;
}

export default getPredefinedTags;

// export { seed };

