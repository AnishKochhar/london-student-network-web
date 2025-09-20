"use client";

import { useState, useEffect } from "react";
import { TrendingTopic } from "@/app/lib/types";
import * as topicService from "@/app/lib/services/thread-service";

export function useTrendingTopics() {
    const [topics, setTopics] = useState<TrendingTopic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTopics() {
            try {
                setIsLoading(true);
                const data = await topicService.fetchTrendingTopics();
                setTopics(data);
                setError(null);
            } catch (err) {
                console.error("Error in useTrendingTopics:", err);
                setError("Failed to load trending topics");
            } finally {
                setIsLoading(false);
            }
        }

        loadTopics();
    }, []);

    return { topics, isLoading, error };
}
