import { FormattedPartner } from "@/app/lib/types"; ''
import Image from "next/image"

export default function PartnerMessage(
	{
		handleMessageClick,
		partner
	}
		:
		{
			handleMessageClick: (e: React.MouseEvent<HTMLButtonElement>, id: number) => void,
			partner: FormattedPartner
		}
) {
	return (
		<>
			<button onClick={(e) => handleMessageClick(e, partner.id)} className="bg-transparent text-white py-2 rounded-lg hover:text-gray-400 transition text-sm mr-0 w-max">
				<span className="text-white hover:text-gray-400 px-4 py-2 rounded-lg transition text-sm flex flex-row bg-[#1A4E85]">
					{/* Message */}
					<Image
						src='/icons/send-message-icon.png'
						alt='website icon'
						width={20}
						height={20}
						className=" object-cover"
					/>
				</span>
			</button>
		</>
	)
}