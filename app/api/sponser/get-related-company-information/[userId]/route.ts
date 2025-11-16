import { NextResponse } from 'next/server';
import { getRelatedCompanyInformation } from '@/app/lib/data';

export async function GET(_: Request, { params }: { params: { userId: string } }) {
  try {
    
    if (!params.userId) {
      return NextResponse.json({ success: false, message: 'Invalid job ID' }, { status: 400 });
    }

    const company = await getRelatedCompanyInformation(params.userId)
    if (!company) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch company.' }, { status: 500 });
  }
}
