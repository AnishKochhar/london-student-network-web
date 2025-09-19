const partners = [
    // it should be noted these are fake societies, merely for testing purposes
    {
        id: 1,
        name: "Summit Scholars Network",
        keywords: ["education", "scholarships", "networking"],
        description:
            "A network connecting high-achieving students with scholarships and educational opportunities.",
        website: "https://summitscholars.com",
    },
    {
        id: 2,
        name: "Aspire Education Group",
        keywords: ["tutoring", "mentoring", "academic success"],
        description:
            "A tutoring and mentoring group that helps students achieve academic excellence.",
        website: "https://aspireeducation.com",
    },
    {
        id: 3,
        name: "Global Learners Alliance",
        keywords: ["global", "learning", "student exchange"],
        description:
            "An alliance supporting international student exchanges and cross-cultural learning.",
        website: "https://globallearners.com",
    },
    {
        id: 4,
        name: "Catalyst University Programs",
        keywords: ["university", "internships", "research"],
        description:
            "A platform offering university-level research opportunities and internships.",
        website: "https://catalystprograms.com",
    },
    {
        id: 5,
        name: "Innovate Learning Hub",
        keywords: ["innovation", "technology", "education"],
        description:
            "A hub for innovative learning methods and technology in education.",
        website: "https://innovatelearninghub.com",
    },
    {
        id: 6,
        name: "Pinnacle Academy Society",
        keywords: ["academics", "leadership", "community"],
        description:
            "An academic society that fosters leadership and community involvement among students.",
        website: "https://pinnacleacademy.com",
    },
    {
        id: 7,
        name: "Quantum Knowledge Foundation",
        keywords: ["science", "research", "quantum physics"],
        description:
            "A foundation dedicated to advancing knowledge in quantum science and technology.",
        website: "https://quantumfoundation.org",
    },
    {
        id: 8,
        name: "Nexus College Events",
        keywords: ["college", "events", "student life"],
        description:
            "Organizing student events and social activities at colleges across the country.",
        website: "https://nexuscollegeevents.com",
    },
    {
        id: 9,
        name: "Horizon Learning Network",
        keywords: ["learning", "network", "online courses"],
        description:
            "An online network providing access to learning materials and courses.",
        website: "https://horizonlearning.com",
    },
    {
        id: 10,
        name: "The Vanguard Society",
        keywords: ["society", "leadership", "academic excellence"],
        description:
            "A society focused on cultivating leadership and excellence among students.",
        website: "https://vanguardsociety.com",
    },
    {
        id: 11,
        name: "Elevate Education Group",
        keywords: ["education", "tutoring", "student success"],
        description:
            "A group focused on elevating educational outcomes through personalized tutoring.",
        website: "https://elevateeducation.com",
    },
    {
        id: 12,
        name: "Mosaic Scholars Association",
        keywords: ["diversity", "scholarships", "community"],
        description:
            "An association that celebrates diversity while providing scholarships for underrepresented students.",
        website: "https://mosaicscholars.org",
    },
    {
        id: 13,
        name: "Zenith University Connect",
        keywords: ["university", "networking", "events"],
        description:
            "Connecting students from top universities for networking and career development.",
        website: "https://zenithuniversity.com",
    },
    {
        id: 14,
        name: "Beacon Educational Initiatives",
        keywords: ["education", "initiatives", "mentorship"],
        description:
            "An initiative to provide mentorship and support to students pursuing higher education.",
        website: "https://beaconinitiatives.com",
    },
    {
        id: 15,
        name: "Keystone Academic Programs",
        keywords: ["academics", "research", "internships"],
        description:
            "Providing academic programs, research opportunities, and internships to students worldwide.",
        website: "https://keystoneprograms.com",
    },
    {
        id: 16,
        name: "Polaris University Partners",
        keywords: ["university", "partnerships", "global"],
        description:
            "Partnering with universities around the world to create global academic programs.",
        website: "https://polarisuniversity.com",
    },
    {
        id: 17,
        name: "Pathway Learning Alliance",
        keywords: ["learning", "alliance", "student development"],
        description:
            "An alliance aimed at improving student development through collaborative learning experiences.",
        website: "https://pathwayalliance.com",
    },
    {
        id: 18,
        name: "Meridian Scholars Platform",
        keywords: ["scholars", "education", "platform"],
        description:
            "A platform offering resources and support for top scholars to further their academic careers.",
        website: "https://meridianscholars.com",
    },
    {
        id: 19,
        name: "Apex Academy Outreach",
        keywords: ["outreach", "education", "scholarships"],
        description:
            "An outreach initiative offering scholarships and support for students pursuing higher education.",
        website: "https://apexacademy.com",
    },
    {
        id: 20,
        name: "Illuminate Learning Network",
        keywords: ["learning", "network", "online resources"],
        description:
            "An online learning network offering courses, materials, and resources for students.",
        website: "https://illuminatelearning.com",
    },
    {
        id: 21,
        name: "Foundation of Bright Minds",
        keywords: ["education", "mentorship", "scholarships"],
        description:
            "A foundation providing mentorship and scholarships to students with bright futures.",
        website: "https://brightmindsfoundation.com",
    },
    {
        id: 22,
        name: "The Phoenix Knowledge Hub",
        keywords: ["knowledge", "education", "community"],
        description:
            "A hub offering educational resources and fostering community learning experiences.",
        website: "https://phoenixknowledgehub.com",
    },
    {
        id: 23,
        name: "Momentum Scholars Forum",
        keywords: ["scholars", "forum", "networking"],
        description:
            "A forum for scholars to collaborate, network, and discuss academic topics.",
        website: "https://momentumscholarsforum.com",
    },
    {
        id: 24,
        name: "Pioneer Education Society",
        keywords: ["education", "innovation", "community"],
        description:
            "An education society dedicated to innovative teaching and community engagement.",
        website: "https://pioneereducationsociety.com",
    },
    {
        id: 25,
        name: "Skyline Academy Partners",
        keywords: ["academy", "partners", "growth"],
        description:
            "Partners with top academic institutions to offer growth opportunities for students.",
        website: "https://skylineacademy.com",
    },
    {
        id: 26,
        name: "Bridgeway Learning Solutions",
        keywords: ["learning", "solutions", "tutoring"],
        description:
            "Providing innovative learning solutions and tutoring services for students.",
        website: "https://bridgewaylearningsolutions.com",
    },
    {
        id: 27,
        name: "Northstar Scholars Initiative",
        keywords: ["scholars", "initiative", "education"],
        description:
            "An initiative aimed at helping scholars achieve their academic and career goals.",
        website: "https://northstarscholars.com",
    },
    {
        id: 28,
        name: "Everest College Society",
        keywords: ["college", "community", "student life"],
        description:
            "A college society offering events, networking, and support for students.",
        website: "https://everestcollegesociety.com",
    },
    {
        id: 29,
        name: "Atlas Learning Connect",
        keywords: ["learning", "global", "resources"],
        description:
            "A global learning platform connecting students with valuable educational resources.",
        website: "https://atlaslearningconnect.com",
    },
    {
        id: 30,
        name: "Luminary Education Network",
        keywords: ["education", "network", "leadership"],
        description:
            "A network of educational institutions supporting student leadership development.",
        website: "https://luminaryeducationnetwork.com",
    },
    {
        id: 31,
        name: "Summit Scholars Network",
        keywords: ["education", "scholarships", "networking"],
        description:
            "A network connecting high-achieving students with scholarships and educational opportunities.",
        website: "https://summitscholars.com",
    },
    {
        id: 32,
        name: "Aspire Education Group",
        keywords: ["tutoring", "mentoring", "academic success"],
        description:
            "A tutoring and mentoring group that helps students achieve academic excellence.",
        website: "https://aspireeducation.com",
    },
    {
        id: 33,
        name: "Global Learners Alliance",
        keywords: ["global", "learning", "student exchange"],
        description:
            "An alliance supporting international student exchanges and cross-cultural learning.",
        website: "https://globallearners.com",
    },
    {
        id: 34,
        name: "Catalyst University Programs",
        keywords: ["university", "internships", "research"],
        description:
            "A platform offering university-level research opportunities and internships.",
        website: "https://catalystprograms.com",
    },
    {
        id: 35,
        name: "Innovate Learning Hub",
        keywords: ["innovation", "technology", "education"],
        description:
            "A hub for innovative learning methods and technology in education.",
        website: "https://innovatelearninghub.com",
    },
    {
        id: 36,
        name: "Pinnacle Academy Society",
        keywords: ["academics", "leadership", "community"],
        description:
            "An academic society that fosters leadership and community involvement among students.",
        website: "https://pinnacleacademy.com",
    },
    {
        id: 37,
        name: "Quantum Knowledge Foundation",
        keywords: ["science", "research", "quantum physics"],
        description:
            "A foundation dedicated to advancing knowledge in quantum science and technology.",
        website: "https://quantumfoundation.org",
    },
    {
        id: 38,
        name: "Nexus College Events",
        keywords: ["college", "events", "student life"],
        description:
            "Organizing student events and social activities at colleges across the country.",
        website: "https://nexuscollegeevents.com",
    },
    {
        id: 39,
        name: "Horizon Learning Network",
        keywords: ["learning", "network", "online courses"],
        description:
            "An online network providing access to learning materials and courses.",
        website: "https://horizonlearning.com",
    },
    {
        id: 40,
        name: "The Vanguard Society",
        keywords: ["society", "leadership", "academic excellence"],
        description:
            "A society focused on cultivating leadership and excellence among students.",
        website: "https://vanguardsociety.com",
    },
    {
        id: 41,
        name: "Summit Scholars Network",
        keywords: ["education", "scholarships", "networking"],
        description:
            "A network connecting high-achieving students with scholarships and educational opportunities.",
        website: "https://summitscholars.com",
    },
    {
        id: 42,
        name: "Aspire Education Group",
        keywords: ["tutoring", "mentoring", "academic success"],
        description:
            "A tutoring and mentoring group that helps students achieve academic excellence.",
        website: "https://aspireeducation.com",
    },
    {
        id: 43,
        name: "Global Learners Alliance",
        keywords: ["global", "learning", "student exchange"],
        description:
            "An alliance supporting international student exchanges and cross-cultural learning.",
        website: "https://globallearners.com",
    },
    {
        id: 44,
        name: "Catalyst University Programs",
        keywords: ["university", "internships", "research"],
        description:
            "A platform offering university-level research opportunities and internships.",
        website: "https://catalystprograms.com",
    },
    {
        id: 45,
        name: "Innovate Learning Hub",
        keywords: ["innovation", "technology", "education"],
        description:
            "A hub for innovative learning methods and technology in education.",
        website: "https://innovatelearninghub.com",
    },
    {
        id: 46,
        name: "Pinnacle Academy Society",
        keywords: ["academics", "leadership", "community"],
        description:
            "An academic society that fosters leadership and community involvement among students.",
        website: "https://pinnacleacademy.com",
    },
    {
        id: 47,
        name: "Quantum Knowledge Foundation",
        keywords: ["science", "research", "quantum physics"],
        description:
            "A foundation dedicated to advancing knowledge in quantum science and technology.",
        website: "https://quantumfoundation.org",
    },
    {
        id: 48,
        name: "Nexus College Events",
        keywords: ["college", "events", "student life"],
        description:
            "Organizing student events and social activities at colleges across the country.",
        website: "https://nexuscollegeevents.com",
    },
    {
        id: 49,
        name: "Horizon Learning Network",
        keywords: ["learning", "network", "online courses"],
        description:
            "An online network providing access to learning materials and courses.",
        website: "https://horizonlearning.com",
    },
    {
        id: 50,
        name: "The Vanguard Society",
        keywords: ["society", "leadership", "academic excellence"],
        description:
            "A society focused on cultivating leadership and excellence among students.",
        website: "https://vanguardsociety.com",
    },
    {
        id: 51,
        name: "Elevate Education Group",
        keywords: ["education", "tutoring", "student success"],
        description:
            "A group focused on elevating educational outcomes through personalized tutoring.",
        website: "https://elevateeducation.com",
    },
    {
        id: 52,
        name: "Mosaic Scholars Association",
        keywords: ["diversity", "scholarships", "community"],
        description:
            "An association that celebrates diversity while providing scholarships for underrepresented students.",
        website: "https://mosaicscholars.org",
    },
    {
        id: 53,
        name: "Zenith University Connect",
        keywords: ["university", "networking", "events"],
        description:
            "Connecting students from top universities for networking and career development.",
        website: "https://zenithuniversity.com",
    },
    {
        id: 54,
        name: "Beacon Educational Initiatives",
        keywords: ["education", "initiatives", "mentorship"],
        description:
            "An initiative to provide mentorship and support to students pursuing higher education.",
        website: "https://beaconinitiatives.com",
    },
    {
        id: 55,
        name: "Keystone Academic Programs",
        keywords: ["academics", "research", "internships"],
        description:
            "Providing academic programs, research opportunities, and internships to students worldwide.",
        website: "https://keystoneprograms.com",
    },
    {
        id: 56,
        name: "Polaris University Partners",
        keywords: ["university", "partnerships", "global"],
        description:
            "Partnering with universities around the world to create global academic programs.",
        website: "https://polarisuniversity.com",
    },
    {
        id: 57,
        name: "Pathway Learning Alliance",
        keywords: ["learning", "alliance", "student development"],
        description:
            "An alliance aimed at improving student development through collaborative learning experiences.",
        website: "https://pathwayalliance.com",
    },
    {
        id: 58,
        name: "Meridian Scholars Platform",
        keywords: ["scholars", "education", "platform"],
        description:
            "A platform offering resources and support for top scholars to further their academic careers.",
        website: "https://meridianscholars.com",
    },
    {
        id: 59,
        name: "Apex Academy Outreach",
        keywords: ["outreach", "education", "scholarships"],
        description:
            "An outreach initiative offering scholarships and support for students pursuing higher education.",
        website: "https://apexacademy.com",
    },
    {
        id: 60,
        name: "Illuminate Learning Network",
        keywords: ["learning", "network", "online resources"],
        description:
            "An online learning network offering courses, materials, and resources for students.",
        website: "https://illuminatelearning.com",
    },
    {
        id: 61,
        name: "Foundation of Bright Minds",
        keywords: ["education", "mentorship", "scholarships"],
        description:
            "A foundation providing mentorship and scholarships to students with bright futures.",
        website: "https://brightmindsfoundation.com",
    },
    {
        id: 62,
        name: "The Phoenix Knowledge Hub",
        keywords: ["knowledge", "education", "community"],
        description:
            "A hub offering educational resources and fostering community learning experiences.",
        website: "https://phoenixknowledgehub.com",
    },
    {
        id: 63,
        name: "Momentum Scholars Forum",
        keywords: ["scholars", "forum", "networking"],
        description:
            "A forum for scholars to collaborate, network, and discuss academic topics.",
        website: "https://momentumscholarsforum.com",
    },
    {
        id: 64,
        name: "Pioneer Education Society",
        keywords: ["education", "innovation", "community"],
        description:
            "An education society dedicated to innovative teaching and community engagement.",
        website: "https://pioneereducationsociety.com",
    },
    {
        id: 65,
        name: "Skyline Academy Partners",
        keywords: ["academy", "partners", "growth"],
        description:
            "Partners with top academic institutions to offer growth opportunities for students.",
        website: "https://skylineacademy.com",
    },
    {
        id: 66,
        name: "Bridgeway Learning Solutions",
        keywords: ["learning", "solutions", "tutoring"],
        description:
            "Providing innovative learning solutions and tutoring services for students.",
        website: "https://bridgewaylearningsolutions.com",
    },
    {
        id: 67,
        name: "Northstar Scholars Initiative",
        keywords: ["scholars", "initiative", "education"],
        description:
            "An initiative aimed at helping scholars achieve their academic and career goals.",
        website: "https://northstarscholars.com",
    },
    {
        id: 68,
        name: "Everest College Society",
        keywords: ["college", "community", "student life"],
        description:
            "A college society offering events, networking, and support for students.",
        website: "https://everestcollegesociety.com",
    },
    {
        id: 69,
        name: "Atlas Learning Connect",
        keywords: ["learning", "global", "resources"],
        description:
            "A global learning platform connecting students with valuable educational resources.",
        website: "https://atlaslearningconnect.com",
    },
    {
        id: 70,
        name: "Luminary Education Network",
        keywords: ["education", "network", "leadership"],
        description:
            "A network of educational institutions supporting student leadership development.",
        website: "https://luminaryeducationnetwork.com",
    },
    {
        id: 71,
        name: "Summit Scholars Network",
        keywords: ["education", "scholarships", "networking"],
        description:
            "A network connecting high-achieving students with scholarships and educational opportunities.",
        website: "https://summitscholars.com",
    },
    {
        id: 72,
        name: "Aspire Education Group",
        keywords: ["tutoring", "mentoring", "academic success"],
        description:
            "A tutoring and mentoring group that helps students achieve academic excellence.",
        website: "https://aspireeducation.com",
    },
    {
        id: 73,
        name: "Global Learners Alliance",
        keywords: ["global", "learning", "student exchange"],
        description:
            "An alliance supporting international student exchanges and cross-cultural learning.",
        website: "https://globallearners.com",
    },
    {
        id: 74,
        name: "Catalyst University Programs",
        keywords: ["university", "internships", "research"],
        description:
            "A platform offering university-level research opportunities and internships.",
        website: "https://catalystprograms.com",
    },
    {
        id: 75,
        name: "Innovate Learning Hub",
        keywords: ["innovation", "technology", "education"],
        description:
            "A hub for innovative learning methods and technology in education.",
        website: "https://innovatelearninghub.com",
    },
    {
        id: 76,
        name: "Pinnacle Academy Society",
        keywords: ["academics", "leadership", "community"],
        description:
            "An academic society that fosters leadership and community involvement among students.",
        website: "https://pinnacleacademy.com",
    },
    {
        id: 77,
        name: "Quantum Knowledge Foundation",
        keywords: ["science", "research", "quantum physics"],
        description:
            "A foundation dedicated to advancing knowledge in quantum science and technology.",
        website: "https://quantumfoundation.org",
    },
    {
        id: 78,
        name: "Nexus College Events",
        keywords: ["college", "events", "student life"],
        description:
            "Organizing student events and social activities at colleges across the country.",
        website: "https://nexuscollegeevents.com",
    },
    {
        id: 79,
        name: "Horizon Learning Network",
        keywords: ["learning", "network", "online courses"],
        description:
            "An online network providing access to learning materials and courses.",
        website: "https://horizonlearning.com",
    },
    {
        id: 80,
        name: "The Vanguard Society",
        keywords: ["society", "leadership", "academic excellence"],
        description:
            "A society focused on cultivating leadership and excellence among students.",
        website: "https://vanguardsociety.com",
    },
    {
        id: 81,
        name: "Elevate Education Group",
        keywords: ["education", "tutoring", "student success"],
        description:
            "A group focused on elevating educational outcomes through personalized tutoring.",
        website: "https://elevateeducation.com",
    },
    {
        id: 82,
        name: "Mosaic Scholars Association",
        keywords: ["diversity", "scholarships", "community"],
        description:
            "An association that celebrates diversity while providing scholarships for underrepresented students.",
        website: "https://mosaicscholars.org",
    },
    {
        id: 83,
        name: "Zenith University Connect",
        keywords: ["university", "networking", "events"],
        description:
            "Connecting students from top universities for networking and career development.",
        website: "https://zenithuniversity.com",
    },
    {
        id: 84,
        name: "Beacon Educational Initiatives",
        keywords: ["education", "initiatives", "mentorship"],
        description:
            "An initiative to provide mentorship and support to students pursuing higher education.",
        website: "https://beaconinitiatives.com",
    },
    {
        id: 85,
        name: "Keystone Academic Programs",
        keywords: ["academics", "research", "internships"],
        description:
            "Providing academic programs, research opportunities, and internships to students worldwide.",
        website: "https://keystoneprograms.com",
    },
    {
        id: 86,
        name: "Polaris University Partners",
        keywords: ["university", "partnerships", "global"],
        description:
            "Partnering with universities around the world to create global academic programs.",
        website: "https://polarisuniversity.com",
    },
    {
        id: 87,
        name: "Pathway Learning Alliance",
        keywords: ["learning", "alliance", "student development"],
        description:
            "An alliance aimed at improving student development through collaborative learning experiences.",
        website: "https://pathwayalliance.com",
    },
    {
        id: 88,
        name: "Meridian Scholars Platform",
        keywords: ["scholars", "education", "platform"],
        description:
            "A platform offering resources and support for top scholars to further their academic careers.",
        website: "https://meridianscholars.com",
    },
    {
        id: 89,
        name: "Apex Academy Outreach",
        keywords: ["outreach", "education", "scholarships"],
        description:
            "An outreach initiative offering scholarships and support for students pursuing higher education.",
        website: "https://apexacademy.com",
    },
    {
        id: 90,
        name: "Illuminate Learning Network",
        keywords: ["learning", "network", "online resources"],
        description:
            "An online learning network offering courses, materials, and resources for students.",
        website: "https://illuminatelearning.com",
    },
    {
        id: 91,
        name: "Foundation of Bright Minds",
        keywords: ["education", "mentorship", "scholarships"],
        description:
            "A foundation providing mentorship and scholarships to students with bright futures.",
        website: "https://brightmindsfoundation.com",
    },
    {
        id: 92,
        name: "The Phoenix Knowledge Hub",
        keywords: ["knowledge", "education", "community"],
        description:
            "A hub offering educational resources and fostering community learning experiences.",
        website: "https://phoenixknowledgehub.com",
    },
    {
        id: 93,
        name: "Momentum Scholars Forum",
        keywords: ["scholars", "forum", "networking"],
        description:
            "A forum for scholars to collaborate, network, and discuss academic topics.",
        website: "https://momentumscholarsforum.com",
    },
    {
        id: 94,
        name: "Pioneer Education Society",
        keywords: ["education", "innovation", "community"],
        description:
            "An education society dedicated to innovative teaching and community engagement.",
        website: "https://pioneereducationsociety.com",
    },
    {
        id: 95,
        name: "Skyline Academy Partners",
        keywords: ["academy", "partners", "growth"],
        description:
            "Partners with top academic institutions to offer growth opportunities for students.",
        website: "https://skylineacademy.com",
    },
    {
        id: 96,
        name: "Bridgeway Learning Solutions",
        keywords: ["learning", "solutions", "tutoring"],
        description:
            "Providing innovative learning solutions and tutoring services for students.",
        website: "https://bridgewaylearningsolutions.com",
    },
    {
        id: 97,
        name: "Northstar Scholars Initiative",
        keywords: ["scholars", "initiative", "education"],
        description:
            "An initiative aimed at helping scholars achieve their academic and career goals.",
        website: "https://northstarscholars.com",
    },
    {
        id: 98,
        name: "Everest College Society",
        keywords: ["college", "community", "student life"],
        description:
            "A college society offering events, networking, and support for students.",
        website: "https://everestcollegesociety.com",
    },
    {
        id: 99,
        name: "Atlas Learning Connect",
        keywords: ["learning", "global", "resources"],
        description:
            "A global learning platform connecting students with valuable educational resources.",
        website: "https://atlaslearningconnect.com",
    },
    {
        id: 100,
        name: "Luminary Education Network",
        keywords: ["education", "network", "leadership"],
        description:
            "A network of educational institutions supporting student leadership development.",
        website: "https://luminaryeducationnetwork.com",
    },
    {
        id: 101,
        name: "Summit Scholars Network",
        keywords: ["education", "scholarships", "networking"],
        description:
            "A network connecting high-achieving students with scholarships and educational opportunities.",
        website: "https://summitscholars.com",
    },
    {
        id: 102,
        name: "Aspire Education Group",
        keywords: ["tutoring", "mentoring", "academic success"],
        description:
            "A tutoring and mentoring group that helps students achieve academic excellence.",
        website: "https://aspireeducation.com",
    },
    {
        id: 103,
        name: "Global Learners Alliance",
        keywords: ["global", "learning", "student exchange"],
        description:
            "An alliance supporting international student exchanges and cross-cultural learning.",
        website: "https://globallearners.com",
    },
    {
        id: 104,
        name: "Catalyst University Programs",
        keywords: ["university", "internships", "research"],
        description:
            "A platform offering university-level research opportunities and internships.",
        website: "https://catalystprograms.com",
    },
    {
        id: 105,
        name: "Innovate Learning Hub",
        keywords: ["innovation", "technology", "education"],
        description:
            "A hub for innovative learning methods and technology in education.",
        website: "https://innovatelearninghub.com",
    },
    {
        id: 106,
        name: "Pinnacle Academy Society",
        keywords: ["academics", "leadership", "community"],
        description:
            "An academic society that fosters leadership and community involvement among students.",
        website: "https://pinnacleacademy.com",
    },
    {
        id: 107,
        name: "Quantum Knowledge Foundation",
        keywords: ["science", "research", "quantum physics"],
        description:
            "A foundation dedicated to advancing knowledge in quantum science and technology.",
        website: "https://quantumfoundation.org",
    },
    {
        id: 108,
        name: "Nexus College Events",
        keywords: ["college", "events", "student life"],
        description:
            "Organizing student events and social activities at colleges across the country.",
        website: "https://nexuscollegeevents.com",
    },
    {
        id: 109,
        name: "Horizon Learning Network",
        keywords: ["learning", "network", "online courses"],
        description:
            "An online network providing access to learning materials and courses.",
        website: "https://horizonlearning.com",
    },
    {
        id: 110,
        name: "The Vanguard Society",
        keywords: ["society", "leadership", "academic excellence"],
        description:
            "A society focused on cultivating leadership and excellence among students.",
        website: "https://vanguardsociety.com",
    },
    {
        id: 111,
        name: "Elevate Education Group",
        keywords: ["education", "tutoring", "student success"],
        description:
            "A group focused on elevating educational outcomes through personalized tutoring.",
        website: "https://elevateeducation.com",
    },
    {
        id: 112,
        name: "Mosaic Scholars Association",
        keywords: ["diversity", "scholarships", "community"],
        description:
            "An association that celebrates diversity while providing scholarships for underrepresented students.",
        website: "https://mosaicscholars.org",
    },
    {
        id: 113,
        name: "Zenith University Connect",
        keywords: ["university", "networking", "events"],
        description:
            "Connecting students from top universities for networking and career development.",
        website: "https://zenithuniversity.com",
    },
    {
        id: 114,
        name: "Beacon Educational Initiatives",
        keywords: ["education", "initiatives", "mentorship"],
        description:
            "An initiative to provide mentorship and support to students pursuing higher education.",
        website: "https://beaconinitiatives.com",
    },
    {
        id: 115,
        name: "Keystone Academic Programs",
        keywords: ["academics", "research", "internships"],
        description:
            "Providing academic programs, research opportunities, and internships to students worldwide.",
        website: "https://keystoneprograms.com",
    },
    {
        id: 116,
        name: "Polaris University Partners",
        keywords: ["university", "partnerships", "global"],
        description:
            "Partnering with universities around the world to create global academic programs.",
        website: "https://polarisuniversity.com",
    },
    {
        id: 117,
        name: "Pathway Learning Alliance",
        keywords: ["learning", "alliance", "student development"],
        description:
            "An alliance aimed at improving student development through collaborative learning experiences.",
        website: "https://pathwayalliance.com",
    },
    {
        id: 118,
        name: "Meridian Scholars Platform",
        keywords: ["scholars", "education", "platform"],
        description:
            "A platform offering resources and support for top scholars to further their academic careers.",
        website: "https://meridianscholars.com",
    },
    {
        id: 119,
        name: "Apex Academy Outreach",
        keywords: ["outreach", "education", "scholarships"],
        description:
            "An outreach initiative offering scholarships and support for students pursuing higher education.",
        website: "https://apexacademy.com",
    },
    {
        id: 120,
        name: "Illuminate Learning Network",
        keywords: ["learning", "network", "online resources"],
        description:
            "An online learning network offering courses, materials, and resources for students.",
        website: "https://illuminatelearning.com",
    },
];

const extremeCases = [
    {
        id: partners.length + 1,
        name: "Very Long Name Very Long Name Very Long Name Very Long Name Very Long Name Very Long Name",
        keywords: ["education", "scholarships", "networking"],
        description:
            "A network connecting high-achieving students with scholarships and educational opportunities.",
        website: "https://summitscholars.com",
    },
    {
        id: partners.length + 2,
        name: "Many Keywords",
        keywords: [
            "keyword 1",
            "keyword 2",
            "keyword 3",
            "keyword 4",
            "keyword 5",
            "keyword 6",
            "keyword 7",
            "keyword 8",
        ],
        description:
            "A network connecting high-achieving students with scholarships and educational opportunities.",
        website: "https://summitscholars.com",
    },
    {
        id: partners.length + 3,
        name: "Very Long Description",
        keywords: ["education", "scholarships", "networking"],
        description:
            "Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description Very Long Description ",
        website: "https://summitscholars.com",
    },
];

const partner = [...extremeCases, ...partners].map((item) => ({
    ...item,
    logo: "https://via.placeholder.com/150", // Adding placeholder logo
}));

export default partner;
