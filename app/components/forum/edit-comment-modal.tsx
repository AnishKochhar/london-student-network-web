"use client";

import { useState, useEffect, useRef } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import BaseModal from "./base-modal";
import FormTextarea from "./form-text-area";
import MarkdownEditor from "../markdown/markdown-editor";

interface EditCommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedData: { content: string }) => Promise<void>;
    initialData: {
        id: number;
        content: string;
    };
    isSubmitting?: boolean;
    type?: "comment" | "reply";
}

export default function EditCommentModal({
    isOpen,
    onClose,
    onUpdate,
    initialData,
    isSubmitting: externalSubmitting = false,
    type = "comment",
}: EditCommentModalProps) {
    const [content, setContent] = useState(initialData?.content || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isUpdating = useRef(false);

    useEffect(() => {
        if (!isUpdating.current && initialData) {
            setContent(initialData.content || "");
        }
    }, [initialData]);

    const handleSubmit = async () => {
        if (!content?.trim()) return;

        isUpdating.current = true;
        setIsSubmitting(true);

        try {
            await onUpdate({ content: content.trim() });
        } finally {
            setIsSubmitting(false);

            // Reset the flag after a brief delay
            setTimeout(() => {
                isUpdating.current = false;
            }, 500);
        }
    };

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
                disabled={!isContentValid || submitting}
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
            title={`Edit ${type === "reply" ? "Reply" : "Comment"}`}
            icon={<PencilIcon className="w-6 h-6 text-blue-400" />}
            isSubmitting={submitting}
            footer={footerContent}
        >
            <div className="space-y-6">
                <MarkdownEditor
                    value={content || ""}
                    onChange={setContent}
                    placeholder={`Your ${type === "reply" ? "reply" : "comment"}...`}
                    height={200}
                    label="Content"
                />
            </div>
        </BaseModal>
    );
}
