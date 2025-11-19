import { sql } from "@vercel/postgres"
import { Profile } from "./types"
import { normalizeProfile, ProfileSkill, ProfileExperience } from "./types"

// ------------------ GET PROFILE ------------------
export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const profileResult = await sql`SELECT * FROM profiles WHERE user_id = ${userId};`
  const profile = profileResult.rows[0] as Profile | undefined
  if (!profile) return null

  return normalizeProfile({
    ...profile,
    skills: [],
    experiences: []
  })
}

// ------------------ INSERT EMPTY PROFILE ------------------
export async function insertProfile(userId: string): Promise<Profile> {
  const result = await sql`
    INSERT INTO profiles (user_id)
    VALUES (${userId})
    RETURNING *;
  `
  const newProfile = result.rows[0] as Profile

  // Always return normalized profile with empty skills and experiences
  return normalizeProfile({
    ...newProfile,
    skills: [],
    experiences: []
  })
}

// ------------------ UPDATE PROFILE ------------------
export async function updateProfile(userId: string, updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'skills' | 'experiences'>>): Promise<Profile | null> {
  const result = await sql`
    UPDATE profiles SET
      headline = COALESCE(${updates.headline}, headline),
      bio = COALESCE(${updates.bio}, bio),
      location = COALESCE(${updates.location}, location),
      phone = COALESCE(${updates.phone}, phone),
      linkedin_url = COALESCE(${updates.linkedin_url}, linkedin_url),
      github_url = COALESCE(${updates.github_url}, github_url),
      portfolio_url = COALESCE(${updates.portfolio_url}, portfolio_url),
      resume_url = COALESCE(${updates.resume_url}, resume_url),
      profile_picture_url = COALESCE(${updates.profile_picture_url}, profile_picture_url),
      banner_image_url = COALESCE(${updates.banner_image_url}, banner_image_url),
      updated_at = now()
    WHERE user_id = ${userId}
    RETURNING *;
  `
  const profile = result.rows[0] as Profile | undefined
  if (!profile) return null

  return normalizeProfile({
    ...profile,
    skills: [],
    experiences: []
  })
}

// ------------------ GET SKILLS ------------------
export async function getSkillsByUserId(userId: string): Promise<ProfileSkill[]> {
  const result = await sql`
    SELECT ps.* 
    FROM profile_skills ps
    JOIN profiles p ON ps.profile_id = p.id
    WHERE p.user_id = ${userId};
  `
  return result.rows as ProfileSkill[]
}

// ------------------ ADD SKILL ------------------
export async function insertSkill(userId: string, skillName: string): Promise<ProfileSkill | null> {
  const profileResult = await sql`SELECT id FROM profiles WHERE user_id = ${userId};`
  const profile = profileResult.rows[0]
  if (!profile) return null

  const result = await sql`
    INSERT INTO profile_skills (profile_id, skill_name)
    VALUES (${profile.id}, ${skillName})
    RETURNING *;
  `
  return result.rows[0] ? (result.rows[0] as ProfileSkill) : null
}

// ------------------ DELETE SKILL ------------------
export async function deleteSkill(userId: string, skillId: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM profile_skills
    WHERE id = ${skillId} AND profile_id IN (
      SELECT id FROM profiles WHERE user_id = ${userId}
    );
  `
  return result.rowCount > 0
}

// ------------------ GET EXPERIENCES ------------------
export async function getExperiencesByUserId(userId: string): Promise<ProfileExperience[]> {
  const result = await sql`
    SELECT pe.* 
    FROM profile_experience pe
    JOIN profiles p ON pe.profile_id = p.id
    WHERE p.user_id = ${userId};
  `
  return result.rows as ProfileExperience[]
}

// ------------------ ADD EXPERIENCE ------------------
export async function insertExperience(userId: string, experience: Omit<ProfileExperience, 'id' | 'profile_id'>): Promise<ProfileExperience | null> {
  const profileResult = await sql`SELECT id FROM profiles WHERE user_id = ${userId};`
  const profile = profileResult.rows[0]
  if (!profile) return null

  const result = await sql`
    INSERT INTO profile_experience (
      profile_id, title, company, start_date, end_date, description
    )
    VALUES (
      ${profile.id}, ${experience.title}, ${experience.company}, ${experience.start_date}, ${experience.end_date}, ${experience.description}
    )
    RETURNING *;
  `
  return result.rows[0] ? (result.rows[0] as ProfileExperience) : null
}

// ------------------ UPDATE EXPERIENCE ------------------
export async function updateExperience(userId: string, experienceId: number, updates: Partial<Omit<ProfileExperience, 'id' | 'profile_id'>>): Promise<ProfileExperience | null> {
  const result = await sql`
    UPDATE profile_experience
    SET
      title = COALESCE(${updates.title}, title),
      company = COALESCE(${updates.company}, company),
      start_date = COALESCE(${updates.start_date}, start_date),
      end_date = COALESCE(${updates.end_date}, end_date),
      description = COALESCE(${updates.description}, description)
    WHERE id = ${experienceId} AND profile_id IN (
      SELECT id FROM profiles WHERE user_id = ${userId}
    )
    RETURNING *;
  `
  return result.rows[0] ? (result.rows[0] as ProfileExperience) : null
}

// ------------------ DELETE EXPERIENCE ------------------
export async function deleteExperience(userId: string, experienceId: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM profile_experience
    WHERE id = ${experienceId} AND profile_id IN (
      SELECT id FROM profiles WHERE user_id = ${userId}
    );
  `
  return result.rowCount > 0
}

