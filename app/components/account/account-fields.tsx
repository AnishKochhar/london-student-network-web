"use client";


// import { Button } from "../button";
import { useEffect, useState } from "react";
import getPredefinedTags from "@/app/lib/utils/events";

export default function AccountFields({ id, role }: { id: string, role: string }) {

	const [description, setDescription] = useState('loading');
	const [website, setWebsite] = useState('loading');
	const [tags, setTags] = useState<number[] | 'loading'>('loading');
	const [predefinedTags, setPredefinedTags] = useState([]);

	useEffect(() => {
		const fetchTags = async () => {
			const tags = await getPredefinedTags();
			setPredefinedTags(tags);
		};

		fetchTags();
	}, []);

	const fetchAccountInfo = async (id: string) => {
		try {
			setDescription('loading');
			setWebsite('loading');
			setTags('loading');
			const res = await fetch('/api/user/get-account-fields', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(id),
			});

			const { description, website, tags } = await res.json()
			setDescription(description);
			setWebsite(website);
			setTags(tags);
			console.log(description, website, tags);
		} catch (error) {
			setDescription('');
			setWebsite('');
			setTags([]);
			console.error('Error loading description:', error);
		}
	}

	useEffect(() => {
		if (role === "organiser") {
			fetchAccountInfo(id);
		}
	}, [role, id]);

	return (
		<div className="pb-4 mb-10 space-y-6">
			<p className="text-sm capitalize">
				<h3 className="text-lg font-semibold mb-2 text-white">Description</h3>
				<hr className="border-t-1 border-gray-300 w-2/3 my-2" />
				<p className="text-gray-100 whitespace-pre-wrap">{description || "No Description Found"}</p>
			</p>
			<p className="text-sm">
				<h3 className="text-lg font-semibold mb-2 text-white">Website</h3>
				<hr className="border-t-1 border-gray-300 w-2/3 my-2" />
				<p className="text-gray-100 whitespace-pre-wrap">{website || 'No Website Found'}</p>
			</p>
			<p className="text-sm capitalize">
				<h3 className="text-lg font-semibold mb-2 text-white">Tags</h3>
				<hr className="border-t-1 border-gray-300 w-2/3 my-2" />
				{tags === 'loading' || predefinedTags.length === 0 // modified to not show displeasing state while loading
					? 'Loading'
					: Array.isArray(tags) && tags.length > 0
						? tags
							.map((tag) => {
							const foundTag = predefinedTags.find((t) => t.value === tag);
							return foundTag ? foundTag.label : `Unknown (${tag})`;
							})
							.join(', ')
						: 'No tags found'}
			</p>
		</div>
	)
}
