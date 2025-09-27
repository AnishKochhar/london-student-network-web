import { redis } from "./config"
import { FormData } from "./types"

export interface InstagramJob {
  media_url: string
  ASID: string
  user_id: string
  post_id: string
  post_url: string
  caption: string
  post_timestamp: string
}

export interface InstagramUserInfo {
  access_token: string
  last_polled_timestamp: string
  name: string
  unix_expiration_time: string
}

export interface ExtractedEvent {
  title: string
  description: string
  organiser: string | null
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
export async function addUserToPollingList(ASID: string): Promise<boolean> {
  try {
    await redis.sadd("instagram_polling_list", ASID)
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
  expiry: string,
  ASID: string,
  lastPolledTimestamp?: string,
): Promise<boolean> {
  try {
    const userCacheKey = `user:${ASID}:instagram`
    const pipeline = redis.pipeline()
    pipeline.hset(userCacheKey, "access_token", accessToken)
    pipeline.hset(userCacheKey, "name", name)
    pipeline.hset(userCacheKey, "unix_expiration_stamp", expiry)
    pipeline.hset(userCacheKey, "user_id", userId)
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
): Promise<{ access_token: string; last_polled_timestamp: string; name: string; unix_expiration_time: string } | null> {
  try {
    const userCacheKey = `user:${userId}:instagram`
    const data = await redis.hgetall(userCacheKey)
    // Validate that all required keys exist
    if (
      typeof data.access_token === "string" &&
      typeof data.last_polled_timestamp === "string" &&
      typeof data.name === "string" &&
      typeof data.unix_expiration_stamp === "string"
    ) {
      return {
        access_token: data.access_token,
        last_polled_timestamp: data.last_polled_timestamp,
        name: data.name,
        unix_expiration_time: data.unix_expiration_stamp,
      }
    }
    return null
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
    return JSON.parse(jobData);
  } catch (error) {
    console.error("Error getting next Instagram job:", error)
    return null
  }
}

export async function storeInstagramIdMapping(userId: string, appScopedUserId: string): Promise<boolean> {
  try {
    // 1. Define a clear and consistent key structure.
    // This key can now be used to look up the internal userId.
    const mappingKey = `asid-to-uid:${appScopedUserId}`;
    // 2. Use redis.set() to store the mapping.
    await redis.set(mappingKey, userId);
    return true;
  } catch (error) {
    console.error("Error storing Instagram ID mapping:", error);
    return false;
  }
}

export async function getUserIdFromASUI(appScopedUserId: string): Promise<string | null> {
  try {
    // 1. Reconstruct the exact same key structure used in the store function.
    const mappingKey = `asid-to-uid:${appScopedUserId}`;

    // 2. Use redis.get() to retrieve the stored userId.
    const userId = await redis.get(mappingKey);

    // 3. Return the result.
    // This will be the userId string if found, or null if the key does not exist.
    return userId;
  } catch (error) {
    console.error("Error retrieving userId from ASUI:", error);
    // Return null in case of a connection error or other issue.
    return null;
  }
}

interface DeletionStatus {
  caseOpenedDate: string; // ISO 8601 date string
  disconnectionStatus: "Completed" | "In Progress" | "Failed";
  dataDeletionStatus: "Completed" | "In Progress" | "Failed" | "Not Requested";
}

export async function storeDeletionStatusInRedis(
  confirmationCode: string,
  statusData: DeletionStatus
): Promise<boolean> {
  try {
    const statusKey = `deletion-status:${confirmationCode}`;
    const statusValue = JSON.stringify(statusData);
    
    // Set the key with a 30-day expiration (in seconds)
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    await redis.set(statusKey, statusValue, "EX", thirtyDaysInSeconds);
    
    return true;
  } catch (error) {
    console.error("Error storing deletion status in Redis:", error);
    return false;
  }
}

export async function getDeletionStatusFromRedis(
  confirmationCode: string
): Promise<DeletionStatus | null> {
  try {
    const statusKey = `deletion-status:${confirmationCode}`;
    const statusValue = await redis.get(statusKey);

    if (!statusValue) {
      // The code is invalid or has expired
      return null;
    }

    // Parse the stored JSON string back into an object
    const statusData: DeletionStatus = JSON.parse(statusValue);
    return statusData;

  } catch (error) {
    console.error("Error retrieving deletion status from Redis:", error);
    return null; // Return null on any error to prevent leaking details
  }
}

export async function getGeminiInvocationStamp(): Promise<number> {
  try {
    const data = await redis.get("gemini:last_invocation");
    if (!data) return null
    const unixStamp = Number(data);
    return isNaN(unixStamp) ? 0 : unixStamp;
  } catch(error) {
    console.error("Error getting gemini invocation timestamp:", error)
    return null
  }
}

export async function setGeminiInvocationStamp(unixStamp: number): Promise<boolean> {
  try {
    await redis.set("gemini:last_invocation", unixStamp.toString());
    return true;
  } catch (error) {
    console.error("Error setting gemini invocation timestamp:", error);
    return false;
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
export async function addExtractedEvent(event: FormData): Promise<boolean> {
  try {
    await redis.lpush("extracted_events_queue", JSON.stringify(event))
    return true
  } catch (error) {
    console.error("Error adding extracted event:", error)
    return false
  }
}

export async function getNextExtractedEvent(): Promise<FormData | null> {
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

type InstagramData = {
  access_token: string;
  name: string;
  unix_expiration_stamp: string;
  user_id: string;
  last_polled_timestamp: string; // Add this field
};

// This version is modified to read from a HASH
export async function disconnectInstagram(userId: string): Promise<{ success: boolean; data: { access_token: string, name: string, unix_expiration_stamp: string, user_id: string, last_polled_timestamp: string } | null; }> {
  try {
    const cacheKey = `user:${userId}:instagram`; // Note: In your store function, this key uses ASID, not userId. Ensure they match.

    // 1. Get all fields from the HASH using HGETALL.
    // It returns an object of strings, or null if the key doesn't exist.
    const cachedData = await redis.hgetall(cacheKey) as InstagramData | null;

    // 2. Perform the deletions.
    await redis.lrem("instagram_polling_list", 0, userId); // This should probably use ASID too if that's the identifier.
    await redis.del(cacheKey);

    // 3. Return success and the retrieved data object.
    return { success: true, data: cachedData };

  } catch (error) {
    console.error("Error trying to disconnect:", error);
    return { success: false, data: null };
  }
}
