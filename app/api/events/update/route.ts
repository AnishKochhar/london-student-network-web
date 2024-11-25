import { updateEvent } from '@/app/lib/data';
import { NextResponse } from 'next/server';
import { createSQLEventObject } from '@/app/lib/utils';
import { FormData } from '@/app/lib/types';

export async function POST(req: Request) {
	// const data: FormData = await req.json();
	const { id, formData }: { id: string; formData: FormData } = await req.json();
	const sqlEvent = await createSQLEventObject(formData);
	const response = await updateEvent({ ...sqlEvent, id })	
	return NextResponse.json(response)
}