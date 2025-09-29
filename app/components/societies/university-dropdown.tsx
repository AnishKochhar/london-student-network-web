"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface UniversityDropdownProps {
	universities: string[];
	selectedUniversity: string;
	onSelect: (university: string) => void;
}

export default function UniversityDropdown({
	universities,
	selectedUniversity,
	onSelect
}: UniversityDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSelect = (university: string) => {
		onSelect(university);
		setIsOpen(false);
	};

	// Get display text for the button
	const getDisplayText = () => {
		if (!selectedUniversity) return "All Universities";
		return selectedUniversity;
	};

	// Check if we have 6+ universities for the special case
	const has6PlusUniversities = false; // Disabled per user request

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Dropdown Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<span className="text-left flex-1 truncate">
					{getDisplayText()}
				</span>
				<ChevronDown
					className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${
						isOpen ? 'transform rotate-180' : ''
					}`}
				/>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute z-50 w-full mt-2 bg-[#064580] border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
					{/* All Universities Option */}
					<button
						onClick={() => handleSelect("")}
						className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10 flex items-center justify-between ${
							!selectedUniversity ? 'bg-blue-600/30 text-blue-300' : 'text-white'
						}`}
					>
						<span>All Universities</span>
						{!selectedUniversity && <Check className="w-4 h-4" />}
					</button>

					{/* 6+ Universities Option (if applicable) */}
					{has6PlusUniversities && (
						<div className="px-4 py-2 bg-blue-600/20 border-b border-white/10">
							<span className="text-blue-300 text-sm font-medium">
								✓ {universities.length}+ Universities
							</span>
						</div>
					)}

					{/* Individual Universities */}
					{universities.map((university) => (
						<button
							key={university}
							onClick={() => handleSelect(university)}
							className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center justify-between ${
								selectedUniversity === university ? 'bg-blue-600/30 text-blue-300' : 'text-white'
							}`}
						>
							<span className="truncate">{university}</span>
							{selectedUniversity === university && <Check className="w-4 h-4 flex-shrink-0" />}
						</button>
					))}
				</div>
			)}
		</div>
	);
}