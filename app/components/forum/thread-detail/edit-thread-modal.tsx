"use client";

import { useState, useEffect, useRef } from "react";
import { PencilIcon, TagIcon } from "@heroicons/react/24/outline";
import BaseModal from "../base-modal";
import FormTextarea from "../form-text-area";
import { XMarkIcon } from "@heroicons/react/24/outline";
import MarkdownEditor from "../../markdown/markdown-editor";

interface EditThreadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedData: {
        title: string;
        content: string;
        tags: string[];
    }) => Promise<void>;
    initialData: {
        id: number;
        title: string;
        content: string;
        tags: string[];
    };
    isSubmitting?: boolean;
}

export default function EditThreadModal({
    isOpen,
    onClose,
    onUpdate,
    initialData,
    isSubmitting: externalSubmitting = false,
}: EditThreadModalProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isUpdating = useRef(false);

    useEffect(() => {
        if (!isUpdating.current && initialData) {
            setTitle(initialData.title || "");
            setContent(initialData.content || "");
            setTags(initialData.tags || []);
        }
    }, [initialData]);

    const handleAddTag = () => {
        if (tagInput?.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
            setTags([...tags, tagInput.trim().toLowerCase()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSubmit = async () => {
        if (!title?.trim() || !content?.trim()) return;

        isUpdating.current = true;
        setIsSubmitting(true);

        try {
            await onUpdate({
                title: title.trim(),
                content: content.trim(),
                tags,
            });
        } finally {
            setIsSubmitting(false);

            // Reset the flag after a brief delay
            setTimeout(() => {
                isUpdating.current = false;
            }, 500);
        }
    };

    const isTitleValid = title?.trim() ? true : false;
    const isContentValid = content?.trim() ? true : false;
    const submitting = isSubmitting || externalSubmitting;

    const footerContent = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors"
                disabled={submitting}
            >
                Cancel
            </button>
            <button
                type="submit"
                onClick={handleSubmit}
                disabled={!isTitleValid || !isContentValid || submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed border border-blue-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
                {submitting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
                        Updating...
                    </>
                ) : (
                    "Save Changes"
                )}
            </button>
        </>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Thread"
            icon={<PencilIcon className="w-6 h-6 text-blue-400" />}
            isSubmitting={submitting}
            footer={footerContent}
        >
            <div className="space-y-6">
                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                        Thread Title
                    </label>
                    <input
                        type="text"
                        value={title || ""}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's your question or topic?"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        required
                        disabled={submitting}
                    />
                </div>

                {/* Content Markdown Editor */}
                <MarkdownEditor
                    value={content || ""}
                    onChange={setContent}
                    placeholder="Describe your question or share your thoughts in detail..."
                    height={250}
                    label="Content"
                />

                {/* Tags Section */}
                <div>
                    <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                        <TagIcon className="w-4 h-4" />
                        Tags
                    </label>

                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add a tag..."
                            className="flex-1 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            disabled={submitting}
                        />
                        <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-blue-600/30 border border-blue-400/30 rounded-lg text-blue-300 hover:bg-blue-600/50 transition-colors"
                            disabled={submitting}
                        >
                            Add
                        </button>
                    </div>

                    {/* Tag Display */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-2 px-3 py-1 bg-blue-600/30 border border-blue-400/30 rounded-full text-sm text-blue-300"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-red-300 transition-colors"
                                        disabled={submitting}
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
}
