"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TAG_CATEGORIES } from "@/app/utils/tag-categories";

interface CategoryTagsSelectProps {
    value: number[];
    onChange: (selectedTags: number[]) => void;
    maxTags?: number;
}

export default function CategoryTagsSelect({
    value = [],
    onChange,
    maxTags = 3,
}: CategoryTagsSelectProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const toggleTag = (tagValue: number) => {
        const isSelected = value.includes(tagValue);

        if (isSelected) {
            // Remove tag
            onChange(value.filter(tag => tag !== tagValue));
        } else {
            // Add tag (if under limit)
            if (value.length < maxTags) {
                onChange([...value, tagValue]);
            }
        }
    };

    const getSelectedTagsInfo = () => {
        return value.map(tagValue => {
            for (const category of TAG_CATEGORIES) {
                const tag = category.tags.find(t => t.value === tagValue);
                if (tag) {
                    return { ...tag, categoryName: category.name, categoryColor: category.color };
                }
            }
            return null;
        }).filter(Boolean);
    };

    const selectedTagsInfo = getSelectedTagsInfo();

    return (
        <div className="space-y-4">
            {/* Selected tags display */}
            {selectedTagsInfo.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                        Selected tags ({selectedTagsInfo.length}/{maxTags}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedTagsInfo.map(tagInfo => (
                            <div
                                key={tagInfo.value}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${tagInfo.categoryColor}`}
                            >
                                <span>{tagInfo.label}</span>
                                <button
                                    type="button"
                                    onClick={() => toggleTag(tagInfo.value)}
                                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                                >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category selection */}
            <div className="space-y-2">
                <p className="text-sm text-gray-300">Choose from categories:</p>
                {TAG_CATEGORIES.map(category => (
                    <div key={category.id}>
                        {/* Category Button */}
                        <button
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-left"
                        >
                            <span className="text-lg">{category.icon}</span>
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">{category.name}</div>
                                <div className="text-xs opacity-75">
                                    {category.tags.length} tags
                                </div>
                            </div>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                    expandedCategories.includes(category.id) ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {/* Expanded Tags */}
                        <AnimatePresence>
                            {expandedCategories.includes(category.id) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10"
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {category.tags.map(tag => {
                                            const isSelected = value.includes(tag.value);
                                            const isDisabled = !isSelected && value.length >= maxTags;

                                            return (
                                                <button
                                                    key={tag.value}
                                                    type="button"
                                                    onClick={() => !isDisabled && toggleTag(tag.value)}
                                                    disabled={isDisabled}
                                                    className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${
                                                        isSelected
                                                            ? 'bg-blue-500 text-white'
                                                            : isDisabled
                                                            ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                    }`}
                                                >
                                                    {tag.label}
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {value.length >= maxTags && (
                <p className="text-xs text-yellow-400">
                    You've reached the maximum of {maxTags} tags. Remove a tag to select a different one.
                </p>
            )}
        </div>
    );
}