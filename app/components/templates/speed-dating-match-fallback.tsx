interface SpeedDatingMatchPayloadProps {
	fromEmail: string;
	toName: string;
	fromName: string;
	toID: string;
	fromID: string;
}

export const SpeedDatingMatchEmailPayloadFallback = ({
	fromEmail,
	toName,
	fromName,
	toID,
	fromID,
}: SpeedDatingMatchPayloadProps) => {
	return `
Hello ${toName},

Well…. Isn't today your lucky day

The stars have aligned, the cosmos happy, and the universe harmonious. You have found your soul mate. 

Here's their name and email. Be sure to drop them a little message and let them know where you are and what you look like - they’re waiting!

Match Details:
Your ID: ${toID} - ${toName}
Match's ID: ${fromID} - ${fromName} - ${fromEmail}

Feel free to reach out and start a conversation. 

Wishing you an awesome time and good luck!

Cheers,
The London Student Network Team
  `.trim();
};
