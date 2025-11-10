import { NextResponse } from 'next/server';
import { getAllJobs } from '@/app/lib/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const pageNum = parseInt(searchParams.get('pageNum') || '1', 10);

    const jobs = await getAllJobs(pageSize, pageNum);

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load jobs.' },
      { status: 500 }
    );
  }
}
