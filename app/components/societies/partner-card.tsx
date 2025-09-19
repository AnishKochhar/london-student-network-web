"use client";

import { FormattedPartner } from "@/app/lib/types";
import Image from "next/image";
import Link from "next/link";
import { formattedWebsite } from "@/app/lib/utils";
import PartnerTags from "./partner-tags";
import PartnerWebsite from "./partner-website";
import PartnerMessage from "./partner-message";

export default function PartnerCard({
    partner,
}: {
    partner: FormattedPartner;
}) {
    const handleMessageClick = (
        e: React.MouseEvent<HTMLButtonElement>,
        id: number,
    ) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`/societies/message/${id.toString()}`, "_blank")?.focus();
    };

    const handleWebsiteClick = (
        e: React.MouseEvent<HTMLButtonElement>,
        website: string,
    ) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(formattedWebsite(website), "_blank");
    };

    return (
        <Link
            className="flex flex-col p-4 rounded-sm shadow-lg relative transition-transform duration-300 ease-in-out hover:scale-105 bg-white h-[500px] w-full"
            href={`/societies/society/${partner.id}`}
            passHref
        >
            {/* Image Container */}
            <div className="h-40 w-full mb-4 flex items-center justify-center">
                <Image
                    src={
                        partner.logo ||
                        "/images/placeholders/pretty-logo-not-found.jpg"
                    }
                    alt={partner.name}
                    width={200}
                    height={200}
                    className="object-contain max-h-full max-w-full"
                />
            </div>

            {/* Content Container */}
            <div className="flex flex-col flex-1 min-h-0">
                {/* Text Content */}
                <div className="flex-1 min-h-0 grid grid-rows-[auto,auto] gap-2">
                    <h3 className="text-slate-700 text-xl font-bold line-clamp-3 leading-tight h-20">
                        {partner.name}
                    </h3>
                    <p className="text-gray-700 text-sm line-clamp-4 overflow-y-auto scrollbar-hide">
                        {partner.description}
                    </p>
                </div>

                {/* Tags and Buttons */}
                <div className="mt-4 space-y-2">
                    <PartnerTags keywords={partner.keywords} />

                    <div className="grid grid-cols-2 gap-2">
                        <PartnerWebsite
                            handleWebsiteClick={handleWebsiteClick}
                            partner={partner}
                        />
                        <PartnerMessage
                            handleMessageClick={handleMessageClick}
                            partner={partner}
                        />
                    </div>
                </div>
            </div>
        </Link>
    );
}
