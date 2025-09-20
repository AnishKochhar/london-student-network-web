import { FormattedPartner } from "@/app/lib/types";
("");
import Image from "next/image";

export default function PartnerMessage({
    handleMessageClick,
    partner,
}: {
    handleMessageClick: (
        e: React.MouseEvent<HTMLButtonElement>,
        id: number,
    ) => void;
    partner: FormattedPartner;
}) {
    return (
        <>
            <button
                onClick={(e) => handleMessageClick(e, partner.id)}
                className="flex bg-transparent text-white py-2 rounded-lg hover:text-gray-400 transition text-sm mr-0 w-full items-center"
            >
                <span className="flex items-center justify-center text-white hover:text-gray-400 px-4 py-2 rounded-lg transition text-sm bg-[#1A4E85] w-full">
                    {/* Message */}
                    <Image
                        src="/icons/send-message-icon.png"
                        alt="website icon"
                        width={20}
                        height={20}
                        className=" object-cover"
                    />
                </span>
            </button>
        </>
    );
}
