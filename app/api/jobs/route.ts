import { NextResponse } from 'next/server';
import { deleteJob, getAllJobs, getRelatedCompanyInformation } from '@/app/lib/data';
import { postJob } from "@/app/lib/data";
import { CompanyInformation, Job } from "@/app/lib/types";
import { requireAuth } from '@/app/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const pageNum = parseInt(searchParams.get('pageNum') || '1', 10);

    const {jobs, total} = await getAllJobs(pageSize, pageNum);

    return NextResponse.json({
      success: true,
      jobs,
      total
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load jobs.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const job: Job = await request.json();
    // Authenticate user
    const user = await requireAuth();

    // ✅ Basic validation
    if (!job) {
      return NextResponse.json(
        { success: false, message: "Missing required job fields." },
        { status: 400 }
      );
    }
    if (!user || user.role != "company") {
      return NextResponse.json(
        { success: false, message: "Only Company Accounts can post a job" },
        { status: 400 }
      );
    }

    // ✅ Insert into DB

    const company_info: CompanyInformation = await getRelatedCompanyInformation(user.id)
    job.company_id = company_info.id
    job.available = true
    await postJob(job);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create job." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: {params:{id: string}}) {
  try {
    const { id } = params;
    await deleteJob(id);
    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Error deleting job:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete job' }, { status: 500 });
  }
}
