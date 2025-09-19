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
        <div className="absolute top-1 right-2 flex space-x-1">
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className={`w-5 h-5 rounded-full ${tag.color} border-white border-2 drop-shadow-sm`}
                    title={tag.label}
                ></span>
            ))}
        </div>
    );
}
