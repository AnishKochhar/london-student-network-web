"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FolderIcon,
    FolderOpenIcon,
    ChevronRightIcon,
    PlusIcon,
    TagIcon,
    EllipsisHorizontalIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

export interface CategoryNode {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    color: string;
    icon: string;
    contactCount: number;
    children: CategoryNode[];
}

interface CategoryTreeProps {
    categories: CategoryNode[];
    selectedId: string | null;
    onSelect: (category: CategoryNode | null) => void;
    onAddCategory?: (parentId: string | null) => void;
    onEditCategory?: (category: CategoryNode) => void;
    onDeleteCategory?: (category: CategoryNode) => void;
    showCounts?: boolean;
    collapsible?: boolean;
}

// Recursively calculate total contacts including children
export function getTotalContacts(category: CategoryNode): number {
    const childrenTotal = category.children.reduce(
        (sum, child) => sum + getTotalContacts(child),
        0
    );
    return category.contactCount + childrenTotal;
}

// Calculate total contacts across all categories
function getAllContactsTotal(categories: CategoryNode[]): number {
    return categories.reduce((sum, cat) => sum + getTotalContacts(cat), 0);
}

export default function CategoryTree({
    categories,
    selectedId,
    onSelect,
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    showCounts = true,
    collapsible = true,
}: CategoryTreeProps) {
    const totalContacts = useMemo(() => getAllContactsTotal(categories), [categories]);

    return (
        <div className="space-y-1">
            {/* All Contacts option */}
            <button
                onClick={() => onSelect(null)}
                className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-all duration-150 text-left group
                    ${selectedId === null
                        ? "bg-indigo-500/20 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }
                `}
            >
                <TagIcon className="w-4 h-4 flex-shrink-0 text-white/50" />
                <span className="text-sm font-medium flex-1">All Contacts</span>
                {showCounts && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedId === null
                            ? "bg-indigo-500/30 text-indigo-200"
                            : "bg-white/10 text-white/50"
                    }`}>
                        {totalContacts}
                    </span>
                )}
            </button>

            {/* Category nodes */}
            {categories.map((category) => (
                <CategoryItem
                    key={category.id}
                    category={category}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onAddCategory={onAddCategory}
                    onEditCategory={onEditCategory}
                    onDeleteCategory={onDeleteCategory}
                    showCounts={showCounts}
                    collapsible={collapsible}
                    depth={0}
                />
            ))}

            {/* Add Category button */}
            {onAddCategory && (
                <button
                    onClick={() => onAddCategory(null)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all duration-150 mt-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="text-sm">Add Category</span>
                </button>
            )}
        </div>
    );
}

interface CategoryItemProps {
    category: CategoryNode;
    selectedId: string | null;
    onSelect: (category: CategoryNode | null) => void;
    onAddCategory?: (parentId: string | null) => void;
    onEditCategory?: (category: CategoryNode) => void;
    onDeleteCategory?: (category: CategoryNode) => void;
    showCounts: boolean;
    collapsible: boolean;
    depth: number;
}

function CategoryItem({
    category,
    selectedId,
    onSelect,
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    showCounts,
    collapsible,
    depth,
}: CategoryItemProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const hasChildren = category.children.length > 0;
    const isSelected = selectedId === category.id;
    const isParentSelected = category.children.some(
        (child) => child.id === selectedId || isChildSelected(child, selectedId)
    );

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMenu]);

    // Calculate total including children
    const totalContacts = useMemo(() => getTotalContacts(category), [category]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (collapsible && hasChildren) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleSelect = () => {
        onSelect(category);
    };

    const hasManagementOptions = onEditCategory || onDeleteCategory || onAddCategory;

    return (
        <div>
            <div
                className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                    transition-all duration-150 group relative
                    ${isSelected
                        ? "bg-indigo-500/20 text-white"
                        : isParentSelected
                        ? "text-white/80"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }
                `}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleSelect}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Expand/collapse button */}
                {hasChildren && collapsible ? (
                    <button
                        onClick={handleToggle}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors"
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <ChevronRightIcon className="w-3.5 h-3.5 text-white/40" />
                        </motion.div>
                    </button>
                ) : (
                    <div className="w-4" /> // Spacer
                )}

                {/* Folder icon — coloured by category */}
                {hasChildren && isExpanded ? (
                    <FolderOpenIcon
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: category.color }}
                    />
                ) : (
                    <FolderIcon
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: category.color }}
                    />
                )}

                {/* Name */}
                <span className="text-sm font-medium truncate flex-1 min-w-0">
                    {category.name}
                </span>

                {/* Count badge - shows total including children */}
                {showCounts && (
                    <span
                        className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            isSelected
                                ? "bg-indigo-500/30 text-indigo-200"
                                : "bg-white/10 text-white/50"
                        }`}
                    >
                        {totalContacts}
                    </span>
                )}

                {/* Three-dot menu button */}
                {hasManagementOptions && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all flex-shrink-0"
                        >
                            <EllipsisHorizontalIcon className="w-4 h-4 text-white/40" />
                        </button>

                        {/* Dropdown menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-1 z-[200] w-40 bg-[#1a1a22] border border-white/10 rounded-lg shadow-xl overflow-hidden"
                                >
                                    {onEditCategory && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(false);
                                                onEditCategory(category);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                            Rename
                                        </button>
                                    )}
                                    {onAddCategory && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(false);
                                                onAddCategory(category.id);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Add Subcategory
                                        </button>
                                    )}
                                    {onDeleteCategory && (
                                        <>
                                            <div className="border-t border-white/10" />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(false);
                                                    onDeleteCategory(category);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Full name tooltip on hover */}
                <AnimatePresence>
                    {isHovered && !showMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 top-full mt-1.5 z-[100] px-2.5 py-1.5 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl whitespace-nowrap pointer-events-none"
                            style={{ marginLeft: `${depth * 16 + 8}px` }}
                        >
                            <span className="text-xs text-white font-medium">{category.name}</span>
                            <span className="text-xs text-white/50 ml-2">({getTotalContacts(category)})</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Children */}
            <AnimatePresence initial={false}>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-visible"
                    >
                        {category.children.map((child) => (
                            <CategoryItem
                                key={child.id}
                                category={child}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                onAddCategory={onAddCategory}
                                onEditCategory={onEditCategory}
                                onDeleteCategory={onDeleteCategory}
                                showCounts={showCounts}
                                collapsible={collapsible}
                                depth={depth + 1}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper to check if a child is selected
function isChildSelected(category: CategoryNode, selectedId: string | null): boolean {
    if (category.id === selectedId) return true;
    return category.children.some((child) => isChildSelected(child, selectedId));
}

// Empty state for when there are no categories
export function EmptyCategoryTree({
    onAddCategory,
}: {
    onAddCategory: () => void;
}) {
    return (
        <div className="text-center py-8 px-4">
            <FolderIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50 mb-4">No categories yet</p>
            <button
                onClick={onAddCategory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium"
            >
                <PlusIcon className="w-4 h-4" />
                Create Category
            </button>
        </div>
    );
}
