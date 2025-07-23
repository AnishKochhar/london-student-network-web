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
}

export interface TrendingTopic {
  name: string;
  count: number;
}

export interface FeaturedUser {
  username: string;
  status: string;
}