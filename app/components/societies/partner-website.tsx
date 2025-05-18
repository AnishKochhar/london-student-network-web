import { FormattedPartner } from "@/app/lib/types"
import Image from "next/image"

export default function PartnerWebsite(
	{
		handleWebsiteClick,
		partner
	}
		:
		{
			handleWebsiteClick: (e: React.MouseEvent<HTMLButtonElement>, website: string) => void,
			partner: FormattedPartner,
		}
) {
	return (
		<>
			{partner.website && partner.website !== 'No website available' && (
				<button onClick={(e) => handleWebsiteClick(e, partner.website)} className="bg-transparent text-white py-2 rounded-lg hover:text-gray-400 transition text-sm mr-0 w-max">
					<span className="text-white hover:text-gray-400 px-4 py-2 rounded-lg transition text-sm flex flex-row bg-[#1A4E85]">
						{/* Website */}
						<Image
							src='/icons/web.png'
							alt='website icon'
							width={20}
							height={20}
							className=" object-cover"
						/>
					</span>
				</button>
			)}
		</>
	)
}