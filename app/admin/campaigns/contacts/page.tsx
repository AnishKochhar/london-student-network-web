"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    ArrowUpTrayIcon,
    ArrowDownTrayIcon,
    TrashIcon,
    EnvelopeIcon,
    FunnelIcon,
    CheckIcon,
    ArrowPathIcon,
    FolderIcon,
    TagIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    Bars3Icon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import CategoryTree, { CategoryNode, EmptyCategoryTree, getTotalContacts } from "@/app/components/campaigns/category-tree";
import SlideInPanel, {
    PanelSection,
    PanelField,
    PanelActions,
} from "@/app/components/campaigns/slide-in-panel";
import ImportWizard from "@/app/components/campaigns/import-wizard";
import AddContactModal, { NewContact } from "@/app/components/campaigns/add-contact-modal";
import ExportModal from "@/app/components/campaigns/export-modal";
import FilterPanel, { ContactFilters, defaultFilters } from "@/app/components/campaigns/filter-panel";
import { EmailContact, ImportContact, ImportResult } from "@/app/lib/campaigns/types";

// Placeholder categories for universities we plan to add
const placeholderCategories: CategoryNode[] = [
    {
        id: "placeholder-kcl",
        name: "King's College London",
        slug: "kings-college",
        parentId: null,
        color: "#B21F31",
        icon: "folder",
        contactCount: 0,
        children: [],
    },
    {
        id: "placeholder-ucl",
        name: "UCL",
        slug: "ucl",
        parentId: null,
        color: "#500778",
        icon: "folder",
        contactCount: 0,
        children: [],
    },
];

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function ContactsPage() {
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [contacts, setContacts] = useState<EmailContact[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<ContactFilters>(defaultFilters);

    // Modal states
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileCategoryPicker, setShowMobileCategoryPicker] = useState(false);

    // Contact subscription management
    const [showStatusConfirm, setShowStatusConfirm] = useState<"unsubscribe" | "reactivate" | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Category management states
    const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CategoryNode | null>(null);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showPlannedCategories, setShowPlannedCategories] = useState(false);
    const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    // Available tags and sources for filtering
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [availableSources, setAvailableSources] = useState<string[]>([]);

    // Resizable sidebar with localStorage persistence
    const SIDEBAR_STORAGE_KEY = "campaigns-contacts-sidebar";
    const DEFAULT_SIDEBAR_WIDTH = 256;
    const MIN_SIDEBAR_WIDTH = 200;
    const MAX_SIDEBAR_WIDTH = 400;
    const COLLAPSED_WIDTH = 48;

    const [sidebarWidth, setSidebarWidth] = useState(() => {
        if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
        try {
            const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.width ?? DEFAULT_SIDEBAR_WIDTH;
            }
        } catch { /* ignore */ }
        return DEFAULT_SIDEBAR_WIDTH;
    });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.collapsed ?? false;
            }
        } catch { /* ignore */ }
        return false;
    });
    const isResizing = useRef(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current || !sidebarRef.current) return;

            // Get the sidebar's left edge position
            const sidebarRect = sidebarRef.current.getBoundingClientRect();
            const newWidth = e.clientX - sidebarRect.left;

            setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth)));
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Persist sidebar state to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({
                width: sidebarWidth,
                collapsed: isSidebarCollapsed,
            }));
        } catch { /* ignore */ }
    }, [sidebarWidth, isSidebarCollapsed]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/campaigns/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    }, []);

    // Fetch contacts
    const fetchContacts = useCallback(async (page = 1) => {
        setIsLoadingContacts(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pagination.limit),
            });

            // Only filter by category if it's a real category (not placeholder)
            if (selectedCategoryId && !selectedCategoryId.startsWith("placeholder-")) {
                params.set("categoryId", selectedCategoryId);
            }

            if (debouncedSearch) {
                params.set("search", debouncedSearch);
            }

            const res = await fetch(`/api/admin/campaigns/contacts?${params}`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data.items);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        } finally {
            setIsLoadingContacts(false);
            setIsLoading(false);
        }
    }, [selectedCategoryId, debouncedSearch, pagination.limit]);

    // Initial fetch
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Fetch contacts when filters change
    useEffect(() => {
        fetchContacts(1);
        setSelectedContacts(new Set());
    }, [selectedCategoryId, debouncedSearch, fetchContacts]);

    const activeContact = contacts.find((c) => c.id === activeContactId);

    const toggleSelectAll = () => {
        if (selectedContacts.size === contacts.length) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(contacts.map((c) => c.id)));
        }
    };

    const toggleContact = (id: string) => {
        const newSet = new Set(selectedContacts);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedContacts(newSet);
    };

    const handleCategorySelect = (category: CategoryNode | null) => {
        setSelectedCategoryId(category?.id || null);
        setSelectedContacts(new Set());
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchContacts(newPage);
        }
    };

    // Get flat list of categories for dropdowns
    const flatCategories = useCallback(() => {
        const flatten = (cats: CategoryNode[], path = ""): { id: string; name: string; path: string }[] => {
            return cats.flatMap((cat) => {
                const currentPath = path ? `${path} > ${cat.name}` : cat.name;
                return [
                    { id: cat.id, name: cat.name, path: currentPath },
                    ...flatten(cat.children, currentPath),
                ];
            });
        };
        return flatten(categories.filter(c => !c.id.startsWith("placeholder-")));
    }, [categories]);

    // Import contacts handler
    const handleImportContacts = async (
        importContacts: ImportContact[],
        categoryId: string | null
    ): Promise<ImportResult> => {
        const res = await fetch("/api/admin/campaigns/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contacts: importContacts,
                categoryId,
                source: "csv_import",
            }),
        });

        if (!res.ok) {
            throw new Error("Import failed");
        }

        const result = await res.json();

        // Refresh contacts and categories
        fetchContacts(1);
        fetchCategories();

        return result;
    };

    // Add single contact handler
    const handleAddContact = async (contact: NewContact): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await fetch("/api/admin/campaigns/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contact),
            });

            if (!res.ok) {
                const data = await res.json();
                return { success: false, error: data.error || "Failed to add contact" };
            }

            // Refresh contacts and categories
            fetchContacts(pagination.page);
            fetchCategories();

            return { success: true };
        } catch (error) {
            console.error("Error adding contact:", error);
            return { success: false, error: "An unexpected error occurred" };
        }
    };

    // Delete contacts handler (soft delete)
    const handleDeleteContacts = async () => {
        if (selectedContacts.size === 0) return;

        setIsDeleting(true);
        try {
            const res = await fetch("/api/admin/campaigns/contacts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedContacts) }),
            });

            if (res.ok) {
                setSelectedContacts(new Set());
                fetchContacts(pagination.page);
                fetchCategories();
            }
        } catch (error) {
            console.error("Error deleting contacts:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Move contacts to category
    const handleMoveToCategory = async (newCategoryId: string | null) => {
        if (selectedContacts.size === 0) return;

        try {
            const res = await fetch("/api/admin/campaigns/contacts/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: Array.from(selectedContacts),
                    categoryId: newCategoryId,
                }),
            });

            if (res.ok) {
                setSelectedContacts(new Set());
                setShowMoveModal(false);
                fetchContacts(pagination.page);
                fetchCategories();
            }
        } catch (error) {
            console.error("Error moving contacts:", error);
        }
    };

    // Category management handlers
    const handleRenameCategory = async () => {
        if (!editingCategory || !newCategoryName.trim()) return;

        setIsSavingCategory(true);
        try {
            const res = await fetch("/api/admin/campaigns/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingCategory.id,
                    name: newCategoryName.trim(),
                }),
            });

            if (res.ok) {
                setEditingCategory(null);
                setNewCategoryName("");
                fetchCategories();
            }
        } catch (error) {
            console.error("Error renaming category:", error);
        } finally {
            setIsSavingCategory(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!deletingCategory) return;

        setIsSavingCategory(true);
        try {
            const res = await fetch(`/api/admin/campaigns/categories?id=${deletingCategory.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                // If we deleted the currently selected category, clear selection
                if (selectedCategoryId === deletingCategory.id) {
                    setSelectedCategoryId(null);
                }
                setDeletingCategory(null);
                fetchCategories();
                fetchContacts(1);
            }
        } catch (error) {
            console.error("Error deleting category:", error);
        } finally {
            setIsSavingCategory(false);
        }
    };

    const handleAddSubcategory = async () => {
        if (!newCategoryName.trim()) return;

        setIsSavingCategory(true);
        try {
            const res = await fetch("/api/admin/campaigns/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    parentId: addingSubcategoryTo,
                }),
            });

            if (res.ok) {
                setShowAddCategoryModal(false);
                setAddingSubcategoryTo(null);
                setNewCategoryName("");
                fetchCategories();
            }
        } catch (error) {
            console.error("Error adding subcategory:", error);
        } finally {
            setIsSavingCategory(false);
        }
    };

    const handleUpdateContactStatus = async (contactId: string, newStatus: "active" | "unsubscribed") => {
        setIsUpdatingStatus(true);
        try {
            const res = await fetch("/api/admin/campaigns/contacts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: contactId, status: newStatus }),
            });

            if (res.ok) {
                const updated = await res.json();
                setContacts(prev =>
                    prev.map(c => c.id === contactId ? { ...c, status: updated.status, unsubscribedAt: updated.unsubscribedAt } : c)
                );
            }
        } catch (error) {
            console.error("Error updating contact status:", error);
        } finally {
            setIsUpdatingStatus(false);
            setShowStatusConfirm(null);
        }
    };

    // Extract unique tags and sources from contacts for filtering
    useEffect(() => {
        const tags = new Set<string>();
        const sources = new Set<string>();
        contacts.forEach((c) => {
            c.tags.forEach((t) => tags.add(t));
            if (c.source) sources.add(c.source);
        });
        setAvailableTags(Array.from(tags).sort());
        setAvailableSources(Array.from(sources).sort());
    }, [contacts]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (showMobileMenu) {
                setShowMobileMenu(false);
            }
        };

        if (showMobileMenu) {
            // Add a small delay to prevent immediate closing
            const timer = setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);

            return () => {
                clearTimeout(timer);
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [showMobileMenu]);

    // Get selected contacts data for export
    const getExportContacts = () => {
        if (selectedContacts.size > 0) {
            return contacts.filter((c) => selectedContacts.has(c.id));
        }
        return contacts;
    };

    // Get selected category name
    const getSelectedCategoryName = () => {
        if (!selectedCategoryId) return undefined;
        const findCategory = (cats: CategoryNode[]): CategoryNode | undefined => {
            for (const cat of cats) {
                if (cat.id === selectedCategoryId) return cat;
                const found = findCategory(cat.children);
                if (found) return found;
            }
            return undefined;
        };
        return findCategory(categories)?.name;
    };

    // Show empty state for placeholder categories
    const isPlaceholderCategory = selectedCategoryId?.startsWith("placeholder-");
    const displayContacts = isPlaceholderCategory ? [] : contacts;

    return (
        <div className="flex h-full min-h-0">
            {/* Category Sidebar - Collapsible & Resizable */}
            <motion.div
                ref={sidebarRef}
                initial={false}
                animate={{ width: isSidebarCollapsed ? COLLAPSED_WIDTH : sidebarWidth }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex-shrink-0 border-r border-white/5 bg-black/10 relative hidden md:flex flex-col"
            >
                {/* Sidebar Header */}
                <div className="h-10 flex items-center justify-between px-2 border-b border-white/5 flex-shrink-0">
                    <AnimatePresence mode="wait">
                        {!isSidebarCollapsed && (
                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2"
                            >
                                Categories
                            </motion.h3>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                        title={isSidebarCollapsed ? "Expand categories" : "Collapse categories"}
                    >
                        {isSidebarCollapsed ? (
                            <ChevronRightIcon className="w-4 h-4" />
                        ) : (
                            <ChevronLeftIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        {isSidebarCollapsed ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-2 px-1 space-y-1"
                            >
                                {/* Collapsed: Show coloured folder icons */}
                                <button
                                    onClick={() => handleCategorySelect(null)}
                                    className={`w-full p-2 rounded-lg transition-colors ${
                                        !selectedCategoryId
                                            ? "bg-indigo-500/20 text-indigo-300"
                                            : "text-white/50 hover:bg-white/10 hover:text-white"
                                    }`}
                                    title="All Contacts"
                                >
                                    <TagIcon className="w-5 h-5 mx-auto" />
                                </button>
                                {categories.slice(0, 8).map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategorySelect(cat)}
                                        className={`w-full p-2 rounded-lg transition-colors ${
                                            selectedCategoryId === cat.id
                                                ? "bg-indigo-500/20"
                                                : "hover:bg-white/10"
                                        }`}
                                        title={`${cat.name} (${getTotalContacts(cat)})`}
                                    >
                                        <FolderIcon
                                            className="w-5 h-5 mx-auto"
                                            style={{ color: cat.color || "#6366f1" }}
                                        />
                                    </button>
                                ))}
                                {categories.length > 8 && (
                                    <div className="text-center text-xs text-white/30 py-1">
                                        +{categories.length - 8}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-3"
                            >
                                {categories.length > 0 ? (
                                    <>
                                        <CategoryTree
                                            categories={categories}
                                            selectedId={selectedCategoryId}
                                            onSelect={handleCategorySelect}
                                            onAddCategory={(parentId) => {
                                                setAddingSubcategoryTo(parentId);
                                                setNewCategoryName("");
                                                setShowAddCategoryModal(true);
                                            }}
                                            onEditCategory={(category) => {
                                                setEditingCategory(category);
                                                setNewCategoryName(category.name);
                                            }}
                                            onDeleteCategory={(category) => {
                                                setDeletingCategory(category);
                                            }}
                                        />

                                        {/* Planned categories section */}
                                        {placeholderCategories.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <button
                                                    onClick={() => setShowPlannedCategories(!showPlannedCategories)}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/30 hover:text-white/50 transition-colors w-full"
                                                >
                                                    <ChevronRightIcon className={`w-3 h-3 transition-transform duration-150 ${showPlannedCategories ? "rotate-90" : ""}`} />
                                                    <span className="uppercase tracking-wider font-semibold">Planned</span>
                                                </button>
                                                <AnimatePresence>
                                                    {showPlannedCategories && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="space-y-0.5 mt-1">
                                                                {placeholderCategories.map((cat) => (
                                                                    <div
                                                                        key={cat.id}
                                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/25 cursor-default"
                                                                    >
                                                                        <FolderIcon className="w-4 h-4 opacity-50" style={{ color: cat.color }} />
                                                                        <span className="truncate flex-1 min-w-0">{cat.name}</span>
                                                                        <span className="text-xs text-white/15 flex-shrink-0">0</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </>
                                ) : isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <ArrowPathIcon className="w-5 h-5 text-white/30 animate-spin" />
                                    </div>
                                ) : (
                                    <EmptyCategoryTree onAddCategory={() => {
                                        setAddingSubcategoryTo(null);
                                        setNewCategoryName("");
                                        setShowAddCategoryModal(true);
                                    }} />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Resize Handle - Only show when not collapsed */}
                {!isSidebarCollapsed && (
                    <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors group"
                        onMouseDown={handleMouseDown}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Category Selector - Only visible on mobile */}
                <div className="md:hidden border-b border-white/5 p-3">
                    <button
                        onClick={() => setShowMobileCategoryPicker(true)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <FolderIcon className="w-4 h-4 text-white/40" />
                            <span>{getSelectedCategoryName() || "All Categories"}</span>
                        </div>
                        <ChevronDownIcon className="w-4 h-4 text-white/40" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-white/5">
                    {/* Search */}
                    <div className="relative flex-1 min-w-0">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>

                    {/* Filter button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg border transition-all flex-shrink-0 ${
                            showFilters
                                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                    >
                        <FunnelIcon className="w-4 h-4" />
                    </button>

                    <div className="hidden sm:block h-6 w-px bg-white/10" />

                    {/* Desktop Actions - Hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            <span className="hidden lg:inline">Import</span>
                        </button>

                        <button
                            onClick={() => setShowExportModal(true)}
                            disabled={displayContacts.length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            <span className="hidden lg:inline">Export</span>
                        </button>

                        <button
                            onClick={() => setShowAddContactModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-500 rounded-lg text-sm text-white font-medium hover:bg-indigo-600 transition-all"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span className="hidden lg:inline">Add Contact</span>
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="relative sm:hidden">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="p-2 rounded-lg border bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <Bars3Icon className="w-4 h-4" />
                        </button>

                        {/* Mobile Dropdown Menu */}
                        <AnimatePresence>
                            {showMobileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-[#0d0d12] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                                >
                                    <button
                                        onClick={() => { setShowImportModal(true); setShowMobileMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 transition-colors"
                                    >
                                        <ArrowUpTrayIcon className="w-4 h-4" />
                                        Import Contacts
                                    </button>
                                    <button
                                        onClick={() => { setShowExportModal(true); setShowMobileMenu(false); }}
                                        disabled={displayContacts.length === 0}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                        Export Contacts
                                    </button>
                                    <div className="border-t border-white/10" />
                                    <button
                                        onClick={() => { setShowAddContactModal(true); setShowMobileMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-indigo-300 hover:bg-white/10 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Contact
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Filter Panel */}
                <FilterPanel
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    filters={filters}
                    onFiltersChange={setFilters}
                    availableTags={availableTags}
                    availableSources={availableSources}
                />

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                    {selectedContacts.size > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-indigo-500/10 border-b border-indigo-500/20 px-3 sm:px-4 py-2"
                        >
                            <div className="flex items-center gap-2 sm:gap-4">
                                <span className="text-xs sm:text-sm text-indigo-300 flex-shrink-0">
                                    {selectedContacts.size} selected
                                </span>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <button className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-white/80 bg-white/10 rounded-md hover:bg-white/20 transition-colors">
                                        <EnvelopeIcon className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Send Campaign</span>
                                    </button>
                                    <button
                                        onClick={() => setShowMoveModal(true)}
                                        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-white/80 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                                    >
                                        <FolderIcon className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Move</span>
                                    </button>
                                    <button
                                        onClick={handleDeleteContacts}
                                        disabled={isDeleting}
                                        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-red-300 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        )}
                                        <span className="hidden sm:inline">Delete</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => setSelectedContacts(new Set())}
                                    className="ml-auto text-xs text-white/40 hover:text-white transition-colors"
                                >
                                    <span className="hidden sm:inline">Clear selection</span>
                                    <span className="sm:hidden">Clear</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-[#0a0a10] border-b border-white/10">
                            <tr>
                                <th className="w-10 p-2 sm:p-3">
                                    <button
                                        onClick={toggleSelectAll}
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                            selectedContacts.size === displayContacts.length &&
                                            displayContacts.length > 0
                                                ? "bg-indigo-500 border-indigo-500"
                                                : "border-white/30 hover:border-white/50"
                                        }`}
                                    >
                                        {selectedContacts.size === displayContacts.length &&
                                            displayContacts.length > 0 && (
                                                <CheckIcon className="w-3 h-3 text-white" />
                                            )}
                                    </button>
                                </th>
                                <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wider p-2 sm:p-3">
                                    Name / Email
                                </th>
                                <th className="hidden md:table-cell text-left text-xs font-semibold text-white/50 uppercase tracking-wider p-3">
                                    Category
                                </th>
                                <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wider p-2 sm:p-3">
                                    Status
                                </th>
                                <th className="hidden sm:table-cell text-left text-xs font-semibold text-white/50 uppercase tracking-wider p-3">
                                    Last Emailed
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingContacts ? (
                                <tr>
                                    <td colSpan={5} className="p-8">
                                        <div className="flex items-center justify-center gap-3">
                                            <ArrowPathIcon className="w-5 h-5 text-white/30 animate-spin" />
                                            <span className="text-white/50">Loading contacts...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayContacts.map((contact) => (
                                    <motion.tr
                                        key={contact.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`border-b border-white/5 cursor-pointer transition-colors ${
                                            activeContactId === contact.id
                                                ? "bg-indigo-500/10"
                                                : "hover:bg-white/5"
                                        }`}
                                        onClick={() => setActiveContactId(contact.id)}
                                    >
                                        <td className="p-2 sm:p-3" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => toggleContact(contact.id)}
                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                                    selectedContacts.has(contact.id)
                                                        ? "bg-indigo-500 border-indigo-500"
                                                        : "border-white/30 hover:border-white/50"
                                                }`}
                                            >
                                                {selectedContacts.has(contact.id) && (
                                                    <CheckIcon className="w-3 h-3 text-white" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-2 sm:p-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {contact.name || contact.email}
                                                </p>
                                                {contact.name && (
                                                    <p className="text-xs text-white/50 truncate">{contact.email}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell p-3">
                                            {contact.categories && contact.categories.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {contact.categories.map((cat) => (
                                                        <span
                                                            key={cat.id}
                                                            className="inline-flex px-2 py-0.5 text-xs bg-indigo-500/15 text-indigo-300 rounded-md"
                                                        >
                                                            {cat.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-white/40">—</span>
                                            )}
                                        </td>
                                        <td className="p-2 sm:p-3">
                                            <StatusBadge status={contact.status} />
                                        </td>
                                        <td className="hidden sm:table-cell p-3">
                                            <span className="text-sm text-white/50">
                                                {contact.lastEmailedAt
                                                    ? formatDate(contact.lastEmailedAt)
                                                    : "Never"}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {!isLoadingContacts && displayContacts.length === 0 && (
                        <div className="text-center py-16">
                            <EnvelopeIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <p className="text-white/50 mb-2">
                                {isPlaceholderCategory
                                    ? "Coming soon"
                                    : "No contacts found"}
                            </p>
                            <p className="text-sm text-white/30">
                                {isPlaceholderCategory
                                    ? "Contacts from this university will be added soon"
                                    : searchQuery
                                    ? "Try adjusting your search"
                                    : "Import contacts to get started"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="border-t border-white/5 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm text-white/50 truncate">
                        {isPlaceholderCategory ? (
                            "0 contacts"
                        ) : (
                            <>
                                <span className="hidden sm:inline">Showing </span>
                                {displayContacts.length > 0 ? ((pagination.page - 1) * pagination.limit + 1) : 0}
                                {displayContacts.length > 0 ? `–${Math.min(pagination.page * pagination.limit, pagination.total)}` : ""} of {pagination.total}
                            </>
                        )}
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1 || isLoadingContacts}
                            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-white/50 bg-white/5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                        </button>
                        {pagination.totalPages > 1 && (
                            <span className="text-xs sm:text-sm text-white/40">
                                {pagination.page}/{pagination.totalPages}
                            </span>
                        )}
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || isLoadingContacts}
                            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-white/50 bg-white/5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Contact Detail Panel */}
            <SlideInPanel
                isOpen={activeContactId !== null}
                onClose={() => { setActiveContactId(null); setShowStatusConfirm(null); }}
                title={activeContact?.name || activeContact?.email || "Contact"}
                subtitle={activeContact?.organization || undefined}
                width="lg"
            >
                {activeContact && (
                    <>
                        <PanelSection title="Contact Information">
                            <PanelField label="Email" value={activeContact.email} />
                            {activeContact.name && (
                                <PanelField label="Name" value={activeContact.name} />
                            )}
                            {activeContact.organization && (
                                <PanelField label="Organisation" value={activeContact.organization} />
                            )}
                            <div className="space-y-1">
                                <p className="text-xs text-white/40 uppercase tracking-wide">Categories</p>
                                {activeContact.categories && activeContact.categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeContact.categories.map((cat) => (
                                            <span
                                                key={cat.id}
                                                className="inline-flex px-2.5 py-1 text-xs bg-indigo-500/15 text-indigo-300 rounded-md"
                                            >
                                                {cat.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-white/50">Uncategorised</p>
                                )}
                            </div>
                        </PanelSection>

                        <PanelSection title="Subscription">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={activeContact.status} />
                                        <span className="text-sm text-white/50">
                                            Added {formatDate(activeContact.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {activeContact.status === "unsubscribed" && activeContact.unsubscribedAt && (
                                    <p className="text-xs text-yellow-400/70">
                                        Unsubscribed on {formatDate(activeContact.unsubscribedAt)}
                                    </p>
                                )}

                                {/* Confirmation prompt */}
                                <AnimatePresence>
                                    {showStatusConfirm && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                                                <p className="text-sm text-white/70">
                                                    {showStatusConfirm === "unsubscribe"
                                                        ? "This contact will no longer receive campaign emails."
                                                        : "This contact will start receiving campaign emails again."}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateContactStatus(
                                                            activeContact.id,
                                                            showStatusConfirm === "unsubscribe" ? "unsubscribed" : "active"
                                                        )}
                                                        disabled={isUpdatingStatus}
                                                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                                            showStatusConfirm === "unsubscribe"
                                                                ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                                                                : "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                                        } disabled:opacity-50`}
                                                    >
                                                        {isUpdatingStatus
                                                            ? "Updating..."
                                                            : showStatusConfirm === "unsubscribe"
                                                                ? "Confirm Unsubscribe"
                                                                : "Confirm Reactivation"}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowStatusConfirm(null)}
                                                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action button */}
                                {!showStatusConfirm && (
                                    <button
                                        onClick={() => setShowStatusConfirm(
                                            activeContact.status === "unsubscribed" ? "reactivate" : "unsubscribe"
                                        )}
                                        className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            activeContact.status === "unsubscribed"
                                                ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                                        }`}
                                    >
                                        {activeContact.status === "unsubscribed"
                                            ? "Reactivate Subscription"
                                            : "Unsubscribe Contact"}
                                    </button>
                                )}
                            </div>
                        </PanelSection>

                        {activeContact.tags.length > 0 && (
                            <PanelSection title="Tags">
                                <div className="flex flex-wrap gap-2">
                                    {activeContact.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-1 text-xs bg-white/10 text-white/70 rounded-md"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </PanelSection>
                        )}

                        {activeContact.metadata && Object.keys(activeContact.metadata).length > 0 && (
                            <PanelSection title="Metadata">
                                {activeContact.metadata.memberCount && (
                                    <PanelField
                                        label="Member Count"
                                        value={String(activeContact.metadata.memberCount)}
                                    />
                                )}
                                {activeContact.metadata.relevanceScore && (
                                    <PanelField
                                        label="Relevance Score"
                                        value={`${activeContact.metadata.relevanceScore}/10`}
                                    />
                                )}
                                {activeContact.metadata.outreachPriority && (
                                    <PanelField
                                        label="Priority"
                                        value={
                                            <span
                                                className={`capitalize ${
                                                    activeContact.metadata.outreachPriority === "high"
                                                        ? "text-green-400"
                                                        : activeContact.metadata.outreachPriority === "medium"
                                                        ? "text-yellow-400"
                                                        : "text-white/60"
                                                }`}
                                            >
                                                {activeContact.metadata.outreachPriority}
                                            </span>
                                        }
                                    />
                                )}
                            </PanelSection>
                        )}

                        <PanelSection title="Email History">
                            {activeContact.lastEmailedAt ? (
                                <div className="text-sm text-white/60">
                                    Last emailed on {formatDate(activeContact.lastEmailedAt)}
                                </div>
                            ) : (
                                <div className="text-sm text-white/40">
                                    No emails sent to this contact yet
                                </div>
                            )}
                        </PanelSection>

                        <PanelActions>
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium text-sm">
                                <EnvelopeIcon className="w-4 h-4" />
                                Send Email
                            </button>
                            <button className="px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm">
                                Edit
                            </button>
                            <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-medium text-sm">
                                Delete
                            </button>
                        </PanelActions>
                    </>
                )}
            </SlideInPanel>

            {/* Import Modal */}
            <ImportWizard
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportContacts}
                categories={categories.filter(c => !c.id.startsWith("placeholder-"))}
                onAddCategory={async (parentId, name) => {
                    try {
                        const res = await fetch("/api/admin/campaigns/categories", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name, parentId }),
                        });
                        if (res.ok) {
                            const data = await res.json();
                            // Refresh categories
                            await fetchCategories();
                            return data.category;
                        }
                        return null;
                    } catch (error) {
                        console.error("Error adding category:", error);
                        return null;
                    }
                }}
            />

            {/* Add Contact Modal */}
            <AddContactModal
                isOpen={showAddContactModal}
                onClose={() => setShowAddContactModal(false)}
                onAdd={handleAddContact}
                categories={flatCategories()}
                defaultCategoryId={selectedCategoryId?.startsWith("placeholder-") ? null : selectedCategoryId}
            />

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                contacts={getExportContacts()}
                selectedCount={selectedContacts.size}
                categoryName={getSelectedCategoryName()}
            />

            {/* Move to Category Modal */}
            <AnimatePresence>
                {showMoveModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMoveModal(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div
                                className="w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-5 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <FolderIcon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Move to Category</h2>
                                            <p className="text-sm text-white/50">
                                                Move {selectedContacts.size} contact{selectedContacts.size !== 1 ? "s" : ""} to a category
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                                    <button
                                        onClick={() => handleMoveToCategory(null)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-all text-left"
                                    >
                                        <FolderIcon className="w-5 h-5 text-white/40" />
                                        <span>No category</span>
                                    </button>
                                    {flatCategories().map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleMoveToCategory(cat.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-all text-left"
                                        >
                                            <FolderIcon className="w-5 h-5 text-indigo-400" />
                                            <span>{cat.path}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center justify-end p-5 border-t border-white/10 bg-black/20">
                                    <button
                                        onClick={() => setShowMoveModal(false)}
                                        className="px-4 py-2.5 bg-white/10 text-white/80 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Category Picker */}
            <AnimatePresence>
                {showMobileCategoryPicker && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileCategoryPicker(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh]"
                        >
                            <div className="bg-[#0d0d12] border-t border-white/10 rounded-t-2xl shadow-2xl overflow-hidden">
                                {/* Handle */}
                                <div className="flex justify-center pt-3 pb-2">
                                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                                </div>

                                <div className="px-5 pb-3 border-b border-white/10">
                                    <h2 className="text-lg font-semibold text-white">Select Category</h2>
                                    <p className="text-sm text-white/50">
                                        Filter contacts by category
                                    </p>
                                </div>

                                <div className="p-3 space-y-1.5 max-h-[50vh] overflow-y-auto">
                                    <button
                                        onClick={() => {
                                            handleCategorySelect(null);
                                            setShowMobileCategoryPicker(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                                            !selectedCategoryId
                                                ? "bg-indigo-500/20 border border-indigo-500/50 text-white"
                                                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                                        }`}
                                    >
                                        <FolderIcon className="w-5 h-5 text-white/40" />
                                        <span>All Categories</span>
                                        {!selectedCategoryId && (
                                            <CheckIcon className="w-4 h-4 ml-auto text-indigo-400" />
                                        )}
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                handleCategorySelect(cat);
                                                setShowMobileCategoryPicker(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                                                selectedCategoryId === cat.id
                                                    ? "bg-indigo-500/20 border border-indigo-500/50 text-white"
                                                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                                            }`}
                                        >
                                            <FolderIcon
                                                className="w-5 h-5"
                                                style={{ color: cat.color || "rgb(99, 102, 241)" }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="block truncate">{cat.name}</span>
                                                {cat.contactCount !== undefined && cat.contactCount > 0 && (
                                                    <span className="text-xs text-white/40">
                                                        {cat.contactCount} contacts
                                                    </span>
                                                )}
                                            </div>
                                            {selectedCategoryId === cat.id && (
                                                <CheckIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Safe area padding for iOS */}
                                <div className="h-6 bg-[#0d0d12]" />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Rename Category Modal */}
            <AnimatePresence>
                {editingCategory && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setEditingCategory(null);
                                setNewCategoryName("");
                            }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div
                                className="w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-5 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="p-2 rounded-lg"
                                            style={{ backgroundColor: `${editingCategory.color || "#6366f1"}20` }}
                                        >
                                            <FolderIcon
                                                className="w-5 h-5"
                                                style={{ color: editingCategory.color || "#6366f1" }}
                                            />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Rename Category</h2>
                                            <p className="text-sm text-white/50">Change the category name</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingCategory(null);
                                            setNewCategoryName("");
                                        }}
                                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && newCategoryName.trim()) {
                                                handleRenameCategory();
                                            }
                                        }}
                                        placeholder="Enter category name"
                                        autoFocus
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10 bg-black/20">
                                    <button
                                        onClick={() => {
                                            setEditingCategory(null);
                                            setNewCategoryName("");
                                        }}
                                        className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRenameCategory}
                                        disabled={!newCategoryName.trim() || newCategoryName === editingCategory.name || isSavingCategory}
                                        className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSavingCategory ? "Saving..." : "Rename"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Category Confirmation Modal */}
            <AnimatePresence>
                {deletingCategory && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeletingCategory(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div
                                className="w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-4 p-5 border-b border-white/10">
                                    <div className="p-3 bg-red-500/20 rounded-full">
                                        <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Delete Category</h2>
                                        <p className="text-sm text-white/50">This action cannot be undone</p>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <p className="text-white/70">
                                        Are you sure you want to delete{" "}
                                        <span className="font-semibold text-white">{deletingCategory.name}</span>?
                                    </p>
                                    {deletingCategory.contactCount > 0 && (
                                        <p className="mt-3 text-sm text-yellow-400/80 bg-yellow-500/10 px-3 py-2 rounded-lg">
                                            This category contains {deletingCategory.contactCount} contact{deletingCategory.contactCount !== 1 ? "s" : ""}.
                                            These contacts will be moved to uncategorised.
                                        </p>
                                    )}
                                    {deletingCategory.children.length > 0 && (
                                        <p className="mt-3 text-sm text-orange-400/80 bg-orange-500/10 px-3 py-2 rounded-lg">
                                            This category has {deletingCategory.children.length} subcategory{deletingCategory.children.length !== 1 ? "ies" : ""}.
                                            They will also be deleted.
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10 bg-black/20">
                                    <button
                                        onClick={() => setDeletingCategory(null)}
                                        className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteCategory}
                                        disabled={isSavingCategory}
                                        className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSavingCategory ? "Deleting..." : "Delete Category"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Category/Subcategory Modal */}
            <AnimatePresence>
                {showAddCategoryModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setShowAddCategoryModal(false);
                                setAddingSubcategoryTo(null);
                                setNewCategoryName("");
                            }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div
                                className="w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-5 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <PlusIcon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">
                                                {addingSubcategoryTo ? "Add Subcategory" : "Add Category"}
                                            </h2>
                                            <p className="text-sm text-white/50">
                                                {addingSubcategoryTo ? "Create a new subcategory" : "Create a new root category"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowAddCategoryModal(false);
                                            setAddingSubcategoryTo(null);
                                            setNewCategoryName("");
                                        }}
                                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && newCategoryName.trim()) {
                                                handleAddSubcategory();
                                            }
                                        }}
                                        placeholder="Enter category name"
                                        autoFocus
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10 bg-black/20">
                                    <button
                                        onClick={() => {
                                            setShowAddCategoryModal(false);
                                            setAddingSubcategoryTo(null);
                                            setNewCategoryName("");
                                        }}
                                        className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddSubcategory}
                                        disabled={!newCategoryName.trim() || isSavingCategory}
                                        className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSavingCategory ? "Creating..." : "Create Category"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper components
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active: "bg-green-500/20 text-green-400",
        unsubscribed: "bg-yellow-500/20 text-yellow-400",
        bounced: "bg-red-500/20 text-red-400",
        complained: "bg-red-500/20 text-red-400",
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                styles[status] || "bg-white/10 text-white/60"
            }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    status === "active"
                        ? "bg-green-400"
                        : status === "bounced" || status === "complained"
                        ? "bg-red-400"
                        : "bg-yellow-400"
                }`}
            />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

// Helper functions
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}
