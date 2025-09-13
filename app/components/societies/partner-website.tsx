import { FormattedPartner } from "@/app/lib/types"
import Image from "next/image"
import { Button } from '@/app/components/button';


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
								<Button 
					variant="filled"
					onClick={(e) => handleWebsiteClick(e, partner.website)} 
					className="flex bg-transparent text-white py-2 rounded-lg hover:text-gray-400 w-full items-center"
				>
					<span className="flex items-center justify-center text-white hover:text-gray-400 px-4 py-2 rounded-lg text-sm bg-[#1A4E85] w-full">
						{/* Website */}
						<Image
							src='/icons/web.png'
							alt='website icon'
							width={20}
							height={20}
							className="object-cover"
						/>
					</span>
				</Button>
			)}
		</>
	)
}