'use client';

import { useEffect, useState } from 'react';
import { StarIcon, ChatBubbleLeftRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { FeaturedUser } from '@/app/lib/types';
import * as userService from '@/app/lib/services/thread-service';

interface FeaturedUsersProps {
  users?: FeaturedUser[];
}

interface TopUser extends FeaturedUser {
  displayName: string;
  userId: string;
  avatar: string;
  stats: {
    threads: number;
    comments: number;
    totalActivity: number;
  };
}

export default function FeaturedUsers({ users: initialUsers }: FeaturedUsersProps) {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetching if initial users were provided
    if (initialUsers) {
      setUsers(initialUsers as TopUser[]);
      setIsLoading(false);
      return;
    }

    async function loadTopUsers() {
      try {
        const data = await userService.fetchTopUsers();
        setUsers(data);
      } catch (err) {
        setError('Could not load top contributors');
      } finally {
        setIsLoading(false);
      }
    }

    loadTopUsers();
  }, [initialUsers]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <h3 className="h-6 bg-white/10 rounded w-1/2 mb-4"></h3>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg mb-3"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Featured Users</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <StarIcon className="w-5 h-5 text-yellow-400" />
        Top Contributors
      </h3>
      <div className="space-y-3">
        {users.map((user) => (
          <div 
            key={user.username} 
            className="flex flex-col p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/90 font-medium">{user.displayName || user.username}</span>
              <div className="flex items-center gap-2">
                {user.status === 'online' ? (
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                ) : (
                  <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                )}
              </div>
            </div>
            
            {/* Activity stats */}
            <div className="flex items-center gap-3 text-xs text-white/70">
              <div className="flex items-center gap-1">
                <DocumentTextIcon className="w-3 h-3" />
                <span>{user.stats.threads}</span>
              </div>
              <div className="flex items-center gap-1">
                <ChatBubbleLeftRightIcon className="w-3 h-3" />
                <span>{user.stats.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}