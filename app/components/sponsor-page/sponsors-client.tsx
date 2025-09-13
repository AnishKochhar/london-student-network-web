'use client';

import { useState, useEffect, useMemo } from 'react';
import { CompanyInformation } from '@/app/lib/types';
import { Search, ArrowRight } from 'lucide-react';
import SponsorModal from './SponsorModal';
import Image from 'next/image';
import { Button } from '@/app/components/button';


interface Sponsor extends CompanyInformation {}

interface SponsorsPageClientProps {
    initialSponsors: Sponsor[];
}

export default function SponsorsPageClient({ initialSponsors }: SponsorsPageClientProps) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedQuery, setDebouncedQuery] = useState<string>('');
    const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    const filteredSponsors = useMemo(() => {
        if (!debouncedQuery) return initialSponsors;
        return initialSponsors.filter(sponsor =>
            sponsor.company_name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            sponsor.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
    }, [initialSponsors, debouncedQuery]);

    return (
        <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10 relative">
            <div className="flex flex-col items-center w-full max-w-[1000px] mb-10">
                <h1 className="text-4xl font-semibold text-white">Our Sponsors</h1>

                <div className="mt-8 w-full flex justify-center">
                    <div className="relative group w-full md:w-2/3 lg:w-1/2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search sponsors..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-md hover:bg-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            							<Button
								onClick={() => setSearchQuery('')}
								className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
								variant="ghost"
							>
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</Button>
                        )}
                    </div>
                </div>
                {debouncedQuery && (
                    <p className="text-blue-300 text-sm mt-2 text-left w-full md:w-2/3 lg:w-1/2">
                        {filteredSponsors.length} result{filteredSponsors.length !== 1 ? 's' : ''} found
                    </p>
                )}
            </div>

            <div className="relative w-full mt-3 grid partner-grid gap-8">
                {filteredSponsors.map((sponsor) => (
                    <div 
                        key={sponsor.company_name}
                        className="group bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:bg-white/15 hover:scale-105 hover:shadow-xl cursor-pointer"
                        onClick={() => setSelectedSponsor(sponsor)}
                    >
                        {sponsor.logo_url ? (
                            <div className="h-16 mb-4 flex items-center justify-center">
                                <div className="relative inline-block">
                                    <Image 
                                        src={sponsor.logo_url} 
                                        alt={`${sponsor.company_name} logo`}
                                        width={150} 
                                        height={64} 
                                        className="max-h-16 object-contain filter grayscale-[40%] group-hover:grayscale-0 transition-all duration-300"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-16 mb-4 flex items-center justify-center bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-lg">
                                <span className="text-2xl font-bold text-white/80">
                                    {sponsor.company_name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors">
                            {sponsor.company_name}
                        </h3>
                        {sponsor.description && (
                            <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-3">
                                {sponsor.description}
                            </p>
                        )}
                        {sponsor.website && (
                            <a 
                                href={sponsor.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group/button relative inline-flex items-center justify-center px-8 py-2 overflow-hidden font-medium text-white bg-blue-600/50 rounded-full hover:bg-blue-600/80 transition-all duration-300 ease-in-out"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="relative z-10 transition-all duration-300 ease-in-out group-hover/button:-translate-x-4">Visit Website</span>
                                <ArrowRight className="absolute right-4 h-5 w-5 text-white opacity-0 transform translate-x-4 transition-all duration-300 ease-in-out group-hover/button:opacity-100 group-hover/button:translate-x-0" />
                            </a>
                        )}
                    </div>
                ))}
            </div>

            {selectedSponsor && (
                <SponsorModal sponsor={selectedSponsor} onClose={() => setSelectedSponsor(null)} />
            )}

            {!filteredSponsors.length && (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-400 text-lg">No sponsors found matching your search.</p>
                </div>
            )}
        </main>
    );
}
