import type { LinkedInPostRequest, LinkedInPostResponse } from '@/app/lib/types/linkedin';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export class LinkedInClient {
  private accessToken: string;
  private organizationUrn: string;

  constructor(accessToken?: string, organizationUrn?: string) {
    this.accessToken = accessToken || process.env.LINKEDIN_ACCESS_TOKEN || '';
    this.organizationUrn = organizationUrn || process.env.LINKEDIN_ORGANIZATION_URN || '';

    if (!this.accessToken || !this.organizationUrn) {
      throw new Error('LinkedIn credentials not configured');
    }
  }

  /**
   * Publish a text post to LinkedIn organization page
   */
  async publishPost(content: string): Promise<LinkedInPostResponse> {
    const postData: LinkedInPostRequest = {
      author: this.organizationUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    try {
      const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as LinkedInPostResponse;
      return result;
    } catch (error) {
      console.error('[LinkedIn] Failed to publish post:', error);
      throw error;
    }
  }

  /**
   * Verify token is valid by making a test API call
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await fetch(`${LINKEDIN_API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[LinkedIn] Token verification failed:', error);
      return false;
    }
  }
}
