import { type NextRequest, NextResponse } from "next/server"
import { getNextInstagramJob, getInstagramUserData, addExtractedEvent, checkRedisConnection, getGeminiInvocationStamp, setGeminiInvocationStamp } from "@/app/lib/redis-helpers"
import type { InstagramJob, InstagramUserInfo, ExtractedEvent } from "@/app/lib/redis-helpers"
import { GoogleGenAI, Type, Schema } from "@google/genai"
import { FormData } from "@/app/lib/types"

// Environment variables for authentication and AI
const CRON_SECRET = process.env.CRON_SECRET
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const eventSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        is_event: { type: Type.BOOLEAN },
        title: { type: Type.STRING, description: "A short, snappy and unique title, max 10 words, describing the event." },
        description: { type: Type.STRING, nullable: true },
        organised_by_poster: { type: Type.BOOLEAN },
        date: { type: Type.STRING, description: "In YYYY-MM-DD format", nullable: true },
        start_time: { type: Type.STRING, description: "In HH:MM 24-hour format", nullable: true },
        end_time: { type: Type.STRING, description: "In HH:MM 24-hour format", nullable: true },
        event_tags: { type: Type.ARRAY, description: "A list of **unique** tags - return at least one tag", items: { type: Type.STRING, enum: ["social", "academic", "sporting"] } },
        location_building: { type: Type.STRING, nullable: true },
        location_area: { type: Type.STRING, description: "The area the event is hosted in. This will usually be London.", nullable: true },
        location_address: { type: Type.STRING, nullable: true },
        capacity: { type: Type.NUMBER, nullable: true },
        sign_up_link: { type: Type.STRING, description: "The link to which, if any, one can sign up to the event", nullable: true },
        for_externals: { type: Type.STRING, description: "Any special/relevant information for external students?", nullable: true },
    },
    required: ["is_event", "title", "organised_by_poster", "event_tags"],
};

// const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null
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
  const startTime = Date.now()

  const GEMINI_RATE_LIMIT_KEY = "gemini:last_invocation";
  const TWO_MINUTES = 2 * 60; // seconds
  const ONE_SECOND = 1

  // Get last invocation unix timestamp from Redis
  const lastInvocationUnix = await getGeminiInvocationStamp();
  const currentUnix = Math.floor(Date.now() / 1000);

  // if (currentUnix - lastInvocationUnix < TWO_MINUTES) {
  if (currentUnix - lastInvocationUnix < ONE_SECOND) {
    return NextResponse.json({
      status: "internal limiter avoided gemini call",
      message: `Gemini invocation allowed only once every 1.49 minutes. Last run: ${lastInvocationUnix}, now: ${currentUnix}`,
      next_allowed_unix: lastInvocationUnix + TWO_MINUTES,
      processed_posts: 0,
    }, { status: 429 });
  }

  try {
    console.log("[v0] Starting Instagram post processing job")

    // Process posts until queue is empty or time limit reached
    // while (geminiInvocations < maxPostsPerInvocation) {
      let job : InstagramJob | null
      try {
        job = await getNextInstagramJob()
        if (!job) {
          console.log("[v0] No more jobs in queue")
          return NextResponse.json({ message: "No more jobs in the queue" }, { status: 200 })
          // break
        }
      } catch {}

      let societyInfo : InstagramUserInfo | null
      try {
        societyInfo = await getInstagramUserData(job.user_id)
        if (!societyInfo) {
          console.log("[v0] Mismatch between jobs and users to poll")
          return NextResponse.json({ error: "Mismatch between jobs, and users to poll" }, { status: 500 })
        }
      } catch {}

      try {
        console.log(`[v0] Processing post ${job.post_id} from user ${job.user_id}`)

        // Analyze post with Gemini AI
        const extractedEvent = await analyzePostWithGemini(job, societyInfo.name)

        const lsnEvent = validateAndFormatEvent(extractedEvent, job, societyInfo)

        if (lsnEvent) {
          // Add to extracted events queue
          const success = await addExtractedEvent(lsnEvent)
          if (success) {
            processedPosts++
            console.log(`[v0] Successfully extracted event from post ${job.post_id}`)
            console.log(`The final post that was saved to redis is: ${lsnEvent}`)
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
      // }
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

// Define the expected structure from the Gemini model
interface GeminiEventSchema {
  is_event: boolean;
  title: string | null;
  description: string | null;
  organiser: string | null;
  organised_by_poster: boolean;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  event_tags: string[] | null;
  location_building: string | null;
  location_area: string | null;
  location_address: string | null;
  capacity: number | null;
  sign_up_link: string | null;
  for_externals: string | null;
}


async function analyzePostWithGemini(job: InstagramJob, societyName: string | null): Promise<ExtractedEvent | null> {
  if (!job.media_url) {
      console.warn(`[v2] Post ${job.post_id} has no image URL. Skipping Gemini analysis.`);
      return null;
  }
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set")
  }

  // Fetch the image and convert it to Base64
  const imageResponse = await fetch(job.media_url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from ${job.media_url}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString('base64');
  const imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

  const imagePart = {
      inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
      },
  };
  
  const prompt = `Analyze the attached Instagram post image and caption to extract event details.
${societyName? 'If the event is organised by "' + societyName + '", then mark "organised_by_poster" as true.': 'If the event is organised by the poster, mark "organised_by_poster" as true.'}
This timestamp at which this post was published is ${job.post_timestamp}.
Respond ONLY with a valid JSON object matching this structure:
{
  "is_event",
  "title",
  "description",
  "organised_by_poster", // Is the poster the organiser?
  "date",
  "start_time",
  "end_time",
  "event_tags",
  "location_building",
  "location_area",
  "location_address",
  "capacity",
  "sign_up_link",
  "for_externals"
}

Post Caption: "${job.caption}"`

  try {

    let currentUnixStamp = Math.floor(Date.now() / 1000);
    await setGeminiInvocationStamp(currentUnixStamp);
    const result = await ai.models.generateContent({ // Gemini 2.5 flash takes around 10 seconds to respond. Keep this in mind.
        model: "gemini-2.5-flash",
        contents: [prompt, imagePart],
        config: {
          responseMimeType: "application/json",
          responseSchema: eventSchema // Not all models support structured response. Check out https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output.
        }
    });

    // defensive design, though slightly more inefficient
    currentUnixStamp = Math.floor(Date.now() / 1000);
    await setGeminiInvocationStamp(currentUnixStamp);

    const aiResponse = result.text

    if (!aiResponse) {
        throw new Error("No parsable JSON response from Gemini model");
    }

    // const cleanedJsonString = aiResponse
    //     .trim() // Remove leading/trailing whitespace
    //     .replace(/^```json\s*/, '') // Remove the starting fence
    //     .replace(/\s*```$/, ''); // Remove the ending fence

    let aiJson: GeminiEventSchema;
    try {
      // aiJson = JSON.parse(cleanedJsonString);
      aiJson = JSON.parse(aiResponse);
    } catch (e) {
      console.error(`[v2] Failed to parse Gemini response for post ${job.post_id}:`, e);
      console.error(`[v2] Raw response text was:`, aiResponse);
      // console.error(`[v2] Cleaned response text was:`, cleanedJsonString);
      return null;
    }

    console.log(`[v2] Gemini JSON Response for post ${job.post_id}:`, aiJson);

    if (!aiJson || !aiJson.is_event) {
      return null;
    }
    // Convert to ExtractedEvent format
    const extractedEvent: ExtractedEvent = {
      title: aiJson.title,
      description: aiJson.description || job.caption,
      organiser: aiJson.organised_by_poster? societyName : null,
      date: aiJson.date || new Date().toISOString().split("T")[0],
      start_time: aiJson.start_time || "03:00",
      end_time: aiJson.end_time || "03:15",
      event_tags: Array.isArray(aiJson.event_tags) ? aiJson.event_tags : ["social"],
      location_building: aiJson.location_building || "TBD",
      location_area: aiJson.location_area || "TBD",
      location_address: aiJson.location_address || "TBD",
      capacity: aiJson.capacity ?? null,
      sign_up_link: aiJson.sign_up_link || null,
      for_externals: aiJson.for_externals || null,
      post_id: job.post_id,
      user_id: job.user_id,
    }

    return extractedEvent
  } catch (error) {
    console.error(`[v2] Error calling Gemini AI for post ${job.post_id}:`, error)
    throw error
  }
}

const validateAndFormatEvent = (event: ExtractedEvent | null, job: InstagramJob, societyInfo: InstagramUserInfo) : FormData | null => {
  if (!event) {
    return null
  }
  if (!event.organiser || event.organiser.trim() !== societyInfo.name.trim()) {
    return null
  }

  // Parse date string "yyyy-mm-dd"
  let day = 1, month = 1, year = 1
  if (event.date) {
    const dateParts = event.date.split('-')
    if (dateParts.length === 3) {
      year = Number(dateParts[0])
      month = Number(dateParts[1])
      day = Number(dateParts[2])
    }
  }

  // // Enforce that the event date is not in the past
  // const now = new Date()
  // const currentYear = now.getFullYear()
  // const currentMonth = now.getMonth() + 1 // getMonth() is zero-based
  // const currentDay = now.getDate()
  // if (
  //   year < currentYear ||
  //   (year === currentYear && month < currentMonth) ||
  //   (year === currentYear && month === currentMonth && day < currentDay)
  // ) {
  //   return null
  // }

  // Parse start_time and end_time "hh:mm"
  let startHour = '', startMinute = '', endHour = '', endMinute = ''
  if (event.start_time) {
    const startParts = event.start_time.split(':')
    if (startParts.length === 2) {
      startHour = startParts[0]
      startMinute = startParts[1]
    }
  }
  if (event.end_time) {
    const endParts = event.end_time.split(':')
    if (endParts.length === 2) {
      endHour = endParts[0]
      endMinute = endParts[1]
    }
  } else if (startHour !== '' && startMinute !== '') {
    let calculatedEndHour = Number(startHour) + 2
    if (calculatedEndHour >= 24) calculatedEndHour -= 24 // wrap around midnight
    endHour = calculatedEndHour.toString().padStart(2, '0')
    endMinute = startMinute
  }

  // Calculate event_tag as binary sum
  let eventTag = 0
  if (Array.isArray(event.event_tags)) {
    const uniqueTags = Array.from(new Set(event.event_tags))
    for (const tag of uniqueTags) {
      if (tag === 'social') eventTag += 1
      if (tag === 'academic') eventTag += 2
      if (tag === 'sporting') eventTag += 4
    }
  }

  return {
    title: event.title,
    description: event.description + `\n ================================================= \n IMPORTANT \n ================================================= \n This event has been automatically published using AI technology. The AI may sometimes get details wrong, including, but not exclusive to, details about times, locations, events, and people. Always check the original post (${job.post_url}) for details.`,
    organiser: event.organiser,
    organiser_uid: job.user_id,
    date: {
      day,
      month,
      year,
    },
    time: {
      startHour,
      startMinute,
      endHour,
      endMinute,
    },
    location: {
      building: event.location_building,
      area: event.location_area,
      address: event.location_address,
    },
    selectedImage: job.media_url,
    uploadedImage: null,
    image_contain: true,
    event_tag: eventTag,
    capacity: event.capacity,
    signupLink: event.sign_up_link,
    forExternals: event.for_externals,
  }
}
