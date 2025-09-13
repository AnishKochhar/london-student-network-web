import { redis } from "./config"

export interface InstagramJob {
  user_id: string
  post_id: string
  post_url: string
  caption: string
}

export interface ExtractedEvent {
  title: string
  description: string
  organiser: string
  date: string
  start_time: string
  end_time: string
  event_tags: string[]
  location_building: string
  location_area: string
  location_address: string
  capacity: number | null
  sign_up_link: string | null
  for_externals: string | null
  post_id: string
  user_id: string
}

/**
 * Redis Helper Functions for Instagram Polling Service
 * Provides easy-to-use functions for managing Instagram data in Redis
 */

// Instagram User Management
export async function addUserToPollingList(userId: string): Promise<boolean> {
  try {
    await redis.sadd("instagram_polling_list", userId)
    return true
  } catch (error) {
    console.error("Error adding user to polling list:", error)
    return false
  }
}

export async function removeUserFromPollingList(userId: string): Promise<boolean> {
  try {
    await redis.srem("instagram_polling_list", userId)
    return true
  } catch (error) {
    console.error("Error removing user from polling list:", error)
    return false
  }
}

export async function getActivePollingUsers(): Promise<string[]> {
  try {
    return await redis.smembers("instagram_polling_list")
  } catch (error) {
    console.error("Error getting active polling users:", error)
    return []
  }
}

// Instagram Token Management
export async function storeInstagramTokenInRedis(
  userId: string,
  name: string,
  accessToken: string,
  lastPolledTimestamp?: string,
): Promise<boolean> {
  try {
    const userCacheKey = `user:${userId}:instagram`
    const pipeline = redis.pipeline()
    pipeline.hset(userCacheKey, "access_token", accessToken)
    pipeline.hset(userCacheKey, "name", name)
    if (lastPolledTimestamp) {
      pipeline.hset(userCacheKey, "last_polled_timestamp", lastPolledTimestamp)
    } else {
      pipeline.hset(userCacheKey, "last_polled_timestamp", "0")
    }
    await pipeline.exec()
    return true
  } catch (error) {
    console.error("Error storing Instagram token:", error)
    return false
  }
}

export async function getInstagramUserData(
  userId: string,
): Promise<{ access_token?: string; last_polled_timestamp?: string } | null> {
  try {
    const userCacheKey = `user:${userId}:instagram`
    return await redis.hgetall(userCacheKey)
  } catch (error) {
    console.error("Error getting Instagram user data:", error)
    return null
  }
}

export async function updateLastPolledTimestamp(userId: string, timestamp: string): Promise<boolean> {
  try {
    const userCacheKey = `user:${userId}:instagram`
    await redis.hset(userCacheKey, "last_polled_timestamp", timestamp)
    return true
  } catch (error) {
    console.error("Error updating last polled timestamp:", error)
    return false
  }
}

// Instagram Jobs Queue Management
export async function addInstagramJob(job: InstagramJob): Promise<boolean> {
  try {
    await redis.lpush("instagram_jobs_queue", JSON.stringify(job))
    return true
  } catch (error) {
    console.error("Error adding Instagram job:", error)
    return false
  }
}

export async function getNextInstagramJob(): Promise<InstagramJob | null> {
  try {
    const jobData = await redis.rpop("instagram_jobs_queue")
    if (!jobData) return null
    return JSON.parse(jobData)
  } catch (error) {
    console.error("Error getting next Instagram job:", error)
    return null
  }
}

export async function getInstagramJobsCount(): Promise<number> {
  try {
    return await redis.llen("instagram_jobs_queue")
  } catch (error) {
    console.error("Error getting Instagram jobs count:", error)
    return 0
  }
}

// Events Queue Management
export async function addExtractedEvent(event: ExtractedEvent): Promise<boolean> {
  try {
    await redis.lpush("extracted_events_queue", JSON.stringify(event))
    return true
  } catch (error) {
    console.error("Error adding extracted event:", error)
    return false
  }
}

export async function getNextExtractedEvent(): Promise<ExtractedEvent | null> {
  try {
    const eventData = await redis.rpop("extracted_events_queue")
    if (!eventData) return null
    return JSON.parse(eventData)
  } catch (error) {
    console.error("Error getting next extracted event:", error)
    return null
  }
}

export async function getExtractedEventsCount(): Promise<number> {
  try {
    return await redis.llen("extracted_events_queue")
  } catch (error) {
    console.error("Error getting extracted events count:", error)
    return 0
  }
}

// Health Check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error("Redis connection failed:", error)
    return false
  }
}
