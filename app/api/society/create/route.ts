import { insertOrganiserInformation, insertOrganiserIntoUsers } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	const data = await req.json();
	const response = await insertOrganiserIntoUsers(data)
	console.log("I reached here!")
	if (response.success) {
		console.log("More importantly, I also reached here!")
		const id = response.id as string
		const response_two = await insertOrganiserInformation(data, id)
		console.log("I reached past response_two", response_two.success)
		return NextResponse.json(response_two)
	}
	return NextResponse.json(response)
}