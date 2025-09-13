'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchPartners } from '@/app/lib/utils/events';
import SocietyCard from '@/app/components/societies/society-card';
import { CardSkeleton } from '@/app/components/societies/skeletons';
import { FormattedPartner } from '@/app/lib/types';
import { Search } from 'lucide-react';
import { Button } from '@/app/components/button';


const PARTNERS_PER_PAGE = 100;

export default function SocietyPage() {
    const [partners, setPartners] = useState<FormattedPartner[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedQuery, setDebouncedQuery] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    const fetchPartnersData = useCallback(async (pageNum: number) => {
        setLoading(true);
        const result = await fetchPartners(pageNum, PARTNERS_PER_PAGE);
        if (result && result.length > 0) {
            setPartners(prev => [...prev, ...result]);
            setPage(pageNum);
            if (result.length < PARTNERS_PER_PAGE) {
                setHasMore(false);
            }
        } else {
            setHasMore(false);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPartnersData(1);
    }, [fetchPartnersData]);

    const filteredPartners = useMemo(() => {
        if (!debouncedQuery) return partners;
        return partners.filter(partner =>
            partner.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            partner.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
    }, [partners, debouncedQuery]);

    const loadMore = () => {
        if (hasMore && !loading) {
            fetchPartnersData(page + 1);
        }
    };

    return (
        <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10 relative">
            <div className="flex flex-col items-center w-full max-w-[1000px] mb-10">
                <h1 className="text-4xl font-semibold text-white">Our Partners</h1>

                <div className="mt-8 w-full flex justify-center">
                    <div className="relative group w-full md:w-2/3 lg:w-1/2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search societies and partners..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-md hover:bg-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            							<Button
								variant="ghost"
								onClick={() => setSearchQuery('')}
								className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
							>
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</Button>
                        )}
                    </div>
                </div>
                {debouncedQuery && (
                    <p className="text-blue-300 text-sm mt-2 text-center w-full">
                        {filteredPartners.length} result{filteredPartners.length !== 1 ? 's' : ''} found
                    </p>
                )}
            </div>

            <div className="relative w-full mt-3 grid partner-grid gap-8">
                {filteredPartners.map(partner => (
                    <SocietyCard key={partner.id} partner={partner} />
                ))}
                {loading && Array.from({ length: PARTNERS_PER_PAGE }).map((_, index) => (
                    <CardSkeleton key={`skeleton-${index}`} />
                ))}
            </div>

            {hasMore && !loading && (
                <div className="mt-10 text-center">
                    					<Button
						variant="filled"
						onClick={loadMore}
						className="bg-blue-600/80 hover:bg-blue-700/80"
					>
						Load More
					</Button>
                </div>
            )}

            {!hasMore && !loading && partners.length === 0 && (
                 <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-400 text-lg">No partners found.</p>
                </div>
            )}
        </main>
    );
}