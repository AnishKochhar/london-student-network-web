const OrganiserEventReminderEmail = (organiserEmail: string, eventTitle: string, eventStartTime: string, eventStartDate: string ) => {
    const [day, month, year] = eventStartDate.split('/').map(Number);

    const start_time = eventStartTime.split(' - ')[0];
    const [hour, minute] = start_time.split(':').map(Number);

    const eventDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const msDiff = eventDate.getTime() - now.getTime();
    const hoursLeft = Math.round(msDiff / (1000 * 60 * 60)); // Round to nearest hour
	return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hey ${organiserEmail},</p>
            <p>Just a heads up!</p>
            <p>Your event, ${eventTitle}, starts in about ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}</p>
            <p>
                If there is any information you need, try logging in to your account at londonstudentnetwork.com. 
                If you still have any questions, feel free to contact the team at hello@londonstudentnetwork.com.
            </p>
            <p>Thanks again for hosting an awesome event! If you need any help managing your registrations, just let us know.</p>
            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN Team</p>
        </div>
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hey ${organiserEmail},</p>
            <p>Just a quick reminder — your event <strong>${eventTitle}</strong> is starting in approximately <strong>${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}</strong>.</p>
            <p>
                If you need to review any details or manage sign-ups, you can log in to your organiser dashboard at 
                <a href="https://londonstudentnetwork.com/account" style="color: #1a73e8;">londonstudentnetwork.com</a>.
            </p>
            <p>
                If you have any questions or run into issues, don&#39t hesitate to reach out to us at 
                <a href="mailto:hello@londonstudentnetwork.com" style="color: #1a73e8;">hello@londonstudentnetwork.com</a>.
            </p>
            <p>Thanks again for running what&#39s sure to be a great event!</p>
            <p>All the best,</p>
            <p style="margin-left: 20px;">The LSN Team</p>
        </div>
    `;
};

export default OrganiserEventReminderEmail;
