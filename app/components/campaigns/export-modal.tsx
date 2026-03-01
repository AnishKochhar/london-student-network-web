"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    XMarkIcon,
    ArrowDownTrayIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    TableCellsIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { EmailContact } from "@/app/lib/campaigns/types";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    contacts: EmailContact[];
    selectedCount?: number;
    categoryName?: string;
}

type ExportFormat = "clipboard" | "csv" | "xlsx";
type ExportFields = "emails" | "basic" | "all";

export default function ExportModal({
    isOpen,
    onClose,
    contacts,
    selectedCount = 0,
    categoryName,
}: ExportModalProps) {
    const [format, setFormat] = useState<ExportFormat>("clipboard");
    const [fields, setFields] = useState<ExportFields>("emails");
    const [isExporting, setIsExporting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const reset = () => {
        setFormat("clipboard");
        setFields("emails");
        setSuccess(false);
        setSuccessMessage("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const getExportData = () => {
        if (fields === "emails") {
            return contacts.map((c) => ({ email: c.email }));
        }

        if (fields === "basic") {
            return contacts.map((c) => ({
                email: c.email,
                name: c.name || "",
                organization: c.organization || "",
            }));
        }

        return contacts.map((c) => ({
            email: c.email,
            name: c.name || "",
            organization: c.organization || "",
            category: c.categoryPath || c.categoryName || "",
            status: c.status,
            tags: c.tags.join(", "),
            lastEmailed: c.lastEmailedAt || "Never",
            createdAt: c.createdAt,
            source: c.source,
        }));
    };

    // For emails-only clipboard, we want a simple line-by-line format
    const getEmailsOnlyText = () => {
        return contacts.map((c) => c.email).join("\n");
    };

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const data = getExportData();

            if (format === "clipboard") {
                let clipboardText: string;

                if (fields === "emails") {
                    // Simple line-by-line email list for easy paste
                    clipboardText = getEmailsOnlyText();
                } else {
                    // Create tab-separated values for clipboard
                    const headers = Object.keys(data[0] || {});
                    const rows = data.map((row) =>
                        headers.map((h) => row[h as keyof typeof row] || "").join("\t")
                    );
                    clipboardText = [headers.join("\t"), ...rows].join("\n");
                }

                await navigator.clipboard.writeText(clipboardText);
                setSuccessMessage(`${data.length} ${fields === "emails" ? "emails" : "contacts"} copied to clipboard!`);
            } else if (format === "csv") {
                // Create CSV
                const headers = Object.keys(data[0] || {});
                const csvRows = [
                    headers.join(","),
                    ...data.map((row) =>
                        headers
                            .map((h) => {
                                const value = String(row[h as keyof typeof row] || "");
                                // Escape quotes and wrap in quotes if contains comma
                                if (value.includes(",") || value.includes('"')) {
                                    return `"${value.replace(/"/g, '""')}"`;
                                }
                                return value;
                            })
                            .join(",")
                    ),
                ];
                const csvContent = csvRows.join("\n");

                // Download
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setSuccessMessage(`${data.length} contacts exported to CSV!`);
            } else if (format === "xlsx") {
                // Create Excel file
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Contacts");

                // Download
                XLSX.writeFile(wb, `contacts-${new Date().toISOString().split("T")[0]}.xlsx`);
                setSuccessMessage(`${data.length} contacts exported to Excel!`);
            }

            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    if (typeof window === "undefined" || !isOpen) return null;

    const contactCount = selectedCount > 0 ? selectedCount : contacts.length;
    const exportLabel = selectedCount > 0 ? "selected contacts" : categoryName ? `contacts in "${categoryName}"` : "all contacts";

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <ArrowDownTrayIcon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Export Contacts</h2>
                                        <p className="text-sm text-white/50">
                                            {contactCount} {exportLabel}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 -m-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircleIcon className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Export Complete</h3>
                                    <p className="text-white/50">{successMessage}</p>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="p-5 space-y-5">
                                        {/* Export Format */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-white/70 mb-3">
                                                Export Format
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => setFormat("clipboard")}
                                                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                                                        format === "clipboard"
                                                            ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                                                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <ClipboardDocumentIcon className="w-6 h-6" />
                                                    <span className="text-xs font-medium">Clipboard</span>
                                                </button>
                                                <button
                                                    onClick={() => setFormat("csv")}
                                                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                                                        format === "csv"
                                                            ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                                                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <TableCellsIcon className="w-6 h-6" />
                                                    <span className="text-xs font-medium">CSV</span>
                                                </button>
                                                <button
                                                    onClick={() => setFormat("xlsx")}
                                                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                                                        format === "xlsx"
                                                            ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                                                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <TableCellsIcon className="w-6 h-6" />
                                                    <span className="text-xs font-medium">Excel</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Fields to Export */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-white/70 mb-3">
                                                Fields to Export
                                            </label>
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => setFields("emails")}
                                                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                                                        fields === "emails"
                                                            ? "bg-indigo-500/20 border-indigo-500/50"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                        fields === "emails" ? "border-indigo-500" : "border-white/30"
                                                    }`}>
                                                        {fields === "emails" && (
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Emails Only</p>
                                                        <p className="text-xs text-white/50 mt-0.5">
                                                            Simple list of email addresses (one per line)
                                                        </p>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setFields("basic")}
                                                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                                                        fields === "basic"
                                                            ? "bg-indigo-500/20 border-indigo-500/50"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                        fields === "basic" ? "border-indigo-500" : "border-white/30"
                                                    }`}>
                                                        {fields === "basic" && (
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Basic</p>
                                                        <p className="text-xs text-white/50 mt-0.5">
                                                            Email, Name, Organization
                                                        </p>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setFields("all")}
                                                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                                                        fields === "all"
                                                            ? "bg-indigo-500/20 border-indigo-500/50"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                        fields === "all" ? "border-indigo-500" : "border-white/30"
                                                    }`}>
                                                        {fields === "all" && (
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">All Fields</p>
                                                        <p className="text-xs text-white/50 mt-0.5">
                                                            Includes category, status, tags, dates, source
                                                        </p>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10 bg-black/20">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="px-4 py-2.5 bg-white/10 text-white/80 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleExport}
                                            disabled={isExporting || contacts.length === 0}
                                            className="px-4 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isExporting ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                            fill="none"
                                                        />
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        />
                                                    </svg>
                                                    Exporting...
                                                </>
                                            ) : format === "clipboard" ? (
                                                <>
                                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                                    Copy to Clipboard
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                                    Download {format.toUpperCase()}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
