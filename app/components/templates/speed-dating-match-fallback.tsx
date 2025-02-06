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

Great news - you have a new speed dating match!

${fromName} (ID: ${fromID}) has been paired with you because we think you both have a lot to offer.

Match Details:
Your ID: ${toID} - ${toName}
Match's ID: ${fromID} - ${fromName} - ${fromEmail}

Feel free to reach out and start a conversation. 

Wishing you an awesome time and good luck!

Cheers,
The London Student Network Team
  `.trim();
};
