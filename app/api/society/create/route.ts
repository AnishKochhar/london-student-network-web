import { insertOrganiserInformation, insertOrganiserIntoUsers } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	const data = await req.json();
	const response = await insertOrganiserIntoUsers(data);
	if (response.success) {
		const id = response.id as string;
		const response_two = await insertOrganiserInformation(data, id);
		if (response_two.success) {
			return NextResponse.json({success: response_two.success, id});
		} else {
			return NextResponse.json({success: response_two.success, error: response_two.error});
		}
	}
	return NextResponse.json(response);
}