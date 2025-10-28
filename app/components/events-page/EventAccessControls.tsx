"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon, LockClosedIcon, GlobeAltIcon, UserGroupIcon, ShieldCheckIcon, AcademicCapIcon, LinkIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface EventAccessControlsProps {
    visibilityLevel: string;
    registrationLevel: string;
    allowedUniversities: string[];
    linkOnly?: boolean;
    onVisibilityChange: (value: string) => void;
    onRegistrationChange: (value: string) => void;
    onAllowedUniversitiesChange: (universities: string[]) => void;
    onLinkOnlyChange?: (value: boolean) => void;
}

// Visibility/Registration level options with descriptions
const VISIBILITY_OPTIONS = [
    {
        value: 'public',
        label: 'Public',
        icon: GlobeAltIcon,
        description: 'Anyone can see this event, including non-members and external visitors'
    },
    {
        value: 'students_only', // Database value (includes all account types: students, societies, companies)
        label: 'Logged In Users',
        icon: UserGroupIcon,
        description: 'Only users with accounts can see this event (students, societies, and companies)'
    },
    {
        value: 'verified_students',
        label: 'Verified Students',
        icon: ShieldCheckIcon,
        description: 'Only students with verified university emails can see this event'
    },
    {
        value: 'university_exclusive',
        label: 'University Exclusive',
        icon: AcademicCapIcon,
        description: 'Only verified students from specific universities can see this event'
    }
];

// University options for multi-select (London universities)
const UNIVERSITY_OPTIONS = [
    // Russell Group London universities
    { code: 'imperial', name: 'Imperial College London' },
    { code: 'ucl', name: 'University College London' },
    { code: 'kcl', name: "King's College London" },
    { code: 'lse', name: 'London School of Economics' },
    { code: 'qmul', name: 'Queen Mary University of London' },

    // University of London federation members
    { code: 'birkbeck', name: 'Birkbeck, University of London' },
    { code: 'city', name: 'City, University of London' },
    { code: 'city-st-georges', name: "City St George's, University of London" },
    { code: 'courtauld', name: 'Courtauld Institute of Art' },
    { code: 'goldsmiths', name: 'Goldsmiths, University of London' },
    { code: 'icr', name: 'Institute of Cancer Research' },
    { code: 'lbs', name: 'London Business School' },
    { code: 'lshtm', name: 'London School of Hygiene & Tropical Medicine' },
    { code: 'ram', name: 'Royal Academy of Music' },
    { code: 'cssd', name: 'Royal Central School of Speech and Drama' },
    { code: 'royal-holloway', name: 'Royal Holloway, University of London' },
    { code: 'rvc', name: 'Royal Veterinary College' },
    { code: 'soas', name: 'SOAS University of London' },
    { code: 'st-georges', name: "St George's, University of London" },

    // Other major London universities
    { code: 'arts', name: 'University of the Arts London' },
    { code: 'brunel', name: 'Brunel University London' },
    { code: 'greenwich', name: 'University of Greenwich' },
    { code: 'kingston', name: 'Kingston University' },
    { code: 'london-met', name: 'London Metropolitan University' },
    { code: 'southbank', name: 'London South Bank University' },
    { code: 'middlesex', name: 'Middlesex University' },
    { code: 'roehampton', name: 'University of Roehampton' },
    { code: 'uel', name: 'University of East London' },
    { code: 'uwl', name: 'University of West London' },
    { code: 'westminster', name: 'University of Westminster' },

    // Specialist institutions
    { code: 'rca', name: 'Royal College of Art' },
    { code: 'rcm', name: 'Royal College of Music' },
    { code: 'gsmd', name: 'Guildhall School of Music and Drama' },
    { code: 'trinitylaban', name: 'Trinity Laban Conservatoire' },
    { code: 'ravensbourne', name: 'Ravensbourne University London' },
    { code: 'libf', name: 'London Institute of Banking & Finance' },
    { code: 'regents', name: "Regent's University London" },
];

// Custom Dropdown Component with icons
const AccessDropdown = ({ value, onChange, options, label, tooltip, disabled = false, onOpenChange }: {
    value: string;
    onChange: (value: string) => void;
    options: typeof VISIBILITY_OPTIONS;
    label: string;
    tooltip: string;
    disabled?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(option => option.value === value);
    const IconComponent = selectedOption?.icon || GlobeAltIcon;

    return (
        <div ref={dropdownRef} className="relative">
            <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <label className="block text-sm font-medium text-white mb-3">
                    {label} <span className="text-red-300">*</span>
                </label>

                {/* Tooltip */}
                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -top-2 left-0 right-0 transform -translate-y-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-[100]"
                        >
                            <div className="text-center">{tooltip}</div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none flex items-center justify-between backdrop-blur transition-all ${
                    disabled
                        ? 'bg-white/5 border-white/20 text-white/50 cursor-not-allowed'
                        : 'bg-white/10 border-white/30 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:bg-white/15'
                }`}
            >
                <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-blue-300" />
                    <span className={selectedOption ? "text-white" : "text-white/60"}>
                        {selectedOption ? selectedOption.label : 'Select level...'}
                    </span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-[100] overflow-hidden"
                    >
                        {options.map((option) => {
                            const OptionIcon = option.icon;
                            const isSelected = value === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left transition-colors ${
                                        isSelected
                                            ? 'bg-blue-50 border-l-4 border-blue-600'
                                            : 'hover:bg-blue-50 border-l-4 border-transparent'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <OptionIcon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <div>
                                            <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {option.label}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {option.description}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// University Multi-Select Component
const UniversityMultiSelect = ({ selectedUniversities, onChange, onOpenChange }: {
    selectedUniversities: string[];
    onChange: (universities: string[]) => void;
    onOpenChange?: (isOpen: boolean) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleUniversity = (code: string) => {
        if (selectedUniversities.includes(code)) {
            onChange(selectedUniversities.filter(u => u !== code));
        } else {
            onChange([...selectedUniversities, code]);
        }
    };

    const selectedNames = selectedUniversities
        .map(code => UNIVERSITY_OPTIONS.find(u => u.code === code)?.name)
        .filter(Boolean);

    return (
        <div ref={dropdownRef} className="relative">
            <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <label className="block text-sm font-medium text-white mb-3">
                    Select Universities <span className="text-red-300">*</span>
                </label>

                {/* Tooltip */}
                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -top-2 left-0 right-0 transform -translate-y-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-[100]"
                        >
                            <div className="text-center">Only students with verified emails from these universities can access this event</div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur flex items-center justify-between hover:bg-white/15 transition-all"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <AcademicCapIcon className="w-5 h-5 text-blue-300 flex-shrink-0" />
                    <span className={selectedUniversities.length > 0 ? "text-white truncate" : "text-white/60"}>
                        {selectedUniversities.length > 0
                            ? selectedUniversities.length === 1
                                ? selectedNames[0]
                                : `${selectedUniversities.length} universities selected`
                            : 'Select universities...'}
                    </span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-[100] max-h-60 overflow-y-auto"
                    >
                        {UNIVERSITY_OPTIONS.map((uni) => {
                            const isSelected = selectedUniversities.includes(uni.code);

                            return (
                                <button
                                    key={uni.code}
                                    type="button"
                                    onClick={() => toggleUniversity(uni.code)}
                                    className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                                        isSelected
                                            ? 'bg-blue-50 hover:bg-blue-100'
                                            : 'hover:bg-blue-50'
                                    }`}
                                >
                                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                                        isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300'
                                    }`}>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`${isSelected ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
                                        {uni.name}
                                    </span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selected universities chips */}
            {selectedUniversities.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 flex flex-wrap gap-2"
                >
                    {selectedUniversities.map(code => {
                        const uni = UNIVERSITY_OPTIONS.find(u => u.code === code);
                        return (
                            <motion.div
                                key={code}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-100 rounded-full text-sm"
                            >
                                <span>{uni?.name}</span>
                                <button
                                    type="button"
                                    onClick={() => toggleUniversity(code)}
                                    className="hover:text-blue-300 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

export default function EventAccessControls({
    visibilityLevel,
    registrationLevel,
    allowedUniversities,
    linkOnly = false,
    onVisibilityChange,
    onRegistrationChange,
    onAllowedUniversitiesChange,
    onLinkOnlyChange,
}: EventAccessControlsProps) {
    const [hasOpenDropdown, setHasOpenDropdown] = useState(false);

    // Get available registration options based on visibility level
    const getAvailableRegistrationOptions = () => {
        const visibilityIndex = VISIBILITY_OPTIONS.findIndex(opt => opt.value === visibilityLevel);
        // Registration can only be as restrictive or more restrictive than visibility
        return VISIBILITY_OPTIONS.slice(visibilityIndex);
    };

    // Auto-adjust registration level if visibility becomes more restrictive
    useEffect(() => {
        const visibilityIndex = VISIBILITY_OPTIONS.findIndex(opt => opt.value === visibilityLevel);
        const registrationIndex = VISIBILITY_OPTIONS.findIndex(opt => opt.value === registrationLevel);

        if (visibilityIndex > registrationIndex) {
            // Visibility is more restrictive, so registration must match or be more restrictive
            onRegistrationChange(visibilityLevel);
        }
    }, [visibilityLevel, registrationLevel, onRegistrationChange]);

    return (
        <div className={`space-y-6 ${hasOpenDropdown ? 'relative z-[100]' : ''}`}>
            {/* Info banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg"
            >
                <div className="flex items-start gap-3">
                    <LockClosedIcon className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-100">
                        <p className="font-medium mb-1">Access Control</p>
                        <p className="text-xs text-blue-200/80">
                            Control who can see and register for your event. You can restrict access to logged-in users, verified students, or specific universities. 
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Link-Only Toggle */}
            {onLinkOnlyChange && (
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <LinkIcon className="w-5 h-5 text-purple-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="link-only-toggle" className="font-medium text-white cursor-pointer">
                                    Link-Only Event
                                </label>
                                <button
                                    type="button"
                                    id="link-only-toggle"
                                    role="switch"
                                    aria-checked={linkOnly}
                                    onClick={() => onLinkOnlyChange(!linkOnly)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        linkOnly ? 'bg-purple-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            linkOnly ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-gray-300">
                                When enabled, this event will be hidden from public event listings but accessible to anyone with the direct link.
                                {linkOnly && " Perfect for invite-only or private events."}
                            </p>
                        </div>
                    </div>

                    {linkOnly && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-white/10"
                        >
                            <div className="flex items-start gap-2 text-xs">
                                <EyeSlashIcon className="w-4 h-4 text-purple-300 flex-shrink-0 mt-0.5" />
                                <p className="text-purple-200">
                                    This event won&apos;t appear in search results or public listings. Share the event link with your invitees.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Visibility Level */}
            <div>
                <AccessDropdown
                    value={visibilityLevel}
                    onChange={onVisibilityChange}
                    options={VISIBILITY_OPTIONS}
                    label="Who can see this event?"
                    tooltip={linkOnly ? "Controls who can access the event page when they have the link" : "Controls who can view this event on the events page"}
                    onOpenChange={setHasOpenDropdown}
                    disabled={linkOnly}
                />
                {linkOnly && (
                    <p className="mt-2 text-xs text-gray-400">
                        Not applicable for link-only events (hidden from listings)
                    </p>
                )}
            </div>

            {/* Registration Level */}
            <div>
                <AccessDropdown
                    value={registrationLevel}
                    onChange={onRegistrationChange}
                    options={getAvailableRegistrationOptions()}
                    label="Who can register?"
                    tooltip="Controls who can sign up for this event. Must be at least as restrictive as visibility."
                    disabled={visibilityLevel === 'university_exclusive'} // Auto-match for university exclusive
                    onOpenChange={setHasOpenDropdown}
                />
            </div>

            {/* University Multi-Select (conditional) */}
            <AnimatePresence mode="wait">
                {(visibilityLevel === 'university_exclusive' || registrationLevel === 'university_exclusive') && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <UniversityMultiSelect
                            selectedUniversities={allowedUniversities}
                            onChange={onAllowedUniversitiesChange}
                            onOpenChange={setHasOpenDropdown}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Security reminder for university exclusive */}
            <AnimatePresence>
                {visibilityLevel === 'university_exclusive' && allowedUniversities.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 bg-green-500/10 border border-green-400/30 rounded-lg"
                    >
                        <div className="flex items-center gap-2 text-xs text-green-100">
                            <ShieldCheckIcon className="w-4 h-4 text-green-300" />
                            <span>Access restricted to verified students from {allowedUniversities.length} {allowedUniversities.length === 1 ? 'university' : 'universities'}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
