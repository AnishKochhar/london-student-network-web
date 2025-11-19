import type { Event } from '@/app/lib/types';
import type { EventFilterScore, LLMFilterResponse } from '@/app/lib/types/linkedin';
import { BaseLLMClient } from './base-client';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiClient extends BaseLLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    super();
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }
  }

  /**
   * Filter events to select the best 1-2 for LinkedIn posting
   */
  async filterEvents(events: Event[]): Promise<EventFilterScore[]> {
    const systemPrompt = `You are an expert at selecting engaging student events for LinkedIn posts.
Analyze the provided events and select the 1-2 BEST events to feature based on:
1. Broad appeal to London students
2. Uniqueness or special nature of the event
3. Good timing (not too far in future, not too soon)
4. Diverse event types (prefer variety)

Return a JSON object with selected events and scores (1-10).`;

    const userPrompt = `Here are the upcoming events:

${events.map((e, i) => `
Event ${i + 1}:
- Title: ${e.title}
- Organizer: ${e.organiser}
- Date: ${e.start_datetime ? new Date(e.start_datetime).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not specified'}
- Type: ${e.event_type}
- Description: ${e.description.substring(0, 200)}...
- ID: ${e.id}
`).join('\n')}

Select 1-2 events and provide scores with reasoning.`;

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt + '\n\n' + userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const content = result.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(content) as LLMFilterResponse;

      return parsed.selected_events || [];
    } catch (error) {
      console.error('[Gemini] Event filtering failed:', error);
      throw error;
    }
  }

  /**
   * Generate a LinkedIn post for selected events
   */
  async generatePost(events: Event[]): Promise<string> {
    const systemPrompt = `You are a social media manager for London Student Network, writing LinkedIn posts to promote student events.

Style guidelines:
- Friendly, professional, and engaging tone
- Use 1-2 relevant emojis maximum
- Length: 800-2000 characters
- Structure: Hook → Event highlights → Call-to-action → Hashtags
- Include event details: date, time, location, registration link
- Use 3-5 relevant hashtags at the end
- Focus on benefits and what makes events special

Write posts that excite students and encourage registration!`;

    const userPrompt = `Create a LinkedIn post featuring these event(s):

${events.map((e, i) => `
Event ${i + 1}:
- Title: ${e.title}
- Organizer: ${e.organiser}
- Date: ${e.start_datetime ? new Date(e.start_datetime).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date not specified'}
- Location: ${e.location_building}${e.location_area ? `, ${e.location_area}` : ''}
- Type: ${e.event_type}
- Description: ${e.description}
- Registration: https://londonstudent.network/events/${e.id}
`).join('\n---\n')}

Write an engaging LinkedIn post that highlights what makes ${events.length > 1 ? 'these events' : 'this event'} special.`;

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt + '\n\n' + userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 800,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const postContent = result.candidates[0].content.parts[0].text.trim();

      // Validate length
      if (postContent.length > 3000) {
        console.warn('[Gemini] Generated post too long, truncating...');
        return postContent.substring(0, 2997) + '...';
      }

      return postContent;
    } catch (error) {
      console.error('[Gemini] Post generation failed:', error);
      throw error;
    }
  }
}
