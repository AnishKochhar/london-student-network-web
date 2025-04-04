"use client"

import { FormattedPartner } from "@/app/lib/types"
import Image from "next/image"
import Link from "next/link"
import { formattedWebsite } from "@/app/lib/utils";
import PartnerTags from "./partner-tags";
import PartnerWebsite from "./partner-website";
import PartnerMessage from "./partner-message";

export default function PartnerCard({ partner }: { partner: FormattedPartner }) {
	const handleMessageClick = (e: React.MouseEvent<HTMLButtonElement>, id: number) => { // turns message button into link
		e.preventDefault();
		e.stopPropagation();
		const url = `/societies/message/${id.toString()}`;

		const newTab = window.open(url, '_blank'); // open in new tab

		if (newTab) {
			newTab.focus(); // focus on new tab
		}
	};

	const handleWebsiteClick = (e: React.MouseEvent<HTMLButtonElement>, website: string) => { // turns website button into link
		e.preventDefault();
		e.stopPropagation();
		window.open(formattedWebsite(website), '_blank'); // open in new tab
	};

	return (
		<>
			<Link
				className="flex flex-col p-4 rounded-sm shadow-lg relative transition-transform duration-300 ease-in-out hover:scale-105 bg-white h-[400px]"
				href={`/societies/society/${partner.id}`}
				passHref
			>
				{/* logo */}
				<Image
					src={partner.logo && partner.logo !== '' ? partner.logo : '/images/placeholders/pretty-logo-not-found.jpg'}
					alt={partner.name}
					width={200}
					height={200}
					className={`w-full h-40 object-contain mb-1 `}
				/>
				<div className="flex flex-col justify-between flex-grow">
					<div>
						{/* TODO: make scrollable */}
						<p className="text-gray-700 text-sm line-clamp-3 text-ellipsis overflow-y-hidden">{partner.description}</p>
						<h3 className="text-slate-700 text-xl font-bold mt-2 mb-2 line-clamp-3">{partner.name}</h3>
					</div>
					<PartnerTags keywords={partner.keywords} />
				</div>
				<div className="relative flex flex-row grid-cols-2 justify-between flex-grow">
					<PartnerWebsite
						handleWebsiteClick={handleWebsiteClick}
						partner={partner}
					/>
					<PartnerMessage
						handleMessageClick={handleMessageClick}
						partner={partner}
					/>
				</div>
			</Link>
		</>
	)
}
