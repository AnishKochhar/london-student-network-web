'use client';

import Image from 'next/image';
import { FormattedPartner } from '@/app/lib/types';
import { ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface SocietyCardProps {
    partner: FormattedPartner;
}

const formatUrl = (url: string) => {
    if (url.startsWith('http') || url.startsWith('https')) {
        return url;
    }
    return `https://${url}`;
};

export default function SocietyCard({ partner }: SocietyCardProps) {
    const websiteUrl = partner.website && partner.website !== 'No website available' ? formatUrl(partner.website) : `/societies/society/${partner.id}`;
    const hasWebsite = partner.website && partner.website !== 'No website available';

    return (
        <Link href={`/societies/society/${partner.id}`} passHref>
            <div className="group bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-2xl cursor-pointer h-full flex flex-col">
                <div className="flex flex-col items-center text-center flex-grow">
                    <div className="h-24 w-24 relative mb-4">
                        <Image
                            src={partner.logo || '/images/placeholders/pretty-logo-not-found.jpg'}
                            alt={`${partner.name} logo`}
                            layout="fill"
                            objectFit="contain"
                            className="filter grayscale-[70%] group-hover:grayscale-0 transition-all duration-300"
                        />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {partner.name}
                    </h3>
                    <div className="flex flex-wrap justify-center items-center mb-4">
                        {partner.keywords && partner.keywords.map((tag, index) => (
                            <span key={index} className="text-xs text-white bg-white/10 rounded-full px-3 py-1 m-1">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
                        {partner.description}
                    </p>
                </div>
                <div className="flex space-x-4 mt-auto justify-center">
                    <a
                        href={websiteUrl}
                        target={hasWebsite ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="group/button relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-medium text-white bg-blue-600/50 rounded-full hover:bg-blue-600/80 transition-all duration-300 ease-in-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="relative z-10 transition-all duration-300 ease-in-out group-hover/button:-translate-x-3">Website</span>
                        <ArrowRight className="absolute right-3 h-5 w-5 text-white opacity-0 transform translate-x-3 transition-all duration-300 ease-in-out group-hover/button:opacity-100 group-hover/button:translate-x-0" />
                    </a>
                    <Link href={`/societies/message/${partner.id}`} legacyBehavior>
                        <a 
                            className="group/button relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-medium text-white bg-gray-600/50 rounded-full hover:bg-gray-600/80 transition-all duration-300 ease-in-out"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="relative z-10 transition-all duration-300 ease-in-out group-hover/button:-translate-x-3">Message</span>
                            <MessageSquare className="absolute right-3 h-5 w-5 text-white opacity-0 transform translate-x-3 transition-all duration-300 ease-in-out group-hover/button:opacity-100 group-hover/button:translate-x-0" />
                        </a>
                    </Link>
                </div>
            </div>
        </Link>
    );
}