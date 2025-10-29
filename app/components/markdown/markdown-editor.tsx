"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    BoldIcon,
    ItalicIcon,
    ListIcon,
    ListOrderedIcon,
    QuoteIcon,
    LinkIcon,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    MinusIcon,
    EyeIcon,
    EditIcon,
    SplitIcon
} from "lucide-react";
import MarkdownRenderer from "./markdown-renderer";
import MobileMarkdownEditor from "./mobile-markdown-editor";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: number;
    className?: string;
    label?: string;
    variant?: "light" | "dark";
}

type ViewMode = "write" | "preview" | "split";

interface ToolbarButton {
    icon: React.ReactNode;
    title: string;
    action: () => void;
    divider?: boolean;
}

export default function MarkdownEditor({
    value,
    onChange,
    placeholder = "Enter your content here...",
    height = 300,
    className = "",
    label,
    variant = "dark",
}: MarkdownEditorProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("write");
    const [focused, setFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Insert markdown syntax
    const insertMarkdown = useCallback((syntax: string, defaultText: string = "text") => {
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
            case "# ":
                newText = `# ${selectedText}`;
                cursorOffset = newText.length;
                break;
            case "## ":
                newText = `## ${selectedText}`;
                cursorOffset = newText.length;
                break;
            case "### ":
                newText = `### ${selectedText}`;
                cursorOffset = newText.length;
                break;
            case "- ":
                newText = `- ${selectedText}`;
                cursorOffset = newText.length;
                break;
            case "1. ":
                newText = `1. ${selectedText}`;
                cursorOffset = newText.length;
                break;
            case "> ":
                newText = `> ${selectedText}`;
                cursorOffset = newText.length;
                break;
            case "---":
                newText = `\n---\n`;
                cursorOffset = newText.length;
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
    }, [value, onChange]);

    const toolbarButtons: ToolbarButton[] = [
        {
            icon: <Heading1Icon className="w-4 h-4" />,
            title: "Heading 1",
            action: () => insertMarkdown("# ", "Heading"),
        },
        {
            icon: <Heading2Icon className="w-4 h-4" />,
            title: "Heading 2",
            action: () => insertMarkdown("## ", "Heading"),
        },
        {
            icon: <Heading3Icon className="w-4 h-4" />,
            title: "Heading 3",
            action: () => insertMarkdown("### ", "Heading"),
        },
        {
            icon: <BoldIcon className="w-4 h-4" />,
            title: "Bold",
            action: () => insertMarkdown("**", "bold text"),
            divider: true,
        },
        {
            icon: <ItalicIcon className="w-4 h-4" />,
            title: "Italic",
            action: () => insertMarkdown("*", "italic text"),
        },
        {
            icon: <QuoteIcon className="w-4 h-4" />,
            title: "Quote",
            action: () => insertMarkdown("> ", "quote"),
            divider: true,
        },
        {
            icon: <ListIcon className="w-4 h-4" />,
            title: "Unordered List",
            action: () => insertMarkdown("- ", "list item"),
        },
        {
            icon: <ListOrderedIcon className="w-4 h-4" />,
            title: "Ordered List",
            action: () => insertMarkdown("1. ", "list item"),
        },
        {
            icon: <MinusIcon className="w-4 h-4" />,
            title: "Horizontal Rule",
            action: () => insertMarkdown("---", ""),
            divider: true,
        },
        {
            icon: <LinkIcon className="w-4 h-4" />,
            title: "Link",
            action: () => insertMarkdown("[link]", "link text"),
        },
    ];

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!focused) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b':
                        e.preventDefault();
                        insertMarkdown("**", "bold text");
                        break;
                    case 'i':
                        e.preventDefault();
                        insertMarkdown("*", "italic text");
                        break;
                    case 'k':
                        e.preventDefault();
                        insertMarkdown("[link]", "link text");
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focused, insertMarkdown]);

    return (
        <div className={`markdown-editor-container ${className}`}>
            <style jsx>{`
                .scrollbar-none {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .scrollbar-none::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            {label && (
                <label className="block text-sm font-medium text-white/90 mb-2">
                    {label}
                </label>
            )}

            {/* Mobile Editor for small screens */}
            <div className="block sm:hidden">
                <MobileMarkdownEditor
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    height={height}
                    variant={variant}
                />
            </div>

            {/* Desktop Editor for larger screens */}
            <div className="hidden sm:block">

            <div className={`border border-white/20 rounded-lg overflow-hidden bg-white/5 backdrop-blur ${focused ? 'ring-2 ring-blue-500 border-transparent' : ''}`}>
                {/* Tab Bar */}
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5">
                    <div className="flex">
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setViewMode("write")}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                                viewMode === "write"
                                    ? "text-white border-b-2 border-blue-500"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <EditIcon className="w-4 h-4" />
                            Write
                        </button>
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setViewMode("preview")}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                                viewMode === "preview"
                                    ? "text-white border-b-2 border-blue-500"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <EyeIcon className="w-4 h-4" />
                            Preview
                        </button>
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setViewMode("split")}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 hidden md:flex ${
                                viewMode === "split"
                                    ? "text-white border-b-2 border-blue-500"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <SplitIcon className="w-4 h-4" />
                            Split
                        </button>
                    </div>

                    {/* Toolbar - only show in write mode */}
                    {(viewMode === "write" || viewMode === "split") && (
                        <div className="flex items-center gap-1 px-2 overflow-x-auto scrollbar-none">
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {toolbarButtons.map((button, index) => (
                                    <div key={index} className="flex items-center">
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={button.action}
                                            title={button.title}
                                            className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/70 hover:text-white flex-shrink-0"
                                        >
                                            {button.icon}
                                        </button>
                                        {button.divider && index < toolbarButtons.length - 1 && (
                                            <div className="w-px h-5 bg-white/20 mx-1 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className={`relative ${viewMode === "split" ? "grid grid-cols-2 divide-x divide-white/10" : ""}`} style={{ height }}>
                    {/* Write Mode */}
                    {(viewMode === "write" || viewMode === "split") && (
                        <div className="relative h-full">
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                placeholder={placeholder}
                                className="w-full h-full p-4 bg-transparent text-white placeholder-white/40 focus:outline-none resize-none font-mono text-sm"
                                style={{ minHeight: height }}
                            />
                        </div>
                    )}

                    {/* Preview Mode */}
                    {(viewMode === "preview" || viewMode === "split") && (
                        <div className="h-full overflow-auto p-4">
                            {value ? (
                                <MarkdownRenderer content={value} className="prose-sm" variant={variant} />
                            ) : (
                                <p className={`${variant === "light" ? "text-gray-400" : "text-white/40"} italic`}>Nothing to preview</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-white/50">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M14.85 3c.63 0 1.15.52 1.14 1.15v7.7c0 .63-.51 1.15-1.15 1.15H1.15C.52 13 0 12.48 0 11.84V4.15C0 3.52.52 3 1.15 3ZM9 11V5H7L5.5 7 4 5v6h1.5V8l1.5 1.5L8.5 8v3Zm2.99.5L14.5 8H13V5h-2v3H9.5Z"/>
                            </svg>
                            Markdown is supported
                        </span>
                        {(viewMode === "write" || viewMode === "split") && (
                            <span className="hidden sm:inline">
                                Use <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">B</kbd> for bold,
                                {" "}<kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">I</kbd> for italic
                            </span>
                        )}
                    </div>
                    <span>{value.length} characters</span>
                </div>
            </div>
            </div>
        </div>
    );
}