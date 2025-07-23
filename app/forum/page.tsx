'use client';

import { useState } from 'react';
import ForumControls from '../components/forum/forum-controls';
import PostList from '../components/forum/post-list';
import Sidebar from '../components/forum/sidebar';
import { ForumPost } from '@/types/forum-types';

const mockPosts: ForumPost[] = [
  {
    id: 1,
    title: "What does the fox say?",
    content: "Guys! So I was in the shower last day and it just popped in my head. What does the fox say? Like really. How do they sound when they speak. I know about dogs, cats, mouse, cow, etc but fox! Never heard of it.\n\nAnyways, if any of you guys have any idea. Let me know in the comments. Thanks in advance.",
    author: "Akash Ra Dahal",
    timeAgo: "19h ago",
    upvotes: 57,
    downvotes: 0,
    replies: 50,
    tags: ["animals", "sounds", "fox", "question"],
    avatar: "AD"
  },
  {
    id: 2,
    title: "Who was the first guy to land on the moon?",
    content: "Okay. This is embarrassing but I forgot the name of the guy who landed on the moon the first time.\n\nSorry if this sounds silly.",
    author: "Sriv Maharjan",
    timeAgo: "23h ago",
    upvotes: 1,
    downvotes: 0,
    replies: 89,
    tags: ["space", "history", "moon", "apollo"],
    avatar: "SM"
  }
];

const trendingTopics = [
  { name: "integration", count: 24 },
  { name: "design", count: 18 },
  { name: "api", count: 15 },
  { name: "react", count: 12 },
  { name: "portfolio", count: 9 }
];

const featuredUsers = [
  { username: "@devmaster", status: "online" },
  { username: "@uiqueen", status: "featured" }
];

export default function ForumPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Newest First');

  return (
    <main className='relative flex min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] text-white'>
      {/* Main Content */}
      <div className="flex-1 p-8 pt-8">
        <ForumControls 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <PostList posts={mockPosts} />
      </div>
      <Sidebar 
        trendingTopics={trendingTopics} 
        featuredUsers={featuredUsers} 
      />
    </main>
  );
}