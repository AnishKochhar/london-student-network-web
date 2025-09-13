import { insertOrganiserInformation, insertOrganiserIntoUsers } from '@/app/lib/data';
import { NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';

export async function POST(req: Request) {
	const data = await req.json();
	const response = await insertOrganiserIntoUsers(data)
	console.log("I reached here!")
	if (response.success) {
		console.log("More importantly, I also reached here!")
		const id = response.id as string
		const response_two = await insertOrganiserInformation(data, id)
		console.log("I reached past response_two", response_two.success)
		// try {
		// 	console.log("I reached the sign in action")
		// 	const result = await signIn('credentials', {
		// 		redirect: false,
		// 		email: data.email,
		// 		password: data.password
		// 	});
		// 	if (result?.error) {
		// 		console.log("The sign in failed")
		// 	}
		// } catch{ console.log("The sign in action went wrong...")}
		return NextResponse.json(response_two)
	}
	return NextResponse.json(response)
}