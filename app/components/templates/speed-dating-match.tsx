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
      <p>Guess what? You have a new speed dating match!</p>
      <p>
        ${fromName} (ID: ${fromID}) thinks you're pretty awesome, and so do we!
      </p>
      <p>
        We've connected you both. Feel free to reach out and start a conversation.
      </p>
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

