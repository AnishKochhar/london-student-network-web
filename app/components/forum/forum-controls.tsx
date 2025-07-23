'use client';

import { useState } from 'react';
import { PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ForumControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (option: string) => void;
}

export default function ForumControls({ 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy 
}: ForumControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const sortOptions = ["Newest First", "Most Popular", "Most Replies"];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 relative z-20">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search threads, topics, or users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      
      <div className="flex gap-4">
        <div className="relative z-30">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-2 w-40 px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <span>{sortBy}</span>
            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-[#064580] border border-white/20 rounded-lg overflow-hidden shadow-xl">
              {sortOptions.map((option) => (
                <div 
                  key={option} 
                  className={`px-4 py-2 cursor-pointer hover:bg-white/20 transition-colors ${sortBy === option ? 'bg-white/10' : ''}`}
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
        
        <button className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
          <PlusIcon className="w-5 h-5" />
          Start New Thread
        </button>
      </div>
    </div>
  );
}
