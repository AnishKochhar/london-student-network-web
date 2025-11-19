import type { Event } from '@/app/lib/types';
import type { EventFilterScore } from '@/app/lib/types/linkedin';

/**
 * Abstract base class for LLM providers
 */
export abstract class BaseLLMClient {
  abstract filterEvents(events: Event[]): Promise<EventFilterScore[]>;
  abstract generatePost(events: Event[]): Promise<string>;
}

/**
 * Factory function to create LLM client based on environment config
 */
export async function createLLMClient(): Promise<BaseLLMClient> {
  const provider = process.env.LLM_PROVIDER || 'openai';

  switch (provider.toLowerCase()) {
    case 'openai': {
      // Dynamic import to avoid loading unnecessary dependencies
      const { OpenAIClient } = await import('./openai-client');
      return new OpenAIClient();
    }

    case 'gemini':
    case 'google': {
      const { GeminiClient } = await import('./gemini-client');
      return new GeminiClient();
    }

    case 'anthropic':
    case 'claude': {
      const { ClaudeClient } = await import('./claude-client');
      return new ClaudeClient();
    }

    default: {
      console.warn(`Unknown LLM provider: ${provider}, defaulting to OpenAI`);
      const { OpenAIClient: DefaultClient } = await import('./openai-client');
      return new DefaultClient();
    }
  }
}
