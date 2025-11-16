import type { Event } from '@/app/lib/types';
import type { EventFilterScore, LLMFilterResponse } from '@/app/lib/types/linkedin';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

export class OpenAIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
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
      const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      const parsed = JSON.parse(content) as LLMFilterResponse;

      return parsed.selected_events || [];
    } catch (error) {
      console.error('[OpenAI] Event filtering failed:', error);
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
      const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const postContent = result.choices[0].message.content.trim();

      // Validate length
      if (postContent.length > 3000) {
        console.warn('[OpenAI] Generated post too long, truncating...');
        return postContent.substring(0, 2997) + '...';
      }

      return postContent;
    } catch (error) {
      console.error('[OpenAI] Post generation failed:', error);
      throw error;
    }
  }
}
