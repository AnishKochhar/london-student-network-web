"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PlusIcon, TagIcon } from "@heroicons/react/24/outline";
import BaseModal from "./base-modal";
import * as threadService from "@/app/lib/services/thread-service";
import { ThreadData } from "@/app/lib/types";
import MarkdownEditor from "../markdown/markdown-editor";

interface NewThreadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onThreadCreated?: (newThread: ThreadData) => void;
    isSubmitting?: boolean;
}

export default function NewThreadModal({
    isOpen,
    onClose,
    onThreadCreated,
    isSubmitting: externalSubmitting = false,
}: NewThreadModalProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Handle client-side only rendering for createPortal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Reset form when modal is opened/closed
    useEffect(() => {
        if (!isOpen) {
            setTitle("");
            setContent("");
            setTags([]);
            setTagInput("");
        }
    }, [isOpen]);

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
            setTags([...tags, tagInput.trim().toLowerCase()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleSubmit = async () => {
        if (title.trim() && content.trim()) {
            setIsSubmitting(true);

            try {
                const newThread = await threadService.createThread({
                    title: title.trim(),
                    content: content.trim(),
                    tags,
                });

                if (newThread) {
                    if (onThreadCreated) {
                        onThreadCreated(newThread);
                    }
                    onClose();
                }
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAddTag();
        }
    };

    const submitting = isSubmitting || externalSubmitting;

    const footerContent = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors text-sm sm:text-base"
                disabled={submitting}
            >
                Cancel
            </button>
            <button
                type="submit"
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || submitting}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed border border-blue-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
                {submitting ? (
                    <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Creating...</span>
                        <span className="sm:hidden">Create</span>
                    </>
                ) : (
                    <>
                        <span className="hidden sm:inline">Create Thread</span>
                        <span className="sm:hidden">Create</span>
                    </>
                )}
            </button>
        </>
    );

    if (!isOpen || !mounted) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Start New Thread"
            icon={<PlusIcon className="w-6 h-6 text-blue-400" />}
            isSubmitting={submitting}
            footer={footerContent}
        >
            <div className="space-y-4 sm:space-y-6">
                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                        Thread Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's your question or topic?"
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base"
                        required
                        disabled={submitting}
                    />
                </div>

                {/* Content Markdown Editor */}
                <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Describe your question or share your thoughts in detail..."
                    height={200}
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
                            className="flex-1 px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base"
                            disabled={submitting}
                        />
                        <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600/30 border border-blue-400/30 rounded-lg text-blue-300 hover:bg-blue-600/50 transition-colors text-sm sm:text-base"
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
