const OrganiserEventReminderEmailFallback = (
    organiserEmail: string,
    eventTitle: string,
    eventStartTime: string,
    eventStartDate: string
): string => {

    const [day, month, year] = eventStartDate.split('/').map(Number);
    
    const start_time = eventStartTime.split(' - ')[0];
    const [hour, minute] = start_time.split(':').map(Number);

    const eventDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const msDiff = eventDate.getTime() - now.getTime();
    const hoursLeft = Math.round(msDiff / (1000 * 60 * 60));

    return `

    Hey ${organiserEmail},

    Just a quick reminder — your event "${eventTitle}" is starting in about ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.

    If you need to check the details or manage sign-ups, head over to your organiser dashboard at:
    https://londonstudentnetwork.com/account

    If you have any questions or run into issues, don&#39t hesitate to reach out to us at hello@londonstudentnetwork.com

    Thanks again for hosting what&#39s sure to be a great event.

    All the best,  
        The LSN Team
    `.trim();
};

export default OrganiserEventReminderEmailFallback;