interface SpeedDatingMatchPayloadProps {
	fromEmail: string;
	toName: string;
	fromName: string;
	toID: string;
	fromID: string;
}

export const SpeedDatingMatchEmailPayload = ({ fromEmail, toName, fromName, toID, fromID }: SpeedDatingMatchPayloadProps) => {
	return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
		<p>Hello ${toName},</p>
		<p>Well…. Isn't today your lucky day</p>
		<p>
		The stars have aligned, the cosmos happy, and the universe harmonious. You have found your soul mate.
		</p>
		<p>Here's their name and email. Be sure to drop them a little message and let them know where you are and what you look like - they're waiting!</p>

		<p>
			Your match details:
			<br/>
			<strong>Your ID:</strong> ${toID} - ${toName}
			<br/>
			<strong>Match's ID:</strong> ${fromID} - ${fromName} - ${fromEmail}
		</p>
		<p>
			Happy dating, and good luck!
		</p>
		<p>Cheers,</p>
		<p style="margin-left: 20px;">The London Student Network Team</p>
    </div>
  `;
};

