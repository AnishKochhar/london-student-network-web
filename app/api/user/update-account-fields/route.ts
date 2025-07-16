import { updateAccountInfo } from '@/app/lib/data';
import { OrganiserAccountEditFormData } from '@/app/lib/types';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	const { id, data } = (await req.json()) as { id: string, data: OrganiserAccountEditFormData};
	try {
		const response = await updateAccountInfo(id, data);
		return NextResponse.json(response);
	} catch(error) {
		return NextResponse.json({ success: false });
	}


}