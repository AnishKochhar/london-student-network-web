// LinkedIn API Types

export interface LinkedInPostQueue {
  id: string;
  post_content: string;
  event_ids: string[];
  status: 'pending' | 'approved' | 'rejected' | 'published';
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  published_at: string | null;
  rejection_reason: string | null;
  linkedin_post_id: string | null;
  auto_approved: boolean;
  event_data: Record<string, unknown> | null;
  error_log: string | null;
}

export interface LinkedInPostRequest {
  author: string; // Organization URN
  lifecycleState: 'PUBLISHED';
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: 'NONE';
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC';
  };
}

export interface LinkedInPostResponse {
  id: string;
  lifecycleState: string;
  created: {
    time: number;
  };
}

export interface EventFilterScore {
  event_id: string;
  score: number;
  reasoning: string;
}

export interface LLMFilterResponse {
  selected_events: EventFilterScore[];
}

export interface LLMPostResponse {
  post_content: string;
}
