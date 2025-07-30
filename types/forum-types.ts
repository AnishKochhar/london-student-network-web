export interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  replies: number;
  tags: string[];
  avatar: string;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
}

export interface Reply {
  id: number;
  author: string;
  avatar: string;
  content: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  isLiked?: boolean;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
}

export interface ThreadData {
  id: number;
  title: string;
  content: string;
  author: string;
  avatar: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  replies: Reply[];
  tags: string[];
  isUpvoted?: boolean;
  isDownvoted?: boolean;
}

export interface TrendingTopic {
  name: string;
  count: number;
}

export interface FeaturedUser {
  username: string;
  status: 'online' | 'featured';
}