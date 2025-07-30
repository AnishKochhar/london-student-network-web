'use client';

import { useState } from 'react';
import ForumControls from '../components/forum/forum-controls';
import PostList from '../components/forum/post-list';
import Sidebar from '../components/forum/sidebar';
import ThreadDetailModal from '../components/forum/detail-thread-modal';
import { ForumPost, ThreadData, Reply } from '@/types/forum-types';

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

// Mock thread data with replies for the modal
const mockThreadData: { [key: number]: ThreadData } = {
  1: {
    id: 1,
    title: "What does the fox say?",
    content: "Guys! So I was in the shower last day and it just popped in my head. What does the fox say? Like really. How do they sound when they speak. I know about dogs, cats, mouse, cow, etc but fox! Never heard of it.\n\nAnyways, if any of you guys have any idea. Let me know in the comments. Thanks in advance.",
    author: "Akash Ra Dahal",
    avatar: "AD",
    timeAgo: "19h ago",
    upvotes: 57,
    downvotes: 2,
    tags: ["animals", "sounds", "fox", "question"],
    replies: [
      {
        id: 1,
        author: "Nature Expert",
        avatar: "NE",
        content: "Foxes actually make a variety of sounds! They can bark, yip, scream, and even make chattering sounds. The most common sound is a short, sharp bark.",
        timeAgo: "18h ago",
        upvotes: 23,
        downvotes: 0
      },
      {
        id: 2,
        author: "Wildlife Enthusiast",
        avatar: "WE",
        content: "I've heard foxes in the wild and they can be quite loud! During mating season, they make an eerie scream-like sound that can be pretty startling if you're not expecting it.",
        timeAgo: "17h ago",
        upvotes: 15,
        downvotes: 1
      },
      {
        id: 3,
        author: "Fox Owner",
        avatar: "FO",
        content: "I actually own a fox (legally, with permits) and they're quite vocal! They make different sounds for different emotions - excited chattering, warning barks, and content purring sounds.",
        timeAgo: "16h ago",
        upvotes: 31,
        downvotes: 0
      }
    ]
  },
  2: {
    id: 2,
    title: "Who was the first guy to land on the moon?",
    content: "Okay. This is embarrassing but I forgot the name of the guy who landed on the moon the first time.\n\nSorry if this sounds silly.",
    author: "Sriv Maharjan",
    avatar: "SM",
    timeAgo: "23h ago",
    upvotes: 1,
    downvotes: 0,
    tags: ["space", "history", "moon", "apollo"],
    replies: [
      {
        id: 1,
        author: "Space Historian",
        avatar: "SH",
        content: "Neil Armstrong was the first person to walk on the moon on July 20, 1969, during the Apollo 11 mission. Buzz Aldrin joined him shortly after!",
        timeAgo: "22h ago",
        upvotes: 45,
        downvotes: 0
      },
      {
        id: 2,
        author: "Apollo Fan",
        avatar: "AF",
        content: "Don't feel embarrassed! It's Neil Armstrong. Fun fact: he said the famous words 'That's one small step for man, one giant leap for mankind' when he first stepped on the lunar surface.",
        timeAgo: "21h ago",
        upvotes: 28,
        downvotes: 0
      }
    ]
  }
};

const trendingTopics = [
  { name: "integration", count: 24 },
  { name: "design", count: 18 },
  { name: "api", count: 15 },
  { name: "react", count: 12 },
  { name: "portfolio", count: 9 }
];

const featuredUsers = [
  { username: "@devmaster", status: "online" as const },
  { username: "@uiqueen", status: "featured" as const }
];

export default function ForumPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Newest First');
  const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostClick = (postId: number) => {
    const threadData = mockThreadData[postId];
    if (threadData) {
      setSelectedThread(threadData);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedThread(null);
  };

  const handleNewThread = (threadData: { title: string; content: string; tags: string[] }) => {
    console.log('New thread created:', threadData);
    // Here you would typically add the new thread to your posts state
    // or make an API call to create the thread
  };

  return (
    <main className='relative flex min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] text-white'>
      {/* Main Content */}
      <div className="flex-1 p-8 pt-8">
        <ForumControls 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onNewThread={handleNewThread}
        />
        <PostList 
          posts={mockPosts} 
          onPostClick={handlePostClick}
        />
      </div>
      <Sidebar 
        trendingTopics={trendingTopics} 
        featuredUsers={featuredUsers} 
      />

      {/* Thread Detail Modal */}
      <ThreadDetailModal
        isOpen={isModalOpen}
        thread={selectedThread}
        onClose={handleCloseModal}
      />
    </main>
  );
}
