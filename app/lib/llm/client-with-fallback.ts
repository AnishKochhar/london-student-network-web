import type { Event } from '@/app/lib/types';
import type { EventFilterScore } from '@/app/lib/types/linkedin';
import { BaseLLMClient } from './base-client';
import { createLLMClient } from './base-client';

/**
 * LLM Client with automatic fallback support
 * Tries primary provider first, falls back to alternatives on failure
 */
export class LLMClientWithFallback extends BaseLLMClient {
  private providers: BaseLLMClient[];
  private providerNames: string[];
  private initPromise: Promise<void>;

  constructor() {
    super();
    this.providerNames = [];
    this.providers = [];
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    // Get fallback providers from env (comma-separated)
    // Example: LLM_FALLBACK_PROVIDERS="gemini,openai,anthropic"
    const fallbackProviders = (process.env.LLM_FALLBACK_PROVIDERS || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    // Add primary provider
    try {
      const primary = await createLLMClient();
      this.providers.push(primary);
      this.providerNames.push(process.env.LLM_PROVIDER || 'openai');
    } catch (error) {
      console.warn('[LLM Fallback] Primary provider failed to initialize:', error);
    }

    // Add fallback providers
    for (const providerName of fallbackProviders) {
      try {
        const previousProvider = process.env.LLM_PROVIDER;
        process.env.LLM_PROVIDER = providerName;
        const fallback = await createLLMClient();
        this.providers.push(fallback);
        this.providerNames.push(providerName);
        process.env.LLM_PROVIDER = previousProvider; // Restore
      } catch (error) {
        console.warn(`[LLM Fallback] Failed to initialize fallback provider ${providerName}:`, error);
      }
    }

    if (this.providers.length === 0) {
      throw new Error('No LLM providers available');
    }

    console.log(`[LLM Fallback] Initialized with providers: ${this.providerNames.join(' → ')}`);
  }

  /**
   * Filter events with automatic fallback
   */
  async filterEvents(events: Event[]): Promise<EventFilterScore[]> {
    await this.initPromise;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const providerName = this.providerNames[i];

      try {
        console.log(`[LLM Fallback] Attempting event filtering with ${providerName}...`);
        const result = await provider.filterEvents(events);
        console.log(`[LLM Fallback] ✅ ${providerName} succeeded`);
        return result;
      } catch (error) {
        console.error(`[LLM Fallback] ❌ ${providerName} failed:`, error);

        // If this is the last provider, throw the error
        if (i === this.providers.length - 1) {
          throw new Error(`All LLM providers failed. Last error: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Otherwise, try next provider
        console.log(`[LLM Fallback] Falling back to ${this.providerNames[i + 1]}...`);
      }
    }

    throw new Error('No LLM providers available');
  }

  /**
   * Generate post with automatic fallback
   */
  async generatePost(events: Event[]): Promise<string> {
    await this.initPromise;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const providerName = this.providerNames[i];

      try {
        console.log(`[LLM Fallback] Attempting post generation with ${providerName}...`);
        const result = await provider.generatePost(events);
        console.log(`[LLM Fallback] ✅ ${providerName} succeeded`);
        return result;
      } catch (error) {
        console.error(`[LLM Fallback] ❌ ${providerName} failed:`, error);

        // If this is the last provider, throw the error
        if (i === this.providers.length - 1) {
          throw new Error(`All LLM providers failed. Last error: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Otherwise, try next provider
        console.log(`[LLM Fallback] Falling back to ${this.providerNames[i + 1]}...`);
      }
    }

    throw new Error('No LLM providers available');
  }
}
