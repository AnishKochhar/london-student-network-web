"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { TAG_CATEGORIES, POPULAR_TAGS } from "@/app/utils/tag-categories";
import { motion, AnimatePresence } from "framer-motion";
import UniversityDropdown from "./university-dropdown";

interface FilterSystemProps {
	onFiltersChange: (filters: {
		categories: string[];
		tags: number[];
		university: string;
	}) => void;
	totalResults: number;
	selectedCategories: string[];
	selectedTags: number[];
}

export default function FilterSystem({ onFiltersChange, totalResults, selectedCategories: propSelectedCategories, selectedTags: propSelectedTags }: FilterSystemProps) {
	const [selectedCategories, setSelectedCategories] = useState<string[]>(propSelectedCategories);
	const [selectedTags, setSelectedTags] = useState<number[]>(propSelectedTags);
	const [selectedUniversity, setSelectedUniversity] = useState("");
	const [showMobileFilters, setShowMobileFilters] = useState(false);
	const [universities, setUniversities] = useState<string[]>([]);

	// Fetch universities on mount
	useEffect(() => {
		fetch('/api/societies/filter', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'universities' })
		})
			.then(res => res.json())
			.then(data => {
				if (data.success) {
					setUniversities(data.universities);
				}
			})
			.catch(console.error);
	}, []);

	// Update local state when props change
	useEffect(() => {
		setSelectedCategories(propSelectedCategories);
		setSelectedTags(propSelectedTags);
	}, [propSelectedCategories, propSelectedTags]);

	// Emit filter changes only when filters actually change through user interaction
	const emitFilterChanges = useCallback(() => {
		onFiltersChange({
			categories: selectedCategories,
			tags: selectedTags,
			university: selectedUniversity
		});
	}, [selectedCategories, selectedTags, selectedUniversity, onFiltersChange]);

	const toggleCategory = (categoryId: string) => {
		setSelectedCategories(prev => {
			const isSelected = prev.includes(categoryId);
			if (isSelected) {
				// Remove category and its tags
				const categoryTags = TAG_CATEGORIES.find(cat => cat.id === categoryId)?.tags.map(t => t.value) || [];
				const newTags = selectedTags.filter(tag => !categoryTags.includes(tag));
				const newCategories = prev.filter(id => id !== categoryId);

				setSelectedTags(newTags);

				// Emit changes immediately with new values
				onFiltersChange({
					categories: newCategories,
					tags: newTags,
					university: selectedUniversity
				});

				return newCategories;
			} else {
				// Add category
				const newCategories = [...prev, categoryId];

				// Emit changes immediately with new values
				onFiltersChange({
					categories: newCategories,
					tags: selectedTags,
					university: selectedUniversity
				});

				return newCategories;
			}
		});
	};

	const toggleTag = (tagValue: number, categoryId: string) => {
		setSelectedTags(prev => {
			const isSelected = prev.includes(tagValue);
			if (isSelected) {
				const newTags = prev.filter(tag => tag !== tagValue);

				// Emit changes immediately with new values
				onFiltersChange({
					categories: selectedCategories,
					tags: newTags,
					university: selectedUniversity
				});

				return newTags;
			} else {
				// Add tag and ensure its category is selected
				const newTags = [...prev, tagValue];
				let newCategories = selectedCategories;

				if (!selectedCategories.includes(categoryId)) {
					newCategories = [...selectedCategories, categoryId];
					setSelectedCategories(newCategories);
				}

				// Emit changes immediately with new values
				onFiltersChange({
					categories: newCategories,
					tags: newTags,
					university: selectedUniversity
				});

				return newTags;
			}
		});
	};

	const togglePopularTag = (tagValue: number) => {
		// Find which category this tag belongs to
		const category = TAG_CATEGORIES.find(cat =>
			cat.tags.some(tag => tag.value === tagValue)
		);

		if (category) {
			toggleTag(tagValue, category.id);
		}
		// No need for setTimeout here since toggleTag already handles it
	};

	const clearAllFilters = () => {
		setSelectedCategories([]);
		setSelectedTags([]);
		setSelectedUniversity("");
		// Emit changes immediately with cleared values
		onFiltersChange({
			categories: [],
			tags: [],
			university: ""
		});
	};

	const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0 || selectedUniversity;

	const getSelectedTagsInfo = () => {
		return selectedTags.map(tagValue => {
			for (const category of TAG_CATEGORIES) {
				const tag = category.tags.find(t => t.value === tagValue);
				if (tag) {
					return { ...tag, categoryName: category.name, categoryColor: category.color };
				}
			}
			return null;
		}).filter(Boolean);
	};

	return (
		<div className="w-full">
			{/* Mobile Filter Toggle */}
			<div className="lg:hidden mb-4">
				<button
					onClick={() => setShowMobileFilters(!showMobileFilters)}
					className="flex items-center gap-2 w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
				>
					<Filter className="w-5 h-5" />
					<span>Filters</span>
					{hasActiveFilters && (
						<span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
							{selectedTags.length + (selectedUniversity ? 1 : 0)}
						</span>
					)}
					{showMobileFilters ? <ChevronUp className="w-5 h-5 ml-auto" /> : <ChevronDown className="w-5 h-5 ml-auto" />}
				</button>
			</div>

			{/* Filter Content */}
			<div className={`${showMobileFilters ? 'block' : 'hidden lg:block'}`}>

				{/* Popular Tags Quick Access - HIDDEN */}
				{/* <div className="mb-6">
					<h3 className="text-white text-sm font-medium mb-3">Popular Tags</h3>
					<div className="flex flex-wrap gap-2">
						{POPULAR_TAGS.map(tag => (
							<button
								key={tag.value}
								onClick={() => togglePopularTag(tag.value)}
								className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag.value)
										? 'bg-blue-500 text-white'
										: 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
									}`}
							>
								{tag.label}
							</button>
						))}
					</div>
				</div> */}

				{/* University Filter - Custom Dropdown */}
				{universities.length > 0 && (
					<div className="mb-6">
						<h3 className="text-white text-sm font-medium mb-3">University</h3>
						<UniversityDropdown
							universities={universities}
							selectedUniversity={selectedUniversity}
							onSelect={(university) => {
								setSelectedUniversity(university);
								// Emit changes immediately with the new value
								onFiltersChange({
									categories: selectedCategories,
									tags: selectedTags,
									university: university
								});
							}}
						/>
					</div>
				)}

				{/* Category Filters */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-white text-sm font-medium">Categories</h3>
						{hasActiveFilters && (
							<button
								onClick={clearAllFilters}
								className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
							>
								Clear all
							</button>
						)}
					</div>

					{/* Category Selection with Inline Expansion */}
					<div className="space-y-2 mb-4">
						{TAG_CATEGORIES.map(category => (
							<div key={category.id}>
								{/* Category Button */}
								<button
									onClick={() => toggleCategory(category.id)}
									className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedCategories.includes(category.id)
										? category.color
										: 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
									}`}
								>
									<span className="text-lg">{category.icon}</span>
									<div className="min-w-0 flex-1">
										<div className="font-medium text-sm">{category.name}</div>
										<div className="text-xs opacity-75">
											{category.tags.length} tags
										</div>
									</div>
									{selectedCategories.includes(category.id) ? (
										<ChevronDown className="w-4 h-4" />
									) : (
										<ChevronDown className="w-4 h-4 transform rotate-180" />
									)}
								</button>

								{/* Expanded Tags - Appears directly below each category */}
								<AnimatePresence>
									{selectedCategories.includes(category.id) && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: "auto" }}
											exit={{ opacity: 0, height: 0 }}
											className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10"
										>
											<div className="flex flex-wrap gap-2">
												{category.tags.map(tag => (
													<button
														key={tag.value}
														// onClick={() => toggleTag(tag.value, category.id)} // Disabled - only category selection allowed
														disabled={true}
														className={`px-2 py-1 rounded text-xs transition-all cursor-not-allowed opacity-60 ${selectedTags.includes(tag.value)
															? 'bg-blue-500 text-white'
															: 'bg-white/10 text-gray-300'
														}`}
													>
														{tag.label}
													</button>
												))}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						))}
					</div>
				</div>

				{/* Selected Tags Summary */}
				{selectedTags.length > 0 && (
					<div className="mb-4">
						<h4 className="text-white text-sm font-medium mb-2">Selected Tags</h4>
						<div className="flex flex-wrap gap-2">
							{getSelectedTagsInfo().map(tagInfo => (
								<div
									key={tagInfo.value}
									className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${tagInfo.categoryColor}`}
								>
									<span>{tagInfo.label}</span>
									<button
										onClick={() => {
											const category = TAG_CATEGORIES.find(cat =>
												cat.tags.some(tag => tag.value === tagInfo.value)
											);
											if (category) {
												toggleTag(tagInfo.value, category.id);
											}
										}}
										className="ml-1 hover:bg-white/20 rounded-full p-0.5"
									>
										<X className="w-3 h-3" />
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Results Summary */}
				<div className="text-center py-4 border-t border-white/10">
					<p className="text-blue-300 text-sm">
						{totalResults} societ{totalResults !== 1 ? 'ies' : 'y'} found
					</p>
				</div>
			</div>
		</div>
	);
}