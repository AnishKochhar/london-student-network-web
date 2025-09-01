'use client';

import { useState } from 'react';
import { PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ForumControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onNewThread: () => void;
}

export default function ForumControls({ 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy,
  onNewThread
}: ForumControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const sortOptions = ["Newest First", "Most Popular", "Most Replies"];

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-20 items-center">
      {/* Search input - takes remaining space */}
      <div className="w-full flex-1">
        <input
          type="text"
          placeholder="Search threads, topics, or users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      
      {/* Sort dropdown - fixed width */}
      <div className="relative z-30 w-full sm:w-[200px] flex-shrink-0">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <span className="truncate">{sortBy}</span>
          <ChevronDownIcon className={`w-4 h-4 flex-shrink-0 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-[#064580] border border-white/20 rounded-lg overflow-hidden shadow-xl">
            {sortOptions.map((option) => (
              <div 
                key={option} 
                className={`px-3 py-2 cursor-pointer hover:bg-white/20 transition-colors ${sortBy === option ? 'bg-white/10' : ''}`}
                onClick={() => {
                  setSortBy(option);
                  setIsDropdownOpen(false);
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Start Thread button - fixed width */}
      <button 
        onClick={onNewThread}
        className="w-full sm:w-[200px] flex-shrink-0 flex items-center justify-center gap-1 px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <PlusIcon className="w-4 h-4" />
        <span className="whitespace-nowrap">Start Thread</span>
      </button>
    </div>
  );
}