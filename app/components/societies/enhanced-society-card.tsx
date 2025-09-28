"use client";

import Image from "next/image";
import { MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getCategoryByTagValue } from "@/app/utils/tag-categories";

interface Society {
	id: string;
	name: string;
	description: string | null;
	website: string | null;
	logo_url: string | null;
	tags: number[];
	university: string | null;
}

interface EnhancedSocietyCardProps {
	society: Society;
}

const formatUrl = (url: string) => {
	if (url.startsWith("http") || url.startsWith("https")) {
		return url;
	}
	return `https://${url}`;
};

export default function EnhancedSocietyCard({ society }: EnhancedSocietyCardProps) {
	const websiteUrl = society.website && society.website !== "No website available"
		? formatUrl(society.website)
		: `/societies/society/${society.id}`;
	const hasWebsite = society.website && society.website !== "No website available";

	// Get tag information with categories
	const tagInfo = society.tags?.map(tagValue => {
		const categoryFromUtils = getCategoryByTagValue(tagValue);
		if (categoryFromUtils) {
			const tag = categoryFromUtils.tags.find(t => t.value === tagValue);
			if (tag) {
				return {
					value: tagValue,
					label: tag.label,
					category: categoryFromUtils.name,
					color: categoryFromUtils.color,
					icon: categoryFromUtils.icon
				};
			}
		}
		return null;
	}).filter(Boolean) || [];

	// Group tags by category and limit display
	const displayTags = tagInfo.slice(0, 6); // Show max 6 tags
	const hiddenTagsCount = Math.max(0, tagInfo.length - 6);

	return (
		<div className="group bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl h-full flex flex-col">
			{/* Header with Logo and University */}
			<div className="flex items-start gap-4 mb-4">
				<div className="h-16 w-16 relative flex-shrink-0">
					<Image
						src={society.logo_url || "/images/placeholders/pretty-logo-not-found.jpg"}
						alt={`${society.name} logo`}
						fill
						className="object-contain rounded-lg filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-300"
					/>
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-2">
						{society.name}
					</h3>
					{society.university && (
						<p className="text-xs text-gray-400 bg-white/10 rounded-full px-2 py-1 inline-block">
							🏫 {society.university}
						</p>
					)}
				</div>
			</div>

			{/* Tags */}
			{displayTags.length > 0 && (
				<div className="mb-4">
					<div className="flex flex-wrap gap-1.5">
						{displayTags.map((tag) => (
							<span
								key={tag.value}
								className={`text-xs font-medium px-2 py-1 rounded-full border ${tag.color} border-current/30`}
								title={`${tag.category}: ${tag.label}`}
							>
								{/* <span className="mr-1">{tag.icon}</span> */}
								{tag.label}
							</span>
						))}
						{hiddenTagsCount > 0 && (
							<span className="text-xs text-gray-400 bg-white/10 rounded-full px-2 py-1">
								+{hiddenTagsCount} more
							</span>
						)}
					</div>
				</div>
			)}

			{/* Description */}
			<p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
				{society.description || "No description available"}
			</p>

			{/* Action Buttons */}
			<div className="flex gap-3 mt-auto">
				<Link
					href={`/societies/society/${society.id}`}
					className="flex-1 group/button relative inline-flex items-center justify-center px-4 py-2 font-medium text-white bg-blue-600/50 rounded-lg hover:bg-blue-600/80 transition-all duration-300 text-sm"
				>
					<span className="relative z-10">View Details</span>
				</Link>

				{hasWebsite && (
					<a
						href={websiteUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="group/button relative inline-flex items-center justify-center px-4 py-2 font-medium text-white bg-gray-600/50 rounded-lg hover:bg-gray-600/80 transition-all duration-300 text-sm"
						onClick={(e) => e.stopPropagation()}
					>
						<ExternalLink className="h-4 w-4" />
					</a>
				)}

				<Link
					href={`/societies/message/${society.id}`}
					className="group/button relative inline-flex items-center justify-center px-4 py-2 font-medium text-white bg-green-600/50 rounded-lg hover:bg-green-600/80 transition-all duration-300 text-sm"
					onClick={(e) => e.stopPropagation()}
				>
					<MessageSquare className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
}