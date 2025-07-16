import { fetchAccountInfo } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	const id = (await req.json()) as string;
	const response = await fetchAccountInfo(id);
	return NextResponse.json(response);
}