"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FilterSystem from "@/app/components/societies/filter-system";
import EnhancedSocietyCard from "@/app/components/societies/enhanced-society-card";
import { CardSkeleton } from "@/app/components/societies/skeletons";
import { Loader2, AlertCircle, Filter } from "lucide-react";
import SmartSearch from "@/app/components/societies/smart-search";
import { TAG_CATEGORIES } from "@/app/utils/tag-categories";

interface Society {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  tags: number[];
  university: string | null;
}

interface FilterState {
  categories: string[];
  tags: number[];
  search: string;
  university: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function EnhancedSocietiesPage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    tags: [],
    search: "",
    university: ""
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Debounced search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Single useCallback for filter changes (used by both desktop and mobile)
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      categories: newFilters.categories,
      tags: newFilters.tags,
      university: newFilters.university
    }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Build query parameters
  const buildQueryParams = useCallback((page: number = 1) => {
    const params = new URLSearchParams();

    if (filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    }
    if (filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
    }
    if (filters.university.trim()) {
      params.set('university', filters.university.trim());
    }

    params.set('page', page.toString());
    params.set('limit', '100'); // Use constant limit instead of pagination.limit

    const queryString = params.toString();
    console.log('Built query params:', queryString, {
      filters,
      debouncedSearch,
      page
    });
    return queryString;
  }, [filters, debouncedSearch]);

  // Fetch societies
  const fetchSocieties = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const queryString = buildQueryParams(page);
      const response = await fetch(`/api/societies/filter?${queryString}`);

      if (!response.ok) {
        throw new Error('Failed to fetch societies');
      }

      const data = await response.json();

      if (data.success) {
        if (isLoadMore) {
          setSocieties(prev => [...prev, ...data.societies]);
        } else {
          setSocieties(data.societies);
        }
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch societies');
      }
    } catch (error) {
      console.error('Error fetching societies:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQueryParams]);


  // Load more societies
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loadingMore) {
      fetchSocieties(pagination.page + 1, true);
    }
  }, [pagination.hasMore, pagination.page, loadingMore, fetchSocieties]);

  // Fetch societies when filters change (but debounced for search)
  useEffect(() => {
    console.log('Filters changed, fetching societies:', {
      categories: filters.categories,
      tags: filters.tags,
      debouncedSearch,
      university: filters.university
    });
    fetchSocieties(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.categories, filters.tags, debouncedSearch, filters.university]);

  // Initial load
  useEffect(() => {
    fetchSocieties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            London Student Societies
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">
            Discover amazing student societies across London universities. Connect, learn, and grow with like-minded students.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SmartSearch
              value={filters.search}
              onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
              onTagSelect={(tagValue) => {
                // Find which category this tag belongs to and add it
                const category = TAG_CATEGORIES.find(cat =>
                  cat.tags.some(tag => tag.value === tagValue)
                );
                if (category) {
                  setFilters(prev => {
                    const newFilters = {
                      ...prev,
                      categories: prev.categories.includes(category.id)
                        ? prev.categories
                        : [...prev.categories, category.id],
                      tags: prev.tags.includes(tagValue)
                        ? prev.tags
                        : [...prev.tags, tagValue]
                    };
                    console.log('SmartSearch tag selected:', { tagValue, category: category.id, newFilters });
                    return newFilters;
                  });
                }
              }}
              placeholder="Search societies or select tags..."
            />
          </div>
        </div>

        {/* Desktop Filter Toggle */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">
              {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
            </span>
            <motion.div
              animate={{ rotate: sidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.button>

          {/* Results indicator */}
          <div className="text-sm text-gray-400">
            {pagination.total} societ{pagination.total !== 1 ? 'ies' : 'y'} found
          </div>
        </div>

        <div className="lg:flex lg:gap-8 relative">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-80 flex-shrink-0 overflow-hidden"
                >
                  <div className="w-80 pr-8">
                    <div className="sticky top-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                      <FilterSystem
                        onFiltersChange={handleFiltersChange}
                        totalResults={pagination.total}
                        selectedCategories={filters.categories}
                        selectedTags={filters.tags}
                      />
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Filter (always visible on mobile) */}
          <aside className="lg:hidden mb-8">
            <FilterSystem
              onFiltersChange={handleFiltersChange}
              totalResults={pagination.total}
              selectedCategories={filters.categories}
              selectedTags={filters.tags}
            />
          </aside>

          {/* Main Content */}
          <div className="lg:flex-1 min-w-0">
            {/* Loading State */}
            {loading && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${
                sidebarOpen ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
              }`}>
                {Array.from({ length: 12 }).map((_, index) => (
                  <CardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                  onClick={() => fetchSocieties()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Societies Grid */}
            {!loading && !error && (
              <>
                {societies.length > 0 ? (
                  <>
                    <motion.div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ${
                        sidebarOpen ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {societies.map((society, index) => (
                        <motion.div
                          key={society.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <EnhancedSocietyCard society={society} />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Load More Button */}
                    {pagination.hasMore && (
                      <div className="text-center">
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 mx-auto min-w-[200px] justify-center"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Loading more...
                            </>
                          ) : (
                            `Load More (${pagination.total - societies.length} remaining)`
                          )}
                        </button>
                      </div>
                    )}

                    {/* Results Summary */}
                    <div className="text-center mt-8 pt-8 border-t border-white/10">
                      <p className="text-gray-400 text-sm">
                        Showing {societies.length} of {pagination.total} societies
                        {(filters.categories.length > 0 || filters.tags.length > 0 || filters.search || filters.university) &&
                          " (filtered)"
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  /* Empty State */
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">🔍</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No societies found</h3>
                    <p className="text-gray-400 mb-6">
                      {filters.categories.length > 0 || filters.tags.length > 0 || filters.search || filters.university
                        ? "Try adjusting your filters to see more results."
                        : "It looks like there are no societies available right now."
                      }
                    </p>
                    {(filters.categories.length > 0 || filters.tags.length > 0 || filters.search || filters.university) && (
                      <button
                        onClick={() => setFilters({
                          categories: [],
                          tags: [],
                          search: "",
                          university: ""
                        })}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}