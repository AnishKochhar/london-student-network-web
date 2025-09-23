"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
    content: string;
    className?: string;
    components?: Record<string, React.ComponentType<never>>;
    variant?: "light" | "dark";
}

export default function MarkdownRenderer({
    content,
    className = "",
    components,
    variant = "dark",
}: MarkdownRendererProps) {
    // Check if content is already markdown or just plain text
    const hasMarkdown = /[*_`#\[\]!\-]/.test(content);

    // If it's plain text, convert line breaks to markdown line breaks
    const processedContent = hasMarkdown
        ? content
        : content.split('\n').map(line => line.trim()).join('  \n');

    // Base colors for different variants
    const textColors = variant === "light" ? {
        primary: "text-gray-900",
        secondary: "text-gray-700",
        muted: "text-gray-600",
        link: "text-blue-600",
        linkHover: "text-blue-700",
        code: "text-purple-600",
        codeBg: "bg-gray-100",
        blockquoteBorder: "border-gray-300",
        blockquoteBg: "bg-gray-50",
        tableBorder: "border-gray-300",
        tableHeaderBg: "bg-gray-100",
        hrColor: "border-gray-300"
    } : {
        primary: "text-white",
        secondary: "text-white/90",
        muted: "text-white/80",
        link: "text-blue-400",
        linkHover: "text-blue-300",
        code: "text-blue-300",
        codeBg: "bg-gray-800",
        blockquoteBorder: "border-blue-500",
        blockquoteBg: "bg-blue-900/20",
        tableBorder: "border-gray-600",
        tableHeaderBg: "bg-gray-800",
        hrColor: "border-gray-600"
    };

    return (
        <div className={`markdown-content prose max-w-none ${variant === "light" ? "" : "prose-invert"} ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize, rehypeHighlight]}
                components={{
                    // Custom components for better styling
                    h1: ({ children, ...props }) => (
                        <h1 className={`text-3xl font-bold ${textColors.primary} mb-4`} {...props}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2 className={`text-2xl font-bold ${textColors.primary} mb-3`} {...props}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3 className={`text-xl font-bold ${textColors.primary} mb-2`} {...props}>
                            {children}
                        </h3>
                    ),
                    p: ({ children, ...props }) => (
                        <p className={`${textColors.secondary} mb-4 leading-relaxed`} {...props}>
                            {children}
                        </p>
                    ),
                    ul: ({ children, ...props }) => (
                        <ul className={`list-disc list-inside ${textColors.secondary} mb-4 space-y-1`} {...props}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children, ...props }) => (
                        <ol className={`list-decimal list-inside ${textColors.secondary} mb-4 space-y-1`} {...props}>
                            {children}
                        </ol>
                    ),
                    li: ({ children, ...props }) => (
                        <li className={textColors.secondary} {...props}>
                            {children}
                        </li>
                    ),
                    blockquote: ({ children, ...props }) => (
                        <blockquote className={`border-l-4 ${textColors.blockquoteBorder} pl-4 py-2 my-4 ${textColors.blockquoteBg} italic`} {...props}>
                            {children}
                        </blockquote>
                    ),
                    code: ({ inline, className, children, ...props }: {
                        inline?: boolean;
                        className?: string;
                        children?: React.ReactNode;
                        [key: string]: unknown;
                    }) => {
                        if (inline) {
                            return (
                                <code className={`${textColors.codeBg} ${textColors.code} px-1.5 py-0.5 rounded text-sm`} {...props}>
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className={`${className} block ${variant === "light" ? "bg-gray-900 text-white" : "bg-gray-900"} p-4 rounded-lg overflow-x-auto`} {...props}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children, ...props }) => (
                        <pre className={`${variant === "light" ? "bg-gray-900" : "bg-gray-900"} p-4 rounded-lg overflow-x-auto mb-4`} {...props}>
                            {children}
                        </pre>
                    ),
                    a: ({ children, href, ...props }) => (
                        <a
                            href={href}
                            className={`${textColors.link} hover:${textColors.linkHover} underline transition-colors`}
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        >
                            {children}
                        </a>
                    ),
                    table: ({ children, ...props }) => (
                        <div className="overflow-x-auto mb-4">
                            <table className={`min-w-full border ${textColors.tableBorder}`} {...props}>
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children, ...props }) => (
                        <thead className={textColors.tableHeaderBg} {...props}>
                            {children}
                        </thead>
                    ),
                    th: ({ children, ...props }) => (
                        <th className={`border ${textColors.tableBorder} px-4 py-2 text-left ${textColors.primary}`} {...props}>
                            {children}
                        </th>
                    ),
                    td: ({ children, ...props }) => (
                        <td className={`border ${textColors.tableBorder} px-4 py-2 ${textColors.secondary}`} {...props}>
                            {children}
                        </td>
                    ),
                    hr: ({ ...props }) => (
                        <hr className={`my-6 ${textColors.hrColor}`} {...props} />
                    ),
                    strong: ({ children, ...props }) => (
                        <strong className={`font-bold ${textColors.primary}`} {...props}>
                            {children}
                        </strong>
                    ),
                    em: ({ children, ...props }) => (
                        <em className={`italic ${textColors.secondary}`} {...props}>
                            {children}
                        </em>
                    ),
                    ...components,
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}