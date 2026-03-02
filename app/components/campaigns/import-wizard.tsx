"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpTrayIcon,
    CheckIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    TableCellsIcon,
    ClipboardDocumentIcon,
    FolderIcon,
    FolderOpenIcon,
    ChevronRightIcon,
    PlusIcon,
    HomeIcon,
    InboxIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { ImportContact, ImportResult } from "@/app/lib/campaigns/types";

// Category node type (matches category-tree.tsx)
interface CategoryNode {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    color: string;
    icon: string;
    contactCount: number;
    children: CategoryNode[];
}

interface ImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (contacts: ImportContact[], categoryId: string | null) => Promise<ImportResult>;
    categories: CategoryNode[];
    onAddCategory?: (parentId: string | null, name: string) => Promise<CategoryNode | null>;
}

type Step = "upload" | "map" | "category" | "review";

interface ParsedData {
    headers: string[];
    rows: string[][];
    preview: ImportContact[];
    sourceType: "csv" | "xlsx" | "paste";
}

interface ColumnMapping {
    email: number;
    name: number;
    organization: number;
}

interface ImportError {
    row: number;
    message: string;
}

type UploadTab = "file" | "paste";

// Helper to get total contacts including children
function getTotalContacts(category: CategoryNode): number {
    const childrenTotal = category.children.reduce(
        (sum, child) => sum + getTotalContacts(child),
        0
    );
    return category.contactCount + childrenTotal;
}

export default function ImportWizard({
    isOpen,
    onClose,
    onImport,
    categories,
    onAddCategory,
}: ImportWizardProps) {
    const [step, setStep] = useState<Step>("upload");
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
        email: -1,
        name: -1,
        organization: -1,
    });
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [pasteContent, setPasteContent] = useState("");
    const [uploadTab, setUploadTab] = useState<UploadTab>("file");
    const [parseErrors, setParseErrors] = useState<ImportError[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Category navigation state
    const [categoryPath, setCategoryPath] = useState<CategoryNode[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const steps: Step[] = ["upload", "map", "category", "review"];
    const currentStepIndex = steps.indexOf(step);

    // Get current level categories based on navigation path
    const currentCategories = useMemo(() => {
        if (categoryPath.length === 0) {
            return categories;
        }
        const currentParent = categoryPath[categoryPath.length - 1];
        return currentParent.children;
    }, [categories, categoryPath]);

    // Get selected category object
    const selectedCategory = useMemo(() => {
        if (!selectedCategoryId) return null;
        const findCategory = (cats: CategoryNode[]): CategoryNode | null => {
            for (const cat of cats) {
                if (cat.id === selectedCategoryId) return cat;
                const found = findCategory(cat.children);
                if (found) return found;
            }
            return null;
        };
        return findCategory(categories);
    }, [selectedCategoryId, categories]);

    // Navigate into a category
    const navigateInto = (category: CategoryNode) => {
        if (category.children.length > 0) {
            setCategoryPath([...categoryPath, category]);
        }
    };

    // Navigate back via breadcrumb
    const navigateTo = (index: number) => {
        if (index < 0) {
            setCategoryPath([]);
        } else {
            setCategoryPath(categoryPath.slice(0, index + 1));
        }
    };

    // Handle add new category
    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !onAddCategory) return;
        const parentId = categoryPath.length > 0
            ? categoryPath[categoryPath.length - 1].id
            : null;
        const newCat = await onAddCategory(parentId, newCategoryName.trim());
        if (newCat) {
            setSelectedCategoryId(newCat.id);
        }
        setNewCategoryName("");
        setIsAddingCategory(false);
    };

    const reset = () => {
        setStep("upload");
        setParsedData(null);
        setColumnMapping({ email: -1, name: -1, organization: -1 });
        setSelectedCategoryId(null);
        setResult(null);
        setPasteContent("");
        setUploadTab("file");
        setParseErrors([]);
        setIsDragging(false);
        setCategoryPath([]);
        setIsAddingCategory(false);
        setNewCategoryName("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Auto-detect column mapping from headers
    const autoDetectMapping = useCallback((headers: string[]) => {
        const emailIdx = headers.findIndex((h) =>
            h.toLowerCase().includes("email")
        );
        const nameIdx = headers.findIndex((h) =>
            (h.toLowerCase().includes("name") || h.toLowerCase() === "contact") &&
            !h.toLowerCase().includes("org") &&
            !h.toLowerCase().includes("company")
        );
        const orgIdx = headers.findIndex((h) =>
            h.toLowerCase().includes("org") ||
            h.toLowerCase().includes("society") ||
            h.toLowerCase().includes("company") ||
            h.toLowerCase().includes("club")
        );

        setColumnMapping({
            email: emailIdx >= 0 ? emailIdx : 0,
            name: nameIdx >= 0 ? nameIdx : -1,
            organization: orgIdx >= 0 ? orgIdx : -1,
        });
    }, []);

    // Parse CSV content
    const parseCSV = useCallback((content: string): ParsedData => {
        const lines = content.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        const rows = lines.slice(1)
            .filter(line => line.trim()) // Skip empty lines
            .map((line) =>
                line.split(",").map((cell) => cell.trim().replace(/"/g, ""))
            );

        autoDetectMapping(headers);
        return { headers, rows, preview: [], sourceType: "csv" };
    }, [autoDetectMapping]);

    // Parse XLSX content
    const parseXLSX = useCallback((data: ArrayBuffer): ParsedData => {
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

        if (jsonData.length === 0) {
            return { headers: [], rows: [], preview: [], sourceType: "xlsx" };
        }

        // First row is headers
        const headers = (jsonData[0] || []).map(h => String(h || "").trim());
        const rows = jsonData.slice(1)
            .filter(row => row && row.some(cell => cell)) // Skip completely empty rows
            .map(row => row.map(cell => String(cell || "").trim()));

        autoDetectMapping(headers);
        return { headers, rows, preview: [], sourceType: "xlsx" };
    }, [autoDetectMapping]);

    // Process a file (CSV or XLSX)
    const processFile = useCallback((file: File) => {
        setParseErrors([]);
        const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
        const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") ||
            file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.type === "application/vnd.ms-excel";

        if (!isCSV && !isXLSX) {
            setParseErrors([{ row: 0, message: "Unsupported file type. Please upload a CSV or Excel file." }]);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (isCSV) {
                    const content = event.target?.result as string;
                    const data = parseCSV(content);
                    if (data.rows.length === 0) {
                        setParseErrors([{ row: 0, message: "No data found in file. Make sure the file has headers and at least one row of data." }]);
                        return;
                    }
                    setParsedData(data);
                    setStep("map");
                } else {
                    const data = event.target?.result as ArrayBuffer;
                    const parsed = parseXLSX(data);
                    if (parsed.rows.length === 0) {
                        setParseErrors([{ row: 0, message: "No data found in Excel file. Make sure the first sheet has headers and data." }]);
                        return;
                    }
                    setParsedData(parsed);
                    setStep("map");
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                setParseErrors([{ row: 0, message: `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}` }]);
            }
        };

        reader.onerror = () => {
            setParseErrors([{ row: 0, message: "Failed to read file. Please try again." }]);
        };

        if (isCSV) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }, [parseCSV, parseXLSX]);

    // Handle file drop
    const handleFileDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) {
                processFile(file);
            }
        },
        [processFile]
    );

    // Handle file input change
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    // Handle paste
    const handlePaste = () => {
        if (!pasteContent.trim()) return;
        setParseErrors([]);

        // Check if it looks like tab-separated (from Excel copy)
        const hasTabsAndNewlines = pasteContent.includes("\t") && pasteContent.includes("\n");
        // Check if it looks like CSV (has commas and multiple lines)
        const looksLikeCSV = pasteContent.includes(",") && pasteContent.includes("\n");

        if (hasTabsAndNewlines) {
            // Parse tab-separated values (common when copying from Excel)
            const lines = pasteContent.trim().split("\n");
            const headers = lines[0].split("\t").map((h) => h.trim());
            const rows = lines.slice(1)
                .filter(line => line.trim())
                .map((line) => line.split("\t").map((cell) => cell.trim()));

            if (rows.length === 0) {
                setParseErrors([{ row: 0, message: "No data rows found. Make sure you've copied headers and data." }]);
                return;
            }

            autoDetectMapping(headers);
            setParsedData({ headers, rows, preview: [], sourceType: "paste" });
            setStep("map");
        } else if (looksLikeCSV) {
            const data = parseCSV(pasteContent);
            if (data.rows.length === 0) {
                setParseErrors([{ row: 0, message: "No data rows found in pasted content." }]);
                return;
            }
            setParsedData({ ...data, sourceType: "paste" });
            setStep("map");
        } else {
            // Treat as simple email list (one per line)
            const emails = pasteContent
                .split("\n")
                .map((e) => e.trim())
                .filter((e) => e && e.includes("@"));

            if (emails.length === 0) {
                setParseErrors([{ row: 0, message: "No valid email addresses found. Make sure each email is on a separate line." }]);
                return;
            }

            setParsedData({
                headers: ["Email"],
                rows: emails.map((e) => [e]),
                preview: emails.map((email) => ({ email })),
                sourceType: "paste",
            });
            setColumnMapping({ email: 0, name: -1, organization: -1 });
            setStep("category"); // Skip mapping for simple email list
        }
    };

    // Build preview from mapping
    const buildPreview = (): ImportContact[] => {
        if (!parsedData) return [];
        return parsedData.rows
            .map((row) => ({
                email: row[columnMapping.email] || "",
                name: columnMapping.name >= 0 ? row[columnMapping.name] : undefined,
                organization:
                    columnMapping.organization >= 0
                        ? row[columnMapping.organization]
                        : undefined,
            }))
            .filter((c) => c.email && c.email.includes("@"));
    };

    // Handle import
    const handleImport = async () => {
        const contacts = buildPreview();
        if (contacts.length === 0) return;

        setIsImporting(true);
        try {
            const result = await onImport(contacts, selectedCategoryId);
            setResult(result);
        } catch (error) {
            console.error("Import failed:", error);
        } finally {
            setIsImporting(false);
        }
    };

    const previewContacts = buildPreview();
    const duplicates = previewContacts.length - new Set(previewContacts.map((c) => c.email)).size;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Import Contacts</h2>
                        <p className="text-sm text-white/50 mt-0.5">
                            {step === "upload" && "Upload a CSV file or paste emails"}
                            {step === "map" && "Map columns to contact fields"}
                            {step === "category" && "Select a category for imported contacts"}
                            {step === "review" && "Review and confirm import"}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 py-4 border-b border-white/5">
                    {steps.map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                    i < currentStepIndex
                                        ? "bg-green-500 text-white"
                                        : i === currentStepIndex
                                        ? "bg-indigo-500 text-white"
                                        : "bg-white/10 text-white/40"
                                }`}
                            >
                                {i < currentStepIndex ? (
                                    <CheckIcon className="w-4 h-4" />
                                ) : (
                                    i + 1
                                )}
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-8 h-0.5 ${
                                        i < currentStepIndex ? "bg-green-500" : "bg-white/10"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="p-5 min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Upload */}
                        {step === "upload" && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {/* Tab Switcher */}
                                <div className="flex gap-2 mb-5">
                                    <button
                                        onClick={() => setUploadTab("file")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            uploadTab === "file"
                                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                                : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                                        }`}
                                    >
                                        <TableCellsIcon className="w-4 h-4" />
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => setUploadTab("paste")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            uploadTab === "paste"
                                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                                : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                                        }`}
                                    >
                                        <ClipboardDocumentIcon className="w-4 h-4" />
                                        Paste Data
                                    </button>
                                </div>

                                {/* Error Messages */}
                                {parseErrors.length > 0 && (
                                    <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        {parseErrors.map((error, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm">
                                                <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                                <span className="text-red-200">{error.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* File Upload Tab */}
                                {uploadTab === "file" && (
                                    <>
                                        <div
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setIsDragging(true);
                                            }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleFileDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                                                isDragging
                                                    ? "border-indigo-500 bg-indigo-500/10"
                                                    : "border-white/20 hover:border-indigo-500/50 hover:bg-white/5"
                                            }`}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".csv,.xlsx,.xls"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <ArrowUpTrayIcon className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-indigo-400" : "text-white/30"}`} />
                                            <p className="text-white/70 mb-1">
                                                {isDragging ? "Drop file here" : "Drag and drop a file here"}
                                            </p>
                                            <p className="text-sm text-white/40 mb-3">
                                                or click to browse
                                            </p>
                                            <div className="flex items-center justify-center gap-3 text-xs text-white/40">
                                                <span className="px-2 py-1 bg-white/10 rounded">.xlsx</span>
                                                <span className="px-2 py-1 bg-white/10 rounded">.xls</span>
                                                <span className="px-2 py-1 bg-white/10 rounded">.csv</span>
                                            </div>
                                        </div>

                                        <div className="mt-5 p-4 bg-white/5 rounded-lg">
                                            <h4 className="text-sm font-medium text-white/70 mb-2">Expected format</h4>
                                            <p className="text-xs text-white/50">
                                                Your file should have a header row with columns like &quot;Email&quot;, &quot;Name&quot;, and &quot;Organisation&quot;.
                                                Only the email column is required.
                                            </p>
                                        </div>
                                    </>
                                )}

                                {/* Paste Tab */}
                                {uploadTab === "paste" && (
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2">
                                            Paste your data
                                        </label>
                                        <textarea
                                            value={pasteContent}
                                            onChange={(e) => setPasteContent(e.target.value)}
                                            placeholder="email1@example.com&#10;email2@example.com&#10;&#10;Or paste data copied from Excel/Google Sheets..."
                                            rows={8}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                                        />
                                        <button
                                            onClick={handlePaste}
                                            disabled={!pasteContent.trim()}
                                            className="mt-3 w-full py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Process Data
                                        </button>
                                        <p className="text-xs text-white/40 mt-3 text-center">
                                            Supports: Email list (one per line), CSV format, or data copied from Excel
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: Map Columns */}
                        {step === "map" && parsedData && (
                            <motion.div
                                key="map"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="space-y-4">
                                    {["email", "name", "organization"].map((field) => (
                                        <div key={field} className="flex items-center gap-4">
                                            <label className="w-32 text-sm font-medium text-white/70 capitalize">
                                                {field}
                                                {field === "email" && (
                                                    <span className="text-red-400 ml-1">*</span>
                                                )}
                                            </label>
                                            <select
                                                value={columnMapping[field as keyof ColumnMapping]}
                                                onChange={(e) =>
                                                    setColumnMapping({
                                                        ...columnMapping,
                                                        [field]: parseInt(e.target.value),
                                                    })
                                                }
                                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
                                            >
                                                <option value={-1}>— Skip —</option>
                                                {parsedData.headers.map((h, i) => (
                                                    <option key={i} value={i}>
                                                        {h}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                {/* Preview */}
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-white/50 mb-3">
                                        Preview (first 3 rows)
                                    </h4>
                                    <div className="bg-white/5 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left px-3 py-2 text-white/50">
                                                        Email
                                                    </th>
                                                    <th className="text-left px-3 py-2 text-white/50">
                                                        Name
                                                    </th>
                                                    <th className="text-left px-3 py-2 text-white/50">
                                                        Organisation
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewContacts.slice(0, 3).map((c, i) => (
                                                    <tr key={i} className="border-b border-white/5">
                                                        <td className="px-3 py-2 text-white">
                                                            {c.email}
                                                        </td>
                                                        <td className="px-3 py-2 text-white/70">
                                                            {c.name || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-white/70">
                                                            {c.organization || "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Category */}
                        {step === "category" && (
                            <motion.div
                                key="category"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {/* Selected category indicator */}
                                {selectedCategoryId && selectedCategory && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl"
                                    >
                                        <div
                                            className="p-2 rounded-lg"
                                            style={{ backgroundColor: `${selectedCategory.color || "#6366f1"}20` }}
                                        >
                                            <FolderIcon
                                                className="w-4 h-4"
                                                style={{ color: selectedCategory.color || "#6366f1" }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {selectedCategory.name}
                                            </p>
                                            <p className="text-xs text-indigo-300">
                                                {getTotalContacts(selectedCategory)} existing contacts
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCategoryId(null)}
                                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Breadcrumb navigation */}
                                <div className="flex items-center gap-1 text-sm overflow-x-auto pb-1">
                                    <button
                                        onClick={() => navigateTo(-1)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                            categoryPath.length === 0
                                                ? "bg-white/10 text-white"
                                                : "text-white/50 hover:text-white hover:bg-white/5"
                                        }`}
                                    >
                                        <HomeIcon className="w-3.5 h-3.5" />
                                        <span>Root</span>
                                    </button>
                                    {categoryPath.map((cat, index) => (
                                        <div key={cat.id} className="flex items-center gap-1 flex-shrink-0">
                                            <ChevronRightIcon className="w-3.5 h-3.5 text-white/30" />
                                            <button
                                                onClick={() => navigateTo(index)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                                                    index === categoryPath.length - 1
                                                        ? "bg-white/10 text-white"
                                                        : "text-white/50 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: cat.color || "#6366f1" }}
                                                />
                                                <span className="truncate max-w-[120px]">{cat.name}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Category list */}
                                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                    {/* No category option - only show at root */}
                                    {categoryPath.length === 0 && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => setSelectedCategoryId(null)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${
                                                selectedCategoryId === null
                                                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-white"
                                                    : "bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.06] hover:border-white/20"
                                            }`}
                                        >
                                            <div className={`p-2.5 rounded-lg transition-colors ${
                                                selectedCategoryId === null
                                                    ? "bg-indigo-500/30"
                                                    : "bg-white/10 group-hover:bg-white/15"
                                            }`}>
                                                <InboxIcon className={`w-4 h-4 ${
                                                    selectedCategoryId === null
                                                        ? "text-indigo-300"
                                                        : "text-white/50"
                                                }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">No category</p>
                                                <p className="text-xs text-white/40">Add to all contacts without categorisation</p>
                                            </div>
                                            {selectedCategoryId === null && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="p-1 bg-indigo-500 rounded-full"
                                                >
                                                    <CheckIcon className="w-3 h-3 text-white" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    )}

                                    {/* Category items */}
                                    {currentCategories.map((cat, index) => {
                                        const isSelected = selectedCategoryId === cat.id;
                                        const hasChildren = cat.children.length > 0;
                                        const totalContacts = getTotalContacts(cat);

                                        return (
                                            <motion.div
                                                key={cat.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className={`flex items-center gap-2 rounded-xl border transition-all ${
                                                    isSelected
                                                        ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/40"
                                                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                                                }`}
                                            >
                                                {/* Select button (main area) */}
                                                <button
                                                    onClick={() => setSelectedCategoryId(cat.id)}
                                                    className="flex-1 flex items-center gap-3 px-4 py-3 text-left group"
                                                >
                                                    <div
                                                        className="p-2.5 rounded-lg transition-colors"
                                                        style={{
                                                            backgroundColor: isSelected
                                                                ? `${cat.color || "#6366f1"}40`
                                                                : `${cat.color || "#6366f1"}15`,
                                                        }}
                                                    >
                                                        {isSelected ? (
                                                            <FolderOpenIcon
                                                                className="w-4 h-4"
                                                                style={{ color: cat.color || "#6366f1" }}
                                                            />
                                                        ) : (
                                                            <FolderIcon
                                                                className="w-4 h-4"
                                                                style={{ color: cat.color || "#6366f1" }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${
                                                            isSelected ? "text-white" : "text-white/80"
                                                        }`}>
                                                            {cat.name}
                                                        </p>
                                                        <p className="text-xs text-white/40">
                                                            {totalContacts} contact{totalContacts !== 1 ? "s" : ""}
                                                            {hasChildren && ` · ${cat.children.length} subcategories`}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="p-1 bg-indigo-500 rounded-full"
                                                        >
                                                            <CheckIcon className="w-3 h-3 text-white" />
                                                        </motion.div>
                                                    )}
                                                </button>

                                                {/* Navigate into button (if has children) */}
                                                {hasChildren && (
                                                    <button
                                                        onClick={() => navigateInto(cat)}
                                                        className="p-3 pr-4 text-white/30 hover:text-white hover:bg-white/10 rounded-r-xl transition-colors border-l border-white/10"
                                                        title={`View ${cat.children.length} subcategories`}
                                                    >
                                                        <ChevronRightIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })}

                                    {/* Empty state */}
                                    {currentCategories.length === 0 && categoryPath.length > 0 && (
                                        <div className="text-center py-8">
                                            <FolderIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
                                            <p className="text-sm text-white/40">No subcategories</p>
                                            <p className="text-xs text-white/30 mt-1">
                                                This category has no children
                                            </p>
                                        </div>
                                    )}

                                    {/* Add new category */}
                                    {onAddCategory && (
                                        <AnimatePresence mode="wait">
                                            {isAddingCategory ? (
                                                <motion.div
                                                    key="add-form"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="flex items-center gap-2 mt-2"
                                                >
                                                    <input
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleAddCategory();
                                                            if (e.key === "Escape") {
                                                                setIsAddingCategory(false);
                                                                setNewCategoryName("");
                                                            }
                                                        }}
                                                        placeholder="Category name..."
                                                        autoFocus
                                                        className="flex-1 px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50"
                                                    />
                                                    <button
                                                        onClick={handleAddCategory}
                                                        disabled={!newCategoryName.trim()}
                                                        className="px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsAddingCategory(false);
                                                            setNewCategoryName("");
                                                        }}
                                                        className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ) : (
                                                <motion.button
                                                    key="add-button"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    onClick={() => setIsAddingCategory(true)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 text-white/40 hover:text-white border border-dashed border-white/20 hover:border-white/40 rounded-xl transition-all hover:bg-white/[0.03]"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Add new {categoryPath.length > 0 ? "subcategory" : "category"}
                                                    </span>
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Review */}
                        {step === "review" && !result && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="bg-white/5 rounded-xl p-5 mb-5">
                                    <h4 className="text-lg font-semibold text-white mb-4">
                                        Import Summary
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-white/50">Total contacts</p>
                                            <p className="text-2xl font-bold text-white">
                                                {previewContacts.length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-white/50">Category</p>
                                            <p className="text-lg font-medium text-white">
                                                {selectedCategory?.name || "None"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {duplicates > 0 && (
                                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-5">
                                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-yellow-200">
                                                {duplicates} duplicate email(s) detected
                                            </p>
                                            <p className="text-xs text-yellow-200/60 mt-1">
                                                Duplicates will be skipped during import
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Result */}
                        {result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                    <CheckIcon className="w-8 h-8 text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Import Complete
                                </h3>
                                <p className="text-white/60 mb-6">
                                    Successfully imported {result.created} contacts
                                </p>
                                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-sm">
                                    <div>
                                        <p className="text-2xl font-bold text-green-400">
                                            {result.created}
                                        </p>
                                        <p className="text-white/50">Created</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-blue-400">
                                            {result.updated}
                                        </p>
                                        <p className="text-white/50">Updated</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white/40">
                                            {result.skipped}
                                        </p>
                                        <p className="text-white/50">Skipped</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-white/10 bg-black/20">
                    <button
                        onClick={() => {
                            if (result) {
                                handleClose();
                            } else if (currentStepIndex > 0) {
                                setStep(steps[currentStepIndex - 1]);
                            } else {
                                handleClose();
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        {result ? "Close" : currentStepIndex > 0 ? "Back" : "Cancel"}
                    </button>

                    {!result && (
                        <button
                            onClick={() => {
                                if (step === "review") {
                                    handleImport();
                                } else if (currentStepIndex < steps.length - 1) {
                                    setStep(steps[currentStepIndex + 1]);
                                }
                            }}
                            disabled={
                                isImporting ||
                                (step === "map" && columnMapping.email < 0) ||
                                (step === "review" && previewContacts.length === 0)
                            }
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isImporting ? (
                                "Importing..."
                            ) : step === "review" ? (
                                "Import Contacts"
                            ) : (
                                <>
                                    Continue
                                    <ArrowRightIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}

                    {result && (
                        <button
                            onClick={handleClose}
                            className="px-5 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                        >
                            Done
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
