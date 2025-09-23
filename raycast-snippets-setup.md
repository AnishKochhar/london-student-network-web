# Raycast Snippets Setup for Event Form Auto-Fill

## Installation & Setup

1. **Download Raycast** (free): https://www.raycast.com/
2. **Open Raycast**: ⌘ + Space (or customize hotkey)
3. **Create Snippets**: Type "Create Snippet" in Raycast

---

## Recommended Snippets

### Basic Event Info
```
Keyword: eevent
Name: Sample Event Template
Content: Tech Workshop: Introduction to React
Join us for a hands-on workshop where we'll build a complete React application from scratch. Perfect for beginners and intermediate developers looking to enhance their skills.
```

### Date Snippets
```
Keyword: etoday
Name: Today's Date
Content: {date format="YYYY-MM-DD"}

Keyword: etomorrow
Name: Tomorrow's Date
Content: {date format="YYYY-MM-DD" add="1d"}

Keyword: enextweek
Name: Next Week Date
Content: {date format="YYYY-MM-DD" add="7d"}
```

### Time Snippets
```
Keyword: etime1
Name: Common Event Time 1
Content: 14:00

Keyword: etime2
Name: Common Event Time 2
Content: 18:00

Keyword: etime3
Name: Common Event Time 3
Content: 19:30
```

### Location Snippets
```
Keyword: efleming
Name: Fleming Building
Content: Sir Alexander Fleming Building, Room G40

Keyword: eblackett
Name: Blackett Lab
Content: Blackett Laboratory, Lecture Theatre 1

Keyword: eunion
Name: Student Union
Content: Student Union Building
```

### Area Snippets
```
Keyword: esk
Name: South Kensington
Content: South Kensington

Keyword: ecentral
Name: Central London
Content: Central London
```

### Address Snippets
```
Keyword: eexhibition
Name: Exhibition Road Address
Content: Exhibition Road, London SW7 2AZ

Keyword: econsort
Name: Prince Consort Road Address
Content: Prince Consort Road, London SW7 2BB
```

### Description Templates
```
Keyword: edesc1
Name: Academic Event Description
Content: Join us for an engaging {cursor} session designed to enhance your knowledge and skills. This event is perfect for students looking to expand their understanding of {cursor}.

Keyword: edesc2
Name: Social Event Description
Content: Come and meet fellow students in a relaxed and friendly environment. Enjoy refreshments, great conversations, and the opportunity to make new connections across different departments.

Keyword: edesc3
Name: Professional Event Description
Content: Network with industry professionals and gain valuable insights into career opportunities in {cursor}. This event includes panel discussions, Q&A sessions, and networking opportunities.
```

### External Info Templates
```
Keyword: eexternal
Name: External Student Info
Content: Building access: Please arrive at the main reception and ask for directions to the event venue. Visitors must sign in at reception. Contact: reception@imperial.ac.uk for access queries.
```

---

## Usage Instructions

### 1. **Simple Text Expansion**
- Type the keyword (e.g., `efleming`) anywhere
- Raycast automatically expands it to the full text
- Works in any application (browser, notes, etc.)

### 2. **Multi-Field Workflow**
1. Use snippets to fill each field quickly
2. Tab between fields while typing keywords
3. Use Raycast's clipboard history (⌘ + Shift + C) to store multiple values

### 3. **Copy-Paste Workflow**
1. Open `event-autofill-template.md` in a text editor
2. Copy the entire template for your event type
3. Use Raycast clipboard history to paste individual fields

---

## Advanced Raycast Features

### **Clipboard History**
- Access: ⌘ + Shift + C (or configure in Raycast)
- Stores everything you copy
- Pin frequently used content
- Search through history

### **Dynamic Date/Time**
```
{date format="YYYY-MM-DD"} → 2024-10-15
{date format="HH:mm"} → 14:30
{date format="YYYY-MM-DD" add="1d"} → Tomorrow's date
{date format="YYYY-MM-DD" add="1w"} → Next week's date
```

### **Cursor Positioning**
```
Title: {cursor} Workshop
Description: Join us for a {cursor} session about {cursor}.
```
Use `{cursor}` to position your cursor after expansion.

---

## Form Filling Strategy

### **Option 1: Snippet-by-Snippet**
1. Click on Event Title field
2. Type `eevent` → expands to sample title
3. Tab to Description field
4. Type `edesc1` → expands to template description
5. Continue for each field

### **Option 2: Clipboard Stack**
1. Copy multiple snippets to clipboard history:
   - Copy event title
   - Copy description
   - Copy location
   - Copy times
2. Use ⌘ + Shift + C to access clipboard history
3. Paste each item in sequence

### **Option 3: Template Copying**
1. Open `event-autofill-template.md`
2. Copy your chosen template
3. Use clipboard history to access individual fields
4. Manually paste each field

---

## Customization Tips

### **Create Event-Specific Snippets**
```
Keyword: emyevent
Name: My Regular Event
Content: Weekly Study Session
Every Wednesday we host a collaborative study session in the library. Bring your coursework and questions - we'll tackle them together!
```

### **Society-Specific Snippets**
```
Keyword: ecomputer
Name: Computing Society Event
Content: Imperial College Computing Society

Keyword: ebusiness
Name: Business Society Event
Content: Imperial College Business School Society
```

### **Tag Number References**
Create a snippet for tag calculations:
```
Keyword: etags
Name: Event Tag Reference
Content: Academic(1) + Tech(128) = 129
Social(2) + Food(32) = 34
Professional(4) + Tech(128) = 132
```

---

## Next Steps

1. **Install Raycast** and create these snippets
2. **Test on a practice form** to get comfortable
3. **Customize** snippets for your specific needs
4. **Consider AppleScript** (next file) for full automation