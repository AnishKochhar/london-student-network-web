'use client';

import { useState, useEffect } from 'react';
import { TrendingTopic } from '@/app/lib/types';

export function useTrendingTopics() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrendingTopics() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/trending-topics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch trending topics');
        }
        
        const data = await response.json();
        setTopics(data);
      } catch (err) {
        console.error('Error fetching trending topics:', err);
        setError('Failed to load trending topics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrendingTopics();
  }, []);

  return { topics, isLoading, error };
}