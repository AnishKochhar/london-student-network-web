'use client';

import { FireIcon } from '@heroicons/react/24/outline';
import { TrendingTopic } from '@/app/lib/types';

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

export default function TrendingTopics({ topics }: TrendingTopicsProps) {
  return (
    <div className="mb-8">
      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <FireIcon className="w-5 h-5 text-orange-400" />
        Trending Topics
      </h3>
      <div className="space-y-3">
        {topics.map((topic) => (
          <div key={topic.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
            <span className="text-white/90">{topic.name}</span>
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              {topic.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}