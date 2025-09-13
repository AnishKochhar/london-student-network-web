"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from '@/app/components/button';


interface Tag {
	value: string;
	label: string;
}

interface ModernTagsSelectProps {
	options: Tag[];
	value: string[];
	onChange: (selectedTags: string[]) => void;
	placeholder?: string;
	maxTags?: number;
	error?: string;
}

export default function ModernTagsSelect({
	options,
	value = [],
	onChange,
	placeholder = "Select tags",
	maxTags = 3,
	error
}: ModernTagsSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleTagToggle = (tagValue: string) => {
		if (value.includes(tagValue)) {
			onChange(value.filter(v => v !== tagValue));
		} else if (value.length < maxTags) {
			onChange([...value, tagValue]);
		}
		// Clear search term after selection
		setSearchTerm("");
	};

	const removeTag = (tagValue: string) => {
		onChange(value.filter(v => v !== tagValue));
	};

	const selectedTags = value.map(v => options.find(opt => opt.value === v)).filter(Boolean);

	const filteredOptions = options.filter(option => 
		option.label.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Click outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				setSearchTerm("");
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Focus input when dropdown opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	const handleContainerClick = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			setSearchTerm("");
		}
	};

	return (
		<div className="space-y-2" ref={containerRef}>
			<div className="relative">
				<div
					onClick={handleContainerClick}
					className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent transition-all flex items-center justify-between cursor-text"
				>
					<div className="flex flex-wrap gap-1.5 sm:gap-2 flex-1">
						{selectedTags.map((tag) => (
							<span
								key={tag.value}
								className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-500 text-white rounded-lg text-xs sm:text-sm"
							>
								{tag.label}
																<Button
									type="button"
									variant="ghost"
									onClick={(e) => {
										e.stopPropagation();
										removeTag(tag.value);
									}}
									className="hover:bg-blue-600 rounded-full p-0.5"
								>
									<XMarkIcon className="w-3 h-3" />
								</Button>
							</span>
						))}
						<input
							ref={inputRef}
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onFocus={() => setIsOpen(true)}
							placeholder={selectedTags.length === 0 ? placeholder : "Type to filter..."}
							className="bg-transparent border-none outline-none text-white placeholder-gray-400 flex-1 min-w-0"
							onClick={(e) => {
								e.stopPropagation();
								setIsOpen(true);
							}}
						/>
					</div>
					<ChevronDownIcon 
						className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
					/>
				</div>

				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
							className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 sm:max-h-64 overflow-y-auto"
						>
							{filteredOptions.length === 0 ? (
								<div className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-sm sm:text-base">
									No tags found
								</div>
							) : (
								filteredOptions.map((option) => (
																<Button
									key={option.value}
									type="button"
									variant="ghost"
									onClick={() => handleTagToggle(option.value)}
									disabled={!value.includes(option.value) && value.length >= maxTags}
									className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between text-sm sm:text-base ${
										value.includes(option.value) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
									} ${
										!value.includes(option.value) && value.length >= maxTags ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
									}`}
								>
									<span>{option.label}</span>
									{value.includes(option.value) && (
										<div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
											<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
										</div>
									)}
								</Button>
								))
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{value.length >= maxTags && (
				<p className="text-yellow-400 text-sm">Maximum {maxTags} tags selected</p>
			)}

			{error && (
				<p className="text-red-400 text-sm">{error}</p>
			)}
		</div>
	);
}