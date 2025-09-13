import { type NextRequest, NextResponse } from "next/server"
import { getNextInstagramJob, addExtractedEvent, checkRedisConnection } from "@/app/lib/redis-helpers"
import type { InstagramJob, ExtractedEvent } from "@/app/lib/redis-helpers"
import { GoogleGenAI, Type } from "@google/genai"

// Environment variables for authentication and AI
const CRON_SECRET = process.env.CRON_SECRET
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  // const authHeader = request.headers.get("authorization")
  // const expectedAuth = `Bearer ${CRON_SECRET}`

  // if (!CRON_SECRET || authHeader !== expectedAuth) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  // Check Redis connection
  const redisHealthy = await checkRedisConnection()
  if (!redisHealthy) {
    return NextResponse.json({ error: "Redis connection failed" }, { status: 500 })
  }

  let processedPosts = 0
  const errors: string[] = []
  const maxProcessingTime = 8 * 60 * 1000 // 8 minutes max processing time
  const startTime = Date.now()

  try {
    console.log("[v0] Starting Instagram post processing job")

    // Process posts until queue is empty or time limit reached
    while (Date.now() - startTime < maxProcessingTime) {
      const job = await getNextInstagramJob()
      if (!job) {
        console.log("[v0] No more jobs in queue")
        break
      }

      try {
        console.log(`[v0] Processing post ${job.post_id} from user ${job.user_id}`)

        // Analyze post with Gemini AI
        const extractedEvent = await analyzePostWithGemini(job)
        const lsnEvent = validateAndFormatEvent(extractedEvent)

        if (extractedEvent) {
          // Add to extracted events queue
          const success = await addExtractedEvent(extractedEvent)
          if (success) {
            processedPosts++
            console.log(`[v0] Successfully extracted event from post ${job.post_id}`)
          } else {
            errors.push(`Failed to queue extracted event for post ${job.post_id}`)
          }
        } else {
          console.log(`[v0] No event detected in post ${job.post_id}`)
        }
      } catch (error) {
        const errorMsg = `Error processing post ${job.post_id}: ${error instanceof Error ? error.message : "Unknown error"}`
        console.error(`[v0] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    const response = {
      status: errors.length === 0 ? "success" : "partial_success",
      message: `Processed ${processedPosts} posts`,
      processed_posts: processedPosts,
      errors: errors.length > 0 ? errors : undefined,
      processing_time_ms: Date.now() - startTime,
    }

    console.log(`[v0] Processing job completed:`, response)
    return NextResponse.json(response)
  } catch (error) {
    const errorMsg = `Critical error in processing job: ${error instanceof Error ? error.message : "Unknown error"}`
    console.error(`[v0] ${errorMsg}`)
    return NextResponse.json(
      {
        status: "error",
        message: errorMsg,
        processed_posts: processedPosts,
      },
      { status: 500 },
    )
  }
}

async function analyzePostWithGemini(job: InstagramJob): Promise<ExtractedEvent | null> {
  if (!GEMINI_API_KEY || !ai) {
    throw new Error("GOOGLE_API_KEY environment variable not set")
  }

  const prompt = `Analyze the following Instagram post. Your response MUST be ONLY a valid JSON object. Do not include any explanatory text or markdown formatting.
Mark is_event with True, if you think this post is announcing an event (otherwise False). Mark organised_by_poster as True, if the poster is the organiser (otherwise False). The JSON object should conform to this structure:
{
  "is_event": boolean,
  "title": string | null,
  "organised_by_poster": boolean,
  "date": string | null (in YYYY-MM-DD format),
  "start_time": string | null (in HH:MM 24-hour format),
  "end_time": string | null (in HH:MM 24-hour format),
  "event_tags": string[] | null,
  "location_building": string | null,
  "location_area": string | null,
  "location_address": string | null,
  "capacity": number | null,
  "sign_up_link": string | null,
  "for_externals": string | null
}

Post Caption: "${job.caption}"
Post URL: ${job.post_url}`


  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-1.5-flash",
      contents: prompt,
    })

    const aiResponseText = response.text
    if (!aiResponseText) {
      throw new Error("No response from Gemini model")
    }

    console.log(`[v0] Gemini Response for post ${job.post_id}:`, aiResponseText)

    const parsed = parseGeminiResponse(aiResponseText, job.post_id);

    if (!parsed || !parsed.is_event) {
      return null // Not an event or parsing failed
    }

    // Convert to ExtractedEvent format
    const extractedEvent: ExtractedEvent = {
      title: parsed.title || "Untitled Event",
      description: parsed.description || job.caption,
      organiser: parsed.organiser || "Unknown Organiser",
      date: parsed.date || new Date().toISOString().split("T")[0],
      start_time: parsed.start_time || "18:00",
      end_time: parsed.end_time || "20:00",
      event_tags: Array.isArray(parsed.event_tags) ? parsed.event_tags : ["social"],
      location_building: parsed.location_building || "TBD",
      location_area: parsed.location_area || "London",
      location_address: parsed.location_address || "TBD",
      capacity: parsed.capacity ?? null,
      sign_up_link: parsed.sign_up_link || null,
      for_externals: parsed.for_externals || null,
      post_id: job.post_id,
      user_id: job.user_id,
    }

    return extractedEvent
  } catch (error) {
    console.error(`[v0] Error calling Gemini AI for post ${job.post_id}:`, error)
    throw error
  }
}

function parseGeminiResponse(responseText: string, postId: string): any | null {
  // The model sometimes wraps the JSON in markdown fences (```json ... ```).
  // This logic first cleans the string, then attempts to parse.
  const cleanedText = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  
  try {
    // Now, try to parse the cleaned string. This correctly handles null values.
    return JSON.parse(cleanedText);
  } catch (e) {
    // If parsing still fails, it means the JSON content itself is malformed.
    console.error(`[v0] Failed to parse Gemini response for post ${postId} after cleaning. Error:`, e);
    console.error(`[v0] Cleaned response text was:`, cleanedText);
    return null;
  }
}

