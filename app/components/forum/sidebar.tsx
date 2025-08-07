'use client';

import TrendingTopics from './trending-topics';
import FeaturedUsers from './featured-users';
import { TrendingTopic, FeaturedUser } from '@/app/lib/types';

interface SidebarProps {
  trendingTopics: TrendingTopic[];
  featuredUsers: FeaturedUser[];
}

export default function Sidebar({ trendingTopics, featuredUsers }: SidebarProps) {
  return (
    <aside className="w-80 p-6 border-l border-white/10 bg-white/5 backdrop-blur">
      <TrendingTopics topics={trendingTopics} />
      <FeaturedUsers users={featuredUsers} />
    </aside>
  );
}
