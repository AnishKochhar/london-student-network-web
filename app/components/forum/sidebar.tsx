'use client';

import TrendingTopics from './trending-topics';
import FeaturedUsers from './featured-users';
import { useTrendingTopics } from './hooks/useTrendingTopics';
import { FeaturedUser } from '@/app/lib/types';

interface SidebarProps {
  featuredUsers: FeaturedUser[];
}

export default function Sidebar({ featuredUsers }: SidebarProps) {
  const { topics, isLoading, error } = useTrendingTopics();
  
  return (
    <aside className="w-80 p-6 border-l border-white/10 bg-white/5 backdrop-blur">
      {isLoading ? (
        <div className="mb-8">
          <div className="flex items-center gap-2 text-lg font-semibold mb-4">
            <div className="w-5 h-5 bg-white/20 rounded-full animate-pulse" />
            <div className="w-32 h-6 bg-white/20 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="w-24 h-4 bg-white/20 rounded animate-pulse" />
                <div className="w-8 h-6 bg-white/20 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-red-400 mb-8">Failed to load trending topics</div>
      ) : (
        <TrendingTopics topics={topics} />
      )}
      <FeaturedUsers />
    </aside>
  );
}