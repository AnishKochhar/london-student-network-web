'use client';

// This page occassionally has a bug due to the pagination, where the same societies are fetched in the next page, causing 
// some societies to be missed out. Spotted during development on 31/12/2024. Likely because the db doesn't return societies in
// a particular order. Likely solution is ordering the societies by id or name in the db query.

// Second bug, when the user scrolls very quickly on initial render, only some 23 of the 33 societies are rendered/fetched.
// This was spotted during development on 6/1/2025. For now, pagination is removed until it is
// more thoroughly tested and fixed.

import { useState, useMemo, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { fetchPartners } from '@/app/lib/utils/events';
import CardSkeleton from '@/app/components/skeletons/card';
import Partners from '@/app/components/societies/partners';
import { FormattedPartner } from '@/app/lib/types';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function SocietyPage() {
	// Search feature will search the whole dataset, and we'll paginate it
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [partners, setPartners] = useState<FormattedPartner[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [hasMore, setHasMore] = useState<boolean>(true); // Tracks if more data exists
	const [initialLoadTriggered, setInitialLoadTriggered] = useState<boolean>(false); // New state
	const pageSize: number = 10;
	const maxCards: number = 100; // Max number of cards per page

	// Filter partners based on searchQuery
	const filteredPartners = useMemo(() => {
		if (!searchQuery) return partners;
		return partners.filter(
			(partner) =>
				partner.name.toLowerCase().includes(searchQuery) ||
				partner.keywords.some((keyword: string) =>
					keyword.toLowerCase().includes(searchQuery)
				)
		);
	}, [searchQuery, partners]);

	// Fetch partners for the current page
	const fetchPartnersData =useCallback(async () => {
		setLoading(true);
		const result = await fetchPartners(currentPage, pageSize);
		if (result.length === 0) {
			setHasMore(false); // No more data to fetch
		} else {
			setPartners((prev) => [...prev, ...result]);
		}
		setLoading(false);
	}, [currentPage, setHasMore, setPartners]);

	// Load more partners when the user scrolls to the bottom
	const loadMoreData = useCallback(() => {
		if (hasMore && filteredPartners.length < maxCards) {
			setCurrentPage((prev) => prev + 1);
		}
	}, [hasMore, filteredPartners, setCurrentPage]);


	useEffect(() => {
		fetchPartnersData();
	}, [currentPage, fetchPartnersData]);

	// Trigger data fetch while skeletons are shown
	useEffect(() => {
		if (loading && !initialLoadTriggered && currentPage === 1) {
			setInitialLoadTriggered(true); // Ensure this runs only once
			loadMoreData();
		}
	}, [loading, initialLoadTriggered, currentPage, loadMoreData]);

	// Debounced function for handling input
	const handleInputChange = useMemo(
		() =>
			debounce((value: string) => {
				setSearchQuery(value.toLowerCase());
			}, 300),
		[]
	);

	// Handle pagination for next set of partners if there are more than 100
	const handlePagination = (page: number) => {
		setCurrentPage(page);
	};

	// Calculate total pages for pagination
	const totalPages = Math.ceil(filteredPartners.length / pageSize);

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10 relative">
			<div className="flex flex-row items-center justify-between w-full max-w-[1000px] mb-10">
				<h1 className="text-4xl font-semibold text-white">Our Partners</h1>

				{/* Search Box */}
				<div className="relative hidden items-center w-[100px] sm:w-[100px] md:w-[200px] lg:w-[300px] transition-all duration-100 ease-in-out bg-transparent backdrop-blur-lg bg-opacity-30 rounded-lg">
					<input
						type="text"
						placeholder="Search partners..."
						className="rounded-full border-[1px] border-white bg-transparent px-6 py-3 w-[300px] min-w-[50px] text-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-[250px] md:w-[300px]"
						onChange={(e) => handleInputChange(e.target.value)}
						disabled // the search box feature is more complex because of the pagination feature
					/>
				</div>
			</div>

			{/* Skeletons on Initial Render */}
			{loading && currentPage === 1 && (
				<div className="flex flex-col space-y-8 w-full max-w-[1000px] overflow-x-auto mt-16">
					{Array.from({ length: 10 }).map((_, index) => (
						<CardSkeleton key={index} />
					))}
				</div>
			)}

			{/* Infinite Scroll */}
			<InfiniteScroll
				dataLength={filteredPartners.length}
				next={loadMoreData}
				hasMore={hasMore}
				loader={
					loading && (
						<div className="flex flex-col space-y-8 w-full max-w-[1000px] overflow-x-auto mt-16">
							{Array.from({ length: 10 }).map((_, index) => (
								<CardSkeleton key={index} />
							))}
						</div>
					)
				}
				endMessage={
					!loading && partners.length > 0 ? (
						<p className="text-center text-white text-lg font-semibold mt-8">
							<span className="inline-block bg-transparent px-4 py-2 rounded-full shadow-md">
								No more partners available.
							</span>
						</p>
					) : null
				}
				scrollThreshold={0.9} // Trigger when 90% of the content is visible
			>
				{/* Partners List */}
				<div className=" w-full overflow-x-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 ">
					<Partners filteredPartners={filteredPartners} />
				</div>
			</InfiniteScroll>

			{/* Pagination */}
			{filteredPartners.length >= maxCards && !loading && (
				<div className="flex justify-center mt-8 space-x-4">
					{Array.from({ length: totalPages }, (_, index) => (
						<button
							key={index + 1}
							onClick={() => handlePagination(index + 1)}
							className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
						>
							{index + 1}
						</button>
					))}
				</div>
			)}
		</main>
	);
}
