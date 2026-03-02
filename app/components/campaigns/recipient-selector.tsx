"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MagnifyingGlassIcon,
    FolderIcon,
    EnvelopeIcon,
    XMarkIcon,
    PlusIcon,
    UserGroupIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    UsersIcon,
    CheckIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import { EmailCategory } from "@/app/lib/campaigns/types";

// Types
export interface Recipient {
    id: string;
    email: string;
    name: string | null;
    organization: string | null;
    source: "category" | "manual" | "search";
    categoryName?: string;
}

interface ContactResult {
    id: string;
    email: string;
    name: string | null;
    organization: string | null;
    categories: { id: string; name: string; slug: string }[];
}

interface RecipientSelectorProps {
    recipients: Recipient[];
    onRecipientsChange: (recipients: Recipient[]) => void;
    categories: EmailCategory[];
}

// Dropdown item types for keyboard navigation
type DropdownItem =
    | { type: "category"; data: EmailCategory }
    | { type: "contact"; data: ContactResult }
    | { type: "manual"; email: string };

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecipientSelector({
    recipients,
    onRecipientsChange,
    categories,
}: RecipientSelectorProps) {
    // Search state
    const [query, setQuery] = useState("");
    const [allContacts, setAllContacts] = useState<ContactResult[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState<string | null>(null);

    // Keyboard navigation state
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Recipient list state
    const [isListExpanded, setIsListExpanded] = useState(true);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    // Check if query is a valid email
    const isValidEmail = useMemo(() => EMAIL_REGEX.test(query.trim()), [query]);

    // Check if email is already added
    const isEmailAdded = useCallback(
        (email: string) => recipients.some((r) => r.email.toLowerCase() === email.toLowerCase()),
        [recipients]
    );

    // Default/suggested categories (top by contact count)
    const suggestedCategories = useMemo(() => {
        return [...categories]
            .sort((a, b) => (b.contactCount || 0) - (a.contactCount || 0))
            .slice(0, 4);
    }, [categories]);

    // Default/suggested contacts (first few)
    const suggestedContacts = useMemo(() => {
        return allContacts.slice(0, 4);
    }, [allContacts]);

    // Client-side filtered categories
    const filteredCategories = useMemo(() => {
        if (!query.trim()) return suggestedCategories;
        const lowerQuery = query.toLowerCase().trim();
        return categories
            .filter(
                (cat) =>
                    cat.name.toLowerCase().includes(lowerQuery) ||
                    cat.slug?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5);
    }, [categories, query, suggestedCategories]);

    // Client-side filtered contacts
    const filteredContacts = useMemo(() => {
        if (!query.trim()) return suggestedContacts;
        const lowerQuery = query.toLowerCase().trim();
        return allContacts
            .filter(
                (c) =>
                    c.email.toLowerCase().includes(lowerQuery) ||
                    c.name?.toLowerCase().includes(lowerQuery) ||
                    c.organization?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 8);
    }, [allContacts, query, suggestedContacts]);

    // Show manual email option
    const showManualOption = useMemo(() => {
        if (!isValidEmail) return false;
        const trimmedQuery = query.trim().toLowerCase();
        if (isEmailAdded(trimmedQuery)) return false;
        // Don't show if it matches an existing contact exactly
        if (filteredContacts.some((c) => c.email.toLowerCase() === trimmedQuery)) return false;
        return true;
    }, [isValidEmail, query, isEmailAdded, filteredContacts]);

    // Build flat list of all dropdown items for keyboard navigation
    const dropdownItems = useMemo((): DropdownItem[] => {
        const items: DropdownItem[] = [];

        // Add categories
        filteredCategories.forEach((cat) => {
            items.push({ type: "category", data: cat });
        });

        // Add contacts (only non-added ones are selectable, but we include all for indexing)
        filteredContacts.forEach((contact) => {
            items.push({ type: "contact", data: contact });
        });

        // Add manual email option
        if (showManualOption) {
            items.push({ type: "manual", email: query.trim() });
        }

        return items;
    }, [filteredCategories, filteredContacts, showManualOption, query]);

    // Fetch all contacts on mount for client-side filtering
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await fetch("/api/admin/campaigns/contacts?limit=1000");
                if (res.ok) {
                    const data = await res.json();
                    setAllContacts(data.items || []);
                }
            } catch (err) {
                console.error("Error fetching contacts:", err);
            } finally {
                setIsLoadingContacts(false);
            }
        };
        fetchContacts();
    }, []);

    // Reset highlighted index when dropdown items change
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [dropdownItems.length, query]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0) {
            const element = itemRefs.current.get(highlightedIndex);
            element?.scrollIntoView({ block: "nearest" });
        }
    }, [highlightedIndex]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Add all contacts from a category
    const addCategoryContacts = useCallback(
        async (category: EmailCategory) => {
            setIsAddingCategory(category.id);
            try {
                const res = await fetch(
                    `/api/admin/campaigns/contacts?categoryId=${category.id}&limit=1000&includeDescendants=true`
                );
                if (res.ok) {
                    const data = await res.json();
                    const contacts = data.items || [];

                    const newRecipients: Recipient[] = contacts.map(
                        (c: ContactResult) => ({
                            id: c.id,
                            email: c.email,
                            name: c.name,
                            organization: c.organization,
                            source: "category" as const,
                            categoryName: category.name,
                        })
                    );

                    // Deduplicate by email: avoid duplicates with existing recipients
                    const existingEmails = new Set(recipients.map((r) => r.email.toLowerCase()));
                    const seenEmails = new Set<string>();
                    const uniqueNew = newRecipients.filter((r) => {
                        const lower = r.email.toLowerCase();
                        if (existingEmails.has(lower) || seenEmails.has(lower)) return false;
                        seenEmails.add(lower);
                        return true;
                    });

                    onRecipientsChange([...recipients, ...uniqueNew]);
                    setQuery("");
                    setShowDropdown(false);
                }
            } catch (err) {
                console.error("Error fetching category contacts:", err);
            } finally {
                setIsAddingCategory(null);
            }
        },
        [recipients, onRecipientsChange]
    );

    // Add single contact
    const addContact = useCallback(
        (contact: ContactResult) => {
            if (isEmailAdded(contact.email)) return;

            const newRecipient: Recipient = {
                id: contact.id,
                email: contact.email,
                name: contact.name,
                organization: contact.organization,
                source: "search",
                categoryName: contact.categories?.[0]?.name || undefined,
            };

            onRecipientsChange([...recipients, newRecipient]);
            setQuery("");
            setShowDropdown(false);
        },
        [recipients, onRecipientsChange, isEmailAdded]
    );

    // Add manual email
    const addManualEmail = useCallback(() => {
        const email = query.trim();
        if (!email || !isValidEmail || isEmailAdded(email)) return;

        const newRecipient: Recipient = {
            id: `manual-${Date.now()}`,
            email,
            name: null,
            organization: null,
            source: "manual",
        };

        onRecipientsChange([...recipients, newRecipient]);
        setQuery("");
        setShowDropdown(false);
    }, [query, isValidEmail, isEmailAdded, recipients, onRecipientsChange]);

    // Remove recipient
    const removeRecipient = useCallback(
        (email: string) => {
            onRecipientsChange(recipients.filter((r) => r.email !== email));
        },
        [recipients, onRecipientsChange]
    );

    // Clear all
    const clearAllRecipients = useCallback(() => {
        onRecipientsChange([]);
    }, [onRecipientsChange]);

    // Select highlighted item
    const selectHighlightedItem = useCallback(() => {
        if (highlightedIndex < 0 || highlightedIndex >= dropdownItems.length) return false;

        const item = dropdownItems[highlightedIndex];
        if (item.type === "category") {
            addCategoryContacts(item.data);
            return true;
        } else if (item.type === "contact") {
            if (!isEmailAdded(item.data.email)) {
                addContact(item.data);
                return true;
            }
        } else if (item.type === "manual") {
            addManualEmail();
            return true;
        }
        return false;
    }, [highlightedIndex, dropdownItems, addCategoryContacts, addContact, addManualEmail, isEmailAdded]);

    // Handle key press
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) {
            // Open dropdown on arrow down when closed
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setShowDropdown(true);
                setHighlightedIndex(0);
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) => {
                    const next = prev + 1;
                    return next >= dropdownItems.length ? 0 : next;
                });
                break;

            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) => {
                    const next = prev - 1;
                    return next < 0 ? dropdownItems.length - 1 : next;
                });
                break;

            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    selectHighlightedItem();
                } else if (showManualOption) {
                    addManualEmail();
                }
                break;

            case "Tab":
                if (highlightedIndex >= 0) {
                    e.preventDefault();
                    selectHighlightedItem();
                }
                break;

            case "Escape":
                e.preventDefault();
                setShowDropdown(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    // Handle input focus
    const handleFocus = () => {
        setShowDropdown(true);
        if (dropdownItems.length > 0 && highlightedIndex < 0) {
            setHighlightedIndex(0);
        }
    };

    const hasResults = filteredCategories.length > 0 || filteredContacts.length > 0;
    const isDefaultView = !query.trim();

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleFocus}
                        onKeyDown={handleKeyDown}
                        placeholder="Search groups, contacts, or enter an email..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
                    />
                    {isLoadingContacts && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Unified Dropdown */}
                <AnimatePresence>
                    {showDropdown && (hasResults || showManualOption || isDefaultView) && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#121218] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            <div className="max-h-80 overflow-y-auto">
                                {(() => {
                                    let itemIndex = 0;
                                    return (
                                        <>
                                            {/* Groups Section */}
                                            {filteredCategories.length > 0 && (
                                                <div>
                                                    <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5">
                                                        <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium flex items-center gap-1.5">
                                                            {isDefaultView ? (
                                                                <SparklesIcon className="w-3 h-3" />
                                                            ) : (
                                                                <FolderIcon className="w-3 h-3" />
                                                            )}
                                                            {isDefaultView ? "Suggested Groups" : "Groups"}
                                                        </p>
                                                    </div>
                                                    {filteredCategories.map((cat) => {
                                                        const currentIndex = itemIndex++;
                                                        const isHighlighted = currentIndex === highlightedIndex;
                                                        return (
                                                            <button
                                                                key={cat.id}
                                                                ref={(el) => {
                                                                    if (el) itemRefs.current.set(currentIndex, el);
                                                                }}
                                                                onClick={() => addCategoryContacts(cat)}
                                                                onMouseEnter={() => setHighlightedIndex(currentIndex)}
                                                                disabled={isAddingCategory === cat.id}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-60 group ${
                                                                    isHighlighted ? "bg-white/10" : "hover:bg-white/5"
                                                                }`}
                                                            >
                                                                {/* Group icon with color */}
                                                                <div
                                                                    className="p-2.5 rounded-lg flex-shrink-0"
                                                                    style={{ backgroundColor: `${cat.color || "#6366f1"}15` }}
                                                                >
                                                                    <FolderIcon
                                                                        className="w-4 h-4"
                                                                        style={{ color: cat.color || "#6366f1" }}
                                                                    />
                                                                </div>

                                                                {/* Name & description */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-white truncate">
                                                                        {cat.name}
                                                                    </p>
                                                                    {cat.description && (
                                                                        <p className="text-xs text-white/40 truncate">
                                                                            {cat.description}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Contact count badge */}
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                                                                        <UsersIcon className="w-3.5 h-3.5 text-indigo-400" />
                                                                        <span className="text-xs font-semibold text-indigo-300">
                                                                            {cat.contactCount || 0}
                                                                        </span>
                                                                    </div>
                                                                    {isAddingCategory === cat.id ? (
                                                                        <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                                                                    ) : (
                                                                        <PlusIcon className={`w-5 h-5 transition-colors ${isHighlighted ? "text-white/50" : "text-white/20 group-hover:text-white/50"}`} />
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Contacts Section */}
                                            {filteredContacts.length > 0 && (
                                                <div>
                                                    <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5">
                                                        <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium flex items-center gap-1.5">
                                                            {isDefaultView ? (
                                                                <SparklesIcon className="w-3 h-3" />
                                                            ) : (
                                                                <EnvelopeIcon className="w-3 h-3" />
                                                            )}
                                                            {isDefaultView ? "Suggested Contacts" : "Contacts"}
                                                        </p>
                                                    </div>
                                                    {filteredContacts.map((contact) => {
                                                        const currentIndex = itemIndex++;
                                                        const isHighlighted = currentIndex === highlightedIndex;
                                                        const added = isEmailAdded(contact.email);
                                                        return (
                                                            <button
                                                                key={contact.id}
                                                                ref={(el) => {
                                                                    if (el) itemRefs.current.set(currentIndex, el);
                                                                }}
                                                                onClick={() => !added && addContact(contact)}
                                                                onMouseEnter={() => setHighlightedIndex(currentIndex)}
                                                                disabled={added}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
                                                                    added
                                                                        ? "opacity-50 cursor-not-allowed bg-white/[0.02]"
                                                                        : isHighlighted
                                                                        ? "bg-white/10"
                                                                        : "hover:bg-white/5"
                                                                }`}
                                                            >
                                                                {/* Contact icon */}
                                                                <div className="p-2.5 bg-emerald-500/15 rounded-lg flex-shrink-0">
                                                                    <EnvelopeIcon className="w-4 h-4 text-emerald-400" />
                                                                </div>

                                                                {/* Name & email */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-white truncate">
                                                                        {contact.name || contact.email}
                                                                    </p>
                                                                    <p className="text-xs text-white/40 truncate">
                                                                        {contact.name
                                                                            ? contact.email
                                                                            : contact.organization || "No organisation"}
                                                                    </p>
                                                                </div>

                                                                {/* Status indicator */}
                                                                {added ? (
                                                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                                                        <CheckIcon className="w-4 h-4" />
                                                                        <span className="text-xs">Added</span>
                                                                    </div>
                                                                ) : (
                                                                    <PlusIcon className={`w-5 h-5 transition-colors flex-shrink-0 ${isHighlighted ? "text-white/50" : "text-white/20 group-hover:text-white/50"}`} />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Manual Email Option */}
                                            {showManualOption && (() => {
                                                const currentIndex = itemIndex++;
                                                const isHighlighted = currentIndex === highlightedIndex;
                                                return (
                                                    <div>
                                                        {(filteredCategories.length > 0 || filteredContacts.length > 0) && (
                                                            <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5">
                                                                <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium flex items-center gap-1.5">
                                                                    <PlusIcon className="w-3 h-3" />
                                                                    Add New
                                                                </p>
                                                            </div>
                                                        )}
                                                        <button
                                                            ref={(el) => {
                                                                if (el) itemRefs.current.set(currentIndex, el);
                                                            }}
                                                            onClick={addManualEmail}
                                                            onMouseEnter={() => setHighlightedIndex(currentIndex)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
                                                                isHighlighted ? "bg-white/10" : "hover:bg-white/5"
                                                            }`}
                                                        >
                                                            <div className="p-2.5 bg-amber-500/15 rounded-lg flex-shrink-0">
                                                                <EnvelopeIcon className="w-4 h-4 text-amber-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-white truncate">
                                                                    {query.trim()}
                                                                </p>
                                                                <p className="text-xs text-white/40">
                                                                    Add as manual recipient
                                                                </p>
                                                            </div>
                                                            <span className={`text-xs font-medium px-2 py-1 rounded flex-shrink-0 ${isHighlighted ? "text-amber-300 bg-amber-500/20" : "text-amber-400/80 bg-amber-500/10"}`}>
                                                                Enter ↵
                                                            </span>
                                                        </button>
                                                    </div>
                                                );
                                            })()}

                                            {/* No Results */}
                                            {query.length >= 2 && !hasResults && !showManualOption && (
                                                <div className="px-4 py-6 text-center">
                                                    <p className="text-sm text-white/40">No results found</p>
                                                    <p className="text-xs text-white/30 mt-1">
                                                        Try a different search or enter a valid email
                                                    </p>
                                                </div>
                                            )}

                                            {/* Keyboard hint */}
                                            {dropdownItems.length > 0 && (
                                                <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5">
                                                    <p className="text-[10px] text-white/30 flex items-center gap-3">
                                                        <span className="flex items-center gap-1">
                                                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px]">↑</kbd>
                                                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px]">↓</kbd>
                                                            navigate
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px]">↵</kbd>
                                                            select
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px]">esc</kbd>
                                                            close
                                                        </span>
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Recipients List */}
            {recipients.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {/* Header */}
                    <button
                        onClick={() => setIsListExpanded(!isListExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <UserGroupIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-white">
                                    {recipients.length} {recipients.length === 1 ? "recipient" : "recipients"}
                                </p>
                                <p className="text-xs text-white/40">
                                    {recipients.filter((r) => r.source === "category").length} from groups · {" "}
                                    {recipients.filter((r) => r.source === "search").length} from search · {" "}
                                    {recipients.filter((r) => r.source === "manual").length} manual
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearAllRecipients();
                                }}
                                className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                            {isListExpanded ? (
                                <ChevronUpIcon className="w-5 h-5 text-white/40" />
                            ) : (
                                <ChevronDownIcon className="w-5 h-5 text-white/40" />
                            )}
                        </div>
                    </button>

                    {/* Recipient List */}
                    <AnimatePresence>
                        {isListExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-white/10"
                            >
                                <div className="max-h-56 overflow-y-auto">
                                    {recipients.map((recipient, index) => (
                                        <div
                                            key={recipient.email}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] group transition-colors"
                                            style={{
                                                borderTop:
                                                    index > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                                            }}
                                        >
                                            <div
                                                className={`p-1.5 rounded-md ${
                                                    recipient.source === "manual"
                                                        ? "bg-amber-500/15"
                                                        : recipient.source === "search"
                                                        ? "bg-blue-500/15"
                                                        : "bg-emerald-500/15"
                                                }`}
                                            >
                                                <EnvelopeIcon
                                                    className={`w-3.5 h-3.5 ${
                                                        recipient.source === "manual"
                                                            ? "text-amber-400"
                                                            : recipient.source === "search"
                                                            ? "text-blue-400"
                                                            : "text-emerald-400"
                                                    }`}
                                                />
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
                                            {recipient.categoryName && (
                                                <span className="text-[10px] px-2 py-0.5 bg-white/5 text-white/40 rounded hidden md:block">
                                                    {recipient.categoryName}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => removeRecipient(recipient.email)}
                                                className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Empty State */}
            {recipients.length === 0 && (
                <div className="text-center py-8 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
                    <UserGroupIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/40">No recipients selected</p>
                    <p className="text-xs text-white/30 mt-1">
                        Search for groups or contacts, or enter an email address
                    </p>
                </div>
            )}
        </div>
    );
}
