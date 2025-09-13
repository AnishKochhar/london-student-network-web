'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CompanyInformation } from '@/app/lib/types';
import { X } from 'lucide-react';
import { Button } from '@/app/components/button';


interface SponsorModalProps {
    sponsor: CompanyInformation;
    onClose: () => void;
}

export default function SponsorModal({ sponsor, onClose }: SponsorModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
        >
            <div 
                ref={modalRef}
                className="bg-gradient-to-br from-[#064580] to-[#041A2E] rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative border border-white/20 transform animate-scale-in overflow-y-auto max-h-[90vh]"
            >
                                <Button 
                    variant="ghost"
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X className="h-6 w-6" />
                </Button>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {sponsor.logo_url && (
                        <div className="w-32 h-32 flex-shrink-0 bg-white/10 rounded-lg flex items-center justify-center p-4">
                            <img 
                                src={sponsor.logo_url} 
                                alt={`${sponsor.company_name} logo`} 
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    )}
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold text-white mb-2">{sponsor.company_name}</h2>
                        {sponsor.website && (
                            <a 
                                href={sponsor.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline break-all"
                            >
                                {sponsor.website}
                            </a>
                        )}
                    </div>
                </div>
                {sponsor.description && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-gray-300 leading-relaxed">{sponsor.description}</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}