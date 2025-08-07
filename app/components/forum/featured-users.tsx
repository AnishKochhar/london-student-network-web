'use client';

import { StarIcon } from '@heroicons/react/24/outline';
import { FeaturedUser } from '@/app/lib/types';

interface FeaturedUsersProps {
  users: FeaturedUser[];
}

export default function FeaturedUsers({ users }: FeaturedUsersProps) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <StarIcon className="w-5 h-5 text-yellow-400" />
        Featured Users
      </h3>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.username} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
            <span className="text-white/90">{user.username}</span>
            <div className="flex items-center gap-2">
              {user.status === 'online' ? (
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              ) : (
                <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}