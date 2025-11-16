import { NextResponse } from 'next/server';
import { getJobById } from '@/app/lib/data';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id
    if (!jobId) {
      return NextResponse.json({ success: false, message: 'job ID Required' }, { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch job.' }, { status: 500 });
  }
}
