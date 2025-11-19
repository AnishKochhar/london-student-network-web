import { sql } from "@vercel/postgres";
import { Job } from "./types";

export async function getAllJobs(
  pageSize: number,
  pageNum: number,
  search?: string,
  company?: string,
  jobType?: string,
  location?: string
): Promise<{ jobs: Job[]; total: number }> {
  const offset = (pageNum - 1) * pageSize;

  const where: string[] = ["j.available = TRUE"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    where.push(`(j.position LIKE $${idx})`);
    idx++;
  }

  // if (company && company.trim()) {
  //   params.push(`%${company.trim()}%`);
  //   where.push(`ci.description LIKE $${idx}`);
  //   idx++;
  // }

  if (jobType && jobType.trim()) {
    params.push(jobType.trim());
    where.push(`j.job_type = $${idx}`);
    idx++;
  }

  if (location && location.trim()) {
    params.push(`%${location.trim()}%`);
    where.push(`j.location ILIKE $${idx}`);
    idx++;
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Add pagination parameters
  params.push(pageSize);
  params.push(offset);
  const limitParam = idx++;
  const offsetParam = idx++;

  const listQuery = `
    SELECT
      j.*,
      ci.description AS company_name,
      ci.logo_url AS company_logo_url,
      ci.contact_email
    FROM jobs j
    JOIN company_information ci ON j.company_id = ci.id
    ${whereSQL}
    ORDER BY j.created_at DESC
    LIMIT $${limitParam} OFFSET $${offsetParam};
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM jobs j
    JOIN company_information ci ON j.company_id = ci.id
    ${whereSQL};
  `;

  // Run the queries
  const listResult = await sql.query(listQuery, params);
  const countResult = await sql.query(countQuery, params.slice(0, params.length - 2));

  return {
    jobs: listResult.rows as Job[],
    total: countResult.rows[0]?.total ?? 0
  };
}



export async function getJobById(id: string): Promise<Job | null> {
console.log(id)
  const result = await sql`
    SELECT 
      j.*,
      ci.description AS company_name,
      ci.logo_url AS company_logo_url,
      ci.contact_email
    FROM jobs j
    JOIN company_information ci ON j.company_id = ci.id
    WHERE j.id = ${id}::uuid;
    `
  return result.rows[0] as Job || null;
}

export async function postJob(job: Job): Promise<void> {
  if (!job.company_id) {
    throw new Error('Missing company_id for job upsert');
  }

  await sql`
    INSERT INTO jobs (
      id,
      company_id,
      position,
      location,
      available,
      job_type,
      link,
      description,
      deadline
    )
    VALUES (
      ${job.id || crypto.randomUUID()},
      ${job.company_id},
      ${job.position},
      ${job.location},
      ${job.available ?? true},
      ${job.job_type},
      ${job.link},
      ${job.description},
      ${job.deadline}
    )
    ON CONFLICT (id) DO UPDATE SET
      company_id = EXCLUDED.company_id,
      position = EXCLUDED.position,
      location = EXCLUDED.location,
      available = EXCLUDED.available,
      job_type = EXCLUDED.job_type,
      link = EXCLUDED.link,
      description = EXCLUDED.description,
      deadline = EXCLUDED.deadline
  `;
}

/**
 * Delete a job by ID
 */
export async function deleteJob(id: string): Promise<void> {
  await sql`DELETE FROM jobs WHERE id = ${id};`;
}