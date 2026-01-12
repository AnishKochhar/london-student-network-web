"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MagnifyingGlassIcon,
    FolderIcon,
    EnvelopeIcon,
    ChevronRightIcon,
    XMarkIcon,
    PlusIcon,
    UserGroupIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowPathIcon,
    ExclamationCircleIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { EmailCategory } from "@/app/lib/campaigns/types";

// Types
interface Recipient {
    id: string;
    email: string;
    name: string | null;
    organization: string | null;
    source: "category" | "manual" | "search";
    categoryId?: string;
    categoryName?: string;
}

interface CategorySearchResult {
    type: "category";
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parentName: string | null;
    contactCount: number;
    color: string;
    path: string[];
}

interface ContactSearchResult {
    type: "contact";
    id: string;
    email: string;
    name: string | null;
    organization: string | null;
    categoryId: string | null;
    categoryName: string | null;
}

type SearchResult = CategorySearchResult | ContactSearchResult;

interface RecipientSelectorProps {
    recipients: Recipient[];
    onRecipientsChange: (recipients: Recipient[]) => void;
    categories: EmailCategory[];
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecipientSelector({
    recipients,
    onRecipientsChange,
    categories,
}: RecipientSelectorProps) {
    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [manualEmail, setManualEmail] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);

    // Breadcrumb navigation state
    const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
    const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string | null; name: string }[]>([
        { id: null, name: "All Categories" },
    ]);

    // Recipient list state
    const [isListExpanded, setIsListExpanded] = useState(true);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    // Get children of current category
    const currentChildren = useMemo(() => {
        if (!currentCategoryId) {
            return categories.filter((c) => !c.parentId);
        }
        return categories.filter((c) => c.parentId === currentCategoryId);
    }, [categories, currentCategoryId]);

    // Get current category
    const currentCategory = useMemo(() => {
        if (!currentCategoryId) return null;
        return categories.find((c) => c.id === currentCategoryId) || null;
    }, [categories, currentCategoryId]);

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/admin/campaigns/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.results || []);
                    setShowDropdown(true);
                }
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Navigate to category (breadcrumb)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const navigateToCategory = useCallback((categoryId: string | null, _categoryName: string) => {
        if (categoryId === null) {
            // Going to root
            setBreadcrumbPath([{ id: null, name: "All Categories" }]);
            setCurrentCategoryId(null);
        } else {
            // Build path to this category
            const buildPath = (id: string): { id: string | null; name: string }[] => {
                const cat = categories.find((c) => c.id === id);
                if (!cat) return [];
                if (cat.parentId) {
                    return [...buildPath(cat.parentId), { id: cat.id, name: cat.name }];
                }
                return [{ id: cat.id, name: cat.name }];
            };
            setBreadcrumbPath([{ id: null, name: "All Categories" }, ...buildPath(categoryId)]);
            setCurrentCategoryId(categoryId);
        }
        setShowDropdown(false);
        setSearchQuery("");
    }, [categories]);

    // Add all contacts from a category
    const addCategoryContacts = useCallback(async (categoryId: string, categoryName: string) => {
        setIsLoadingContacts(true);
        try {
            // Fetch all contacts from this category (including descendants)
            const res = await fetch(`/api/admin/campaigns/contacts?categoryId=${categoryId}&limit=1000&includeDescendants=true`);
            if (res.ok) {
                const data = await res.json();
                const contacts = data.items || [];

                const newRecipients: Recipient[] = contacts.map((c: {
                    id: string;
                    email: string;
                    name: string | null;
                    organization: string | null;
                    categoryId: string;
                    categoryName?: string;
                }) => ({
                    id: c.id,
                    email: c.email,
                    name: c.name,
                    organization: c.organization,
                    source: "category" as const,
                    categoryId: c.categoryId,
                    categoryName: c.categoryName || categoryName,
                }));

                // Merge with existing, avoiding duplicates
                const existingEmails = new Set(recipients.map((r) => r.email.toLowerCase()));
                const uniqueNew = newRecipients.filter((r) => !existingEmails.has(r.email.toLowerCase()));

                onRecipientsChange([...recipients, ...uniqueNew]);
            }
        } catch (err) {
            console.error("Error fetching contacts:", err);
        } finally {
            setIsLoadingContacts(false);
        }
    }, [recipients, onRecipientsChange]);

    // Add single contact from search
    const addContact = useCallback((contact: ContactSearchResult) => {
        const existingEmails = new Set(recipients.map((r) => r.email.toLowerCase()));
        if (existingEmails.has(contact.email.toLowerCase())) {
            return; // Already added
        }

        const newRecipient: Recipient = {
            id: contact.id,
            email: contact.email,
            name: contact.name,
            organization: contact.organization,
            source: "search",
            categoryId: contact.categoryId || undefined,
            categoryName: contact.categoryName || undefined,
        };

        onRecipientsChange([...recipients, newRecipient]);
        setSearchQuery("");
        setShowDropdown(false);
    }, [recipients, onRecipientsChange]);

    // Add manual email
    const addManualEmail = useCallback(() => {
        const email = manualEmail.trim();
        if (!email) return;

        if (!EMAIL_REGEX.test(email)) {
            setEmailError("Invalid email format");
            return;
        }

        const existingEmails = new Set(recipients.map((r) => r.email.toLowerCase()));
        if (existingEmails.has(email.toLowerCase())) {
            setEmailError("Email already added");
            return;
        }

        const newRecipient: Recipient = {
            id: `manual-${Date.now()}`,
            email,
            name: null,
            organization: null,
            source: "manual",
        };

        onRecipientsChange([...recipients, newRecipient]);
        setManualEmail("");
        setEmailError(null);
    }, [manualEmail, recipients, onRecipientsChange]);

    // Remove recipient
    const removeRecipient = useCallback((email: string) => {
        onRecipientsChange(recipients.filter((r) => r.email !== email));
    }, [recipients, onRecipientsChange]);

    // Clear all recipients
    const clearAllRecipients = useCallback(() => {
        onRecipientsChange([]);
    }, [onRecipientsChange]);

    // Handle search result click
    const handleSearchResultClick = (result: SearchResult) => {
        if (result.type === "category") {
            navigateToCategory(result.id, result.name);
        } else {
            addContact(result);
        }
    };

    // Check if email is already added
    const isEmailAdded = (email: string) => {
        return recipients.some((r) => r.email.toLowerCase() === email.toLowerCase());
    };

    return (
        <div className="space-y-5">
            {/* Search Input */}
            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                        placeholder="Search categories or contacts..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
                    />
                    {isSearching && (
                        <ArrowPathIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 animate-spin" />
                    )}
                </div>

                {/* Search Dropdown */}
                <AnimatePresence>
                    {showDropdown && searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d12] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            <div className="max-h-80 overflow-y-auto">
                                {searchResults.map((result, index) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSearchResultClick(result)}
                                        disabled={result.type === "contact" && isEmailAdded(result.email)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                            result.type === "contact" && isEmailAdded(result.email)
                                                ? "opacity-50 cursor-not-allowed bg-white/5"
                                                : "hover:bg-white/5"
                                        } ${index !== 0 ? "border-t border-white/5" : ""}`}
                                    >
                                        {result.type === "category" ? (
                                            <>
                                                <div className="p-2 bg-indigo-500/20 rounded-lg flex-shrink-0">
                                                    <FolderIcon className="w-4 h-4 text-indigo-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {result.name}
                                                    </p>
                                                    <p className="text-xs text-white/50">
                                                        {result.path.join(" › ")} • {result.contactCount} contacts
                                                    </p>
                                                </div>
                                                <ChevronRightIcon className="w-4 h-4 text-white/30" />
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                                                    <EnvelopeIcon className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {result.name || result.email}
                                                    </p>
                                                    <p className="text-xs text-white/50 truncate">
                                                        {result.name ? result.email : result.organization || "No organization"}
                                                        {result.categoryName && ` • ${result.categoryName}`}
                                                    </p>
                                                </div>
                                                {isEmailAdded(result.email) ? (
                                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <PlusIcon className="w-4 h-4 text-white/30" />
                                                )}
                                            </>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1 text-sm mb-4 overflow-x-auto pb-2">
                    {breadcrumbPath.map((item, index) => (
                        <div key={item.id || "root"} className="flex items-center gap-1 flex-shrink-0">
                            {index > 0 && <ChevronRightIcon className="w-4 h-4 text-white/30" />}
                            <button
                                onClick={() => navigateToCategory(item.id, item.name)}
                                className={`px-2 py-1 rounded-md transition-colors ${
                                    index === breadcrumbPath.length - 1
                                        ? "bg-indigo-500/20 text-indigo-300 font-medium"
                                        : "text-white/60 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                {item.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Category List or Add Button */}
                {currentChildren.length > 0 ? (
                    <div className="space-y-1.5">
                        {currentChildren.map((cat) => {
                            const childCount = categories.filter((c) => c.parentId === cat.id).length;
                            return (
                                <div
                                    key={cat.id}
                                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg group hover:bg-white/[0.07] hover:border-white/10 transition-all"
                                >
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ backgroundColor: `${cat.color}20` }}
                                    >
                                        <FolderIcon
                                            className="w-4 h-4"
                                            style={{ color: cat.color }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => navigateToCategory(cat.id, cat.name)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <p className="text-sm font-medium text-white truncate">
                                            {cat.name}
                                        </p>
                                        <p className="text-xs text-white/50">
                                            {cat.contactCount || 0} contacts
                                            {childCount > 0 && ` • ${childCount} subcategories`}
                                        </p>
                                    </button>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {childCount > 0 && (
                                            <button
                                                onClick={() => navigateToCategory(cat.id, cat.name)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                                title="Browse subcategories"
                                            >
                                                <ChevronRightIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => addCategoryContacts(cat.id, cat.name)}
                                            disabled={isLoadingContacts}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            Add All
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : currentCategory ? (
                    <div className="text-center py-6">
                        <p className="text-white/50 text-sm mb-3">No subcategories in {currentCategory.name}</p>
                        <button
                            onClick={() => addCategoryContacts(currentCategory.id, currentCategory.name)}
                            disabled={isLoadingContacts}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                        >
                            {isLoadingContacts ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                                <PlusIcon className="w-4 h-4" />
                            )}
                            Add All {currentCategory.contactCount || 0} Contacts
                        </button>
                    </div>
                ) : (
                    <p className="text-center text-white/40 py-4">No categories found</p>
                )}
            </div>

            {/* Manual Email Input */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm font-medium text-white/70 mb-3">Add individual email</p>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="email"
                            value={manualEmail}
                            onChange={(e) => {
                                setManualEmail(e.target.value);
                                setEmailError(null);
                            }}
                            onKeyDown={(e) => e.key === "Enter" && addManualEmail()}
                            placeholder="email@example.com"
                            className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-white/40 focus:outline-none transition-colors ${
                                emailError
                                    ? "border-red-500/50 focus:border-red-500"
                                    : "border-white/10 focus:border-indigo-500/50"
                            }`}
                        />
                        {emailError && (
                            <p className="absolute -bottom-5 left-0 text-xs text-red-400 flex items-center gap-1">
                                <ExclamationCircleIcon className="w-3 h-3" />
                                {emailError}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={addManualEmail}
                        disabled={!manualEmail.trim()}
                        className="px-4 py-2.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-medium hover:bg-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Recipients List */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {/* Header */}
                <button
                    onClick={() => setIsListExpanded(!isListExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <UserGroupIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-white">
                                Selected Recipients
                            </p>
                            <p className="text-xs text-white/50">
                                {recipients.length} {recipients.length === 1 ? "contact" : "contacts"} selected
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {recipients.length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearAllRecipients();
                                }}
                                className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                        {isListExpanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-white/40" />
                        ) : (
                            <ChevronDownIcon className="w-5 h-5 text-white/40" />
                        )}
                    </div>
                </button>

                {/* Recipient List */}
                <AnimatePresence>
                    {isListExpanded && recipients.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-white/10"
                        >
                            <div
                                ref={listContainerRef}
                                className="max-h-64 overflow-y-auto"
                            >
                                {recipients.map((recipient, index) => (
                                    <div
                                        key={recipient.email}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 group transition-colors"
                                        style={{
                                            borderTop: index > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                                        }}
                                    >
                                        <div className={`p-1.5 rounded-lg ${
                                            recipient.source === "manual"
                                                ? "bg-amber-500/20"
                                                : recipient.source === "search"
                                                ? "bg-blue-500/20"
                                                : "bg-emerald-500/20"
                                        }`}>
                                            <EnvelopeIcon className={`w-3.5 h-3.5 ${
                                                recipient.source === "manual"
                                                    ? "text-amber-400"
                                                    : recipient.source === "search"
                                                    ? "text-blue-400"
                                                    : "text-emerald-400"
                                            }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">
                                                {recipient.name || recipient.email}
                                            </p>
                                            {recipient.name && (
                                                <p className="text-xs text-white/40 truncate">
                                                    {recipient.email}
                                                </p>
                                            )}
                                        </div>
                                        {recipient.organization && (
                                            <span className="text-xs text-white/40 truncate max-w-[120px] hidden sm:block">
                                                {recipient.organization}
                                            </span>
                                        )}
                                        {recipient.categoryName && (
                                            <span className="text-xs px-2 py-0.5 bg-white/5 text-white/50 rounded hidden md:block">
                                                {recipient.categoryName}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => removeRecipient(recipient.email)}
                                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {isListExpanded && recipients.length === 0 && (
                    <div className="px-4 py-8 text-center border-t border-white/10">
                        <EnvelopeIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-sm text-white/40">No recipients selected</p>
                        <p className="text-xs text-white/30 mt-1">
                            Search for contacts or browse categories above
                        </p>
                    </div>
                )}
            </div>

            {/* Summary */}
            {recipients.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                    <UserGroupIcon className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                    <div>
                        <p className="text-lg font-semibold text-white">
                            {recipients.length} {recipients.length === 1 ? "recipient" : "recipients"}
                        </p>
                        <p className="text-sm text-white/60">
                            {recipients.filter((r) => r.source === "category").length} from categories,{" "}
                            {recipients.filter((r) => r.source === "search").length} from search,{" "}
                            {recipients.filter((r) => r.source === "manual").length} manual
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
