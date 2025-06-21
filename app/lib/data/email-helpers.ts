import { sql } from "@vercel/postgres";
import { fetchEventById } from "@/app/lib/data";

// the idea here is that when method of fetching the individual data changes, 
// we don't need to modify every single helper function. Only
// the method to fetch individual data

// ===============================================
// INDIVIDUAL DATA FETCHES
// ===============================================



