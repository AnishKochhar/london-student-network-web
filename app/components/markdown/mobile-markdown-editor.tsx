"use client";

import { useState, useRef } from "react";
import { BoldIcon, ItalicIcon, LinkIcon, EyeIcon, EditIcon } from "lucide-react";
import MarkdownRenderer from "./markdown-renderer";

interface MobileMarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: number;
    className?: string;
    variant?: "light" | "dark";
}

type ViewMode = "write" | "preview";

export default function MobileMarkdownEditor({
    value,
    onChange,
    placeholder = "Enter your content here...",
    height = 120,
    className = "",
    variant = "dark",
}: MobileMarkdownEditorProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("write");
    const [focused, setFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Simplified mobile toolbar with most essential items
    const insertMarkdown = (syntax: string, defaultText: string = "text") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || defaultText;

        let newText = "";
        let cursorOffset = 0;

        switch (syntax) {
            case "**":
                newText = `**${selectedText}**`;
                cursorOffset = selectedText === defaultText ? 2 : newText.length;
                break;
            case "*":
                newText = `*${selectedText}*`;
                cursorOffset = selectedText === defaultText ? 1 : newText.length;
                break;
            case "[link]":
                newText = `[${selectedText}](url)`;
                cursorOffset = newText.length - 1;
                break;
            default:
                newText = selectedText;
                cursorOffset = newText.length;
        }

        const newValue = value.substring(0, start) + newText + value.substring(end);
        onChange(newValue);

        // Reset cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
        }, 0);
    };

    return (
        <div className={`markdown-editor-mobile ${className}`}>
            <div className={`border border-white/20 rounded-lg overflow-hidden bg-white/5 backdrop-blur ${focused ? 'ring-2 ring-blue-500 border-transparent' : ''}`}>
                {/* Simplified Tab Bar for Mobile */}
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-2">
                    <div className="flex">
                        <button
                            type="button"
                            onClick={() => setViewMode("write")}
                            className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                                viewMode === "write"
                                    ? "text-white border-b-2 border-blue-500"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <EditIcon className="w-3 h-3" />
                            Write
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("preview")}
                            className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                                viewMode === "preview"
                                    ? "text-white border-b-2 border-blue-500"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <EyeIcon className="w-3 h-3" />
                            Preview
                        </button>
                    </div>

                    {/* Essential toolbar for mobile */}
                    {viewMode === "write" && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => insertMarkdown("**", "bold")}
                                title="Bold"
                                className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/70 hover:text-white"
                            >
                                <BoldIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdown("*", "italic")}
                                title="Italic"
                                className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/70 hover:text-white"
                            >
                                <ItalicIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdown("[link]", "link text")}
                                title="Link"
                                className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/70 hover:text-white"
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="relative" style={{ height }}>
                    {/* Write Mode */}
                    {viewMode === "write" && (
                        <div className="relative h-full">
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                placeholder={placeholder}
                                className="w-full h-full p-3 bg-transparent text-white placeholder-white/40 focus:outline-none resize-none text-sm leading-relaxed"
                                style={{ minHeight: height }}
                            />
                        </div>
                    )}

                    {/* Preview Mode */}
                    {viewMode === "preview" && (
                        <div className="h-full overflow-auto p-3">
                            {value ? (
                                <MarkdownRenderer content={value} className="prose-sm" variant={variant} />
                            ) : (
                                <p className={`${variant === "light" ? "text-gray-400" : "text-white/40"} italic text-sm`}>Nothing to preview</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Simplified Footer for Mobile */}
                <div className="border-t border-white/10 px-3 py-1.5 flex items-center justify-between text-xs text-white/50">
                    <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M14.85 3c.63 0 1.15.52 1.14 1.15v7.7c0 .63-.51 1.15-1.15 1.15H1.15C.52 13 0 12.48 0 11.84V4.15C0 3.52.52 3 1.15 3ZM9 11V5H7L5.5 7 4 5v6h1.5V8l1.5 1.5L8.5 8v3Zm2.99.5L14.5 8H13V5h-2v3H9.5Z"/>
                        </svg>
                        Markdown
                    </div>
                    <span>{value.length}</span>
                </div>
            </div>
        </div>
    );
}