export default function PartnerTags({ keywords }: { keywords: string[] }) {
	return (
		<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scrollbar-thumb-slate-300">
			{keywords.map((tag, index) => (
				<span
					key={index}
					className="text-white px-2 py-1 rounded-full text-[10px] shadow-lg hover:cursor-default whitespace-nowrap scrollbar-hide"
					style={{
						backgroundColor: '#297BD1', // Lighter background color than card background
					}}
				>
					{tag}
				</span>
			))}
		</div>
	)
}