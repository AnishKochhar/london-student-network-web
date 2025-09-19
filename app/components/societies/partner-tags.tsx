export default function PartnerTags({ keywords }: { keywords: string[] }) {
    return (
        <div className="flex flex-wrap gap-2 left-0 h-6 mt-2 mb-2 overflow-hidden">
            {keywords.map((tag, index) => (
                <span
                    key={index}
                    className="relative text-white px-2 py-1 rounded-full text-[10px] shadow-lg hover:cursor-default whitespace-nowrap scrollbar-hide h-6"
                    style={{
                        backgroundColor: "#297BD1", // Lighter background color than card background
                    }}
                >
                    {tag}
                </span>
            ))}
        </div>
    );
}
