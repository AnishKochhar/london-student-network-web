import { useState } from "react";
import { EVENT_TAG_TYPES } from "@/app/lib/utils";
import { Button } from "../button";

interface TagsFieldProps {
    value: number;
    onChange: (newTagValue: number) => void;
}

export default function TagsField({ value, onChange }: TagsFieldProps) {
    const [selectedTags, setSelectedTags] = useState<number>(value);

    const toggleTag = (tagKey: number) => {
        const newTagValue = selectedTags ^ tagKey; // XOR to toggle the bit on or off
        setSelectedTags(newTagValue);
        onChange(newTagValue);
    };

    return (
        <div className="flex flex-col mb-4">
            <label className="text-2xl p-6 font-semibold">Event Tags</label>
            <p className="text-sm self-end text-gray-500 mb-1">
                Select all that apply
            </p>
            <div className="flex space-x-4 self-end p-3">
                {Object.keys(EVENT_TAG_TYPES).map((key) => {
                    const tagKey = parseInt(key, 10);
                    const tag = EVENT_TAG_TYPES[tagKey];
                    const isSelected = (selectedTags & tagKey) === tagKey;

                    return (
                        <Button
                            variant="outline"
                            size="md"
                            key={tagKey}
                            onClick={() => toggleTag(tagKey)}
                            className={`rounded-full px-4 py-2 ${tag.color} ${isSelected ? "border-2 border-gray-950" : "border-none"} text-white capitalize`}
                        >
                            {tag.label.toLowerCase()}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

// className={`rounded-full px-4 py-2 ${tag.color} ${isSelected ? 'border border-gray-950' : 'border-none'} text-white`}
