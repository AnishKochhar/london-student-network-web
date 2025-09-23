# Event Auto-Fill Data Template

## Required Fields (*) and Optional Fields

### Basic Information
- **Event Title*** (title): [Your event name]
- **Description*** (description): [Detailed event description]
- **Organiser*** (organiser): [Select from dropdown - your name/society]
- **Capacity** (capacity): [Number or leave empty for unlimited]

### Date & Time
- **Start Date*** (start_datetime): [YYYY-MM-DD format]
- **End Date*** (end_datetime): [YYYY-MM-DD format]
- **Start Time*** (start_time): [HH:MM format, 24-hour]
- **End Time*** (end_time): [HH:MM format, 24-hour]

### Location
- **Building/Venue*** (location_building): [e.g. Sir Alexander Fleming Building, Room G40]
- **Area*** (location_area): [e.g. South Kensington, Central London]
- **Full Address*** (location_address): [e.g. Exhibition Road, London SW7 2AZ]

### Tags*** (must select at least 1, max 4)
Available options:
- Academic (1): Educational workshops, study sessions
- Social (2): Parties, mixers, casual meetups
- Professional (4): Career events, networking
- Cultural (8): Arts, performances, cultural celebrations
- Sports (16): Athletic events, fitness activities
- Food (32): Dining events, food festivals
- Music (64): Concerts, music events
- Tech (128): Technology workshops, hackathons
- Gaming (256): Video games, board games
- Charity (512): Fundraising, volunteer events
- Religious (1024): Faith-based gatherings
- Political (2048): Political discussions, debates
- Health (4096): Wellness, mental health events
- Creative (8192): Art workshops, creative sessions
- Outdoor (16384): Nature activities, outdoor sports
- Travel (32768): Trip planning, travel experiences

### Additional Details (Optional)
- **Sign-up Link** (sign_up_link): [https://example.com/signup]
- **External Forward Email** (external_forward_email): [reception@building.ac.uk]
- **Information for External Students** (for_externals): [Building access instructions]
- **Email Notifications** (send_signup_notifications): [Checkbox - true/false]

### Event Image
- **Image URL** (image_url): [Select from dropdown or upload custom]
- **Image Contain** (image_contain): [Checkbox - fit vs crop]

---

## Sample Event Data Templates

### Template 1: Academic Workshop
```
Title: Introduction to Machine Learning
Description: Join us for a beginner-friendly workshop covering the fundamentals of machine learning. We'll explore supervised and unsupervised learning techniques with hands-on Python examples.
Organiser: [Your Name/Society]
Capacity: 30
Start Date: 2024-10-15
End Date: 2024-10-15
Start Time: 14:00
End Time: 16:00
Building: Sir Alexander Fleming Building, Room G40
Area: South Kensington
Address: Exhibition Road, London SW7 2AZ
Tags: Academic (1) + Tech (128) = 129
```

### Template 2: Social Event
```
Title: Welcome Back Mixer
Description: Kick off the new term with fellow students! Join us for drinks, snacks, and great conversations. Perfect opportunity to meet new people and reconnect with friends.
Organiser: [Your Name/Society]
Capacity: 50
Start Date: 2024-10-20
End Date: 2024-10-20
Start Time: 19:00
End Time: 22:00
Building: Student Union Bar
Area: Central London
Address: Beit Quad, Prince Consort Road, London SW7 2BB
Tags: Social (2) + Food (32) = 34
```

### Template 3: Professional Networking
```
Title: Tech Industry Careers Panel
Description: Meet professionals from leading tech companies including Google, Meta, and startups. Learn about career paths, interview tips, and industry insights.
Organiser: [Your Name/Society]
Capacity: 100
Start Date: 2024-11-05
End Date: 2024-11-05
Start Time: 18:30
End Time: 20:30
Building: Blackett Laboratory, Lecture Theatre 1
Area: South Kensington
Address: Exhibition Road, London SW7 2AZ
Tags: Professional (4) + Tech (128) = 132
```

---

## Quick Copy-Paste Snippets

### Common Building Names
- Sir Alexander Fleming Building
- Blackett Laboratory
- Huxley Building
- Imperial College Business School
- Student Union Building
- Royal School of Mines

### Common Areas
- South Kensington
- Central London
- Imperial College Campus

### Common Addresses
- Exhibition Road, London SW7 2AZ
- Prince Consort Road, London SW7 2BB
- Kensington Gore, London SW7 2AZ

### Time Formats (24-hour)
- 09:00, 10:00, 11:00, 12:00
- 13:00, 14:00, 15:00, 16:00
- 17:00, 18:00, 19:00, 20:00
- 21:00, 22:00, 23:00

### Date Format
- Today + 1: Use tomorrow's date
- Format: YYYY-MM-DD (e.g., 2024-10-15)