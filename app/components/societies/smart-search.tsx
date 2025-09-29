"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { searchTags } from "@/app/utils/tag-categories";

interface SmartSearchProps {
	value: string;
	onChange: (value: string) => void;
	onTagSelect?: (tagValue: number) => void;
	placeholder?: string;
}

export default function SmartSearch({
	value,
	onChange,
	onTagSelect,
	placeholder = "Search societies..."
}: SmartSearchProps) {
	const [suggestions, setSuggestions] = useState<Array<{ value: number, label: string, category: string }>>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);

	// Generate suggestions based on input
	useEffect(() => {
		if (value.trim().length >= 2) {
			const tagSuggestions = searchTags(value.trim()).slice(0, 8);
			setSuggestions(tagSuggestions);
			setShowSuggestions(tagSuggestions.length > 0);
			setSelectedIndex(-1);
		} else {
			setSuggestions([]);
			setShowSuggestions(false);
		}
	}, [value]);

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!showSuggestions || suggestions.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setSelectedIndex(prev =>
					prev < suggestions.length - 1 ? prev + 1 : prev
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedIndex >= 0 && suggestions[selectedIndex]) {
					handleSuggestionSelect(suggestions[selectedIndex]);
				}
				break;
			case 'Escape':
				setShowSuggestions(false);
				setSelectedIndex(-1);
				inputRef.current?.blur();
				break;
		}
	};

	// Handle suggestion selection
	const handleSuggestionSelect = (suggestion: { value: number, label: string, category: string }) => {
		onChange(suggestion.label);
		if (onTagSelect) {
			onTagSelect(suggestion.value);
		}
		setShowSuggestions(false);
		setSelectedIndex(-1);
		inputRef.current?.blur();
	};

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(event.target as Node) &&
				!inputRef.current?.contains(event.target as Node)
			) {
				setShowSuggestions(false);
				setSelectedIndex(-1);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const getCategoryColor = (category: string) => {
		const colorMap: Record<string, string> = {
			'academic': 'text-blue-400',
			'technology': 'text-purple-400',
			'business': 'text-green-400',
			'arts-creative': 'text-pink-400',
			'sports-fitness': 'text-orange-400',
			'social-cultural': 'text-teal-400',
			'gaming-entertainment': 'text-indigo-400',
			'community-wellness': 'text-red-400',
			'science-research': 'text-cyan-400'
		};
		return colorMap[category] || 'text-gray-400';
	};

	const getCategoryIcon = (category: string) => {
		const iconMap: Record<string, string> = {
			'academic': '🎓',
			'technology': '💻',
			'business': '💼',
			'arts-creative': '🎨',
			'sports-fitness': '⚽',
			'social-cultural': '🌍',
			'gaming-entertainment': '🎮',
			'community-wellness': '❤️',
			'science-research': '🔬'
		};
		return iconMap[category] || '🏷️';
	};

	return (
		<div className="relative w-full">
			{/* Search Input */}
			<div className="relative">
				<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<Search className="h-5 w-5 text-blue-300" />
				</div>
				<input
					ref={inputRef}
					type="text"
					placeholder={placeholder}
					className="w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={() => {
						if (suggestions.length > 0) {
							setShowSuggestions(true);
						}
					}}
				/>
				{value && (
					<button
						onClick={() => {
							onChange("");
							setShowSuggestions(false);
						}}
						className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				)}
			</div>

			{/* Suggestions Dropdown */}
			{showSuggestions && suggestions.length > 0 && (
				<div
					ref={suggestionsRef}
					className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto"
				>
					<div className="p-2">
						<div className="text-xs text-gray-400 px-3 py-2 border-b border-white/10">
							Tag suggestions
						</div>
						{suggestions.map((suggestion, index) => (
							<button
								key={`${suggestion.value}-${index}`}
								onClick={() => handleSuggestionSelect(suggestion)}
								className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 ${index === selectedIndex
										? 'bg-blue-500/20 text-blue-300'
										: 'hover:bg-white/10 text-gray-300'
									}`}
							>
								<span className="text-lg">
									{getCategoryIcon(suggestion.category)}
								</span>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm">
										{suggestion.label}
									</div>
									<div className={`text-xs capitalize ${getCategoryColor(suggestion.category)}`}>
										{suggestion.category.replace('-', ' & ')}
									</div>
								</div>
								<div className="text-xs text-gray-500">
									Tag
								</div>
							</button>
						))}
					</div>

					{/* Search Tips */}
					<div className="border-t border-white/10 p-3">
						<div className="text-xs text-gray-500">
							💡 Tip: Use <kbd className="bg-white/10 px-1 rounded">↑↓</kbd> to navigate, <kbd className="bg-white/10 px-1 rounded">Enter</kbd> to select
						</div>
					</div>
				</div>
			)}
		</div>
	);
}