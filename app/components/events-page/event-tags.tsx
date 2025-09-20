import { EVENT_TAG_TYPES } from "@/app/lib/utils";

interface EventCardTagsProps {
    eventType: number;
}

export default function EventCardTags({ eventType }: EventCardTagsProps) {
    const tags = Object.keys(EVENT_TAG_TYPES)
        .map(Number)
        .filter((key) => eventType & key)
        .map((key) => EVENT_TAG_TYPES[key]);

    return (
        <div className="absolute top-2 right-2 flex gap-1 z-10 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1">
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className={`w-4 h-4 rounded-full ${tag.color} opacity-100`}
                    title={tag.label}
                ></span>
            ))}
        </div>
    );
}
