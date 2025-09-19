"use client";
import { EVENT_TAG_TYPES } from "@/app/lib/utils";

interface TagButtonsProps {
    activeTags: number[];
    toggleTag: (tag: number) => void;
}

export default function TagButtons({ activeTags, toggleTag }: TagButtonsProps) {
    return (
        <div className="flex justify-start space-x-4 mb-4">
            {Object.keys(EVENT_TAG_TYPES).map((tag) => {
                const tagNumber = parseInt(tag, 10);
                const isActive = activeTags.includes(tagNumber);
                const { label, color } = EVENT_TAG_TYPES[tagNumber];

                return (
                    <button
                        key={tag}
                        className="flex items-center space-x-2 focus:outline-none"
                        onClick={() => toggleTag(tagNumber)}
                    >
                        <span
                            className={`w-4 h-4 rounded-full border ${color} ${isActive ? "" : "opacity-30"}`}
                        />

                        <span
                            className={`text-lg capitalize ${isActive ? "text-white" : "text-gray-400 line-through"}`}
                        >
                            {label.toLowerCase()}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
