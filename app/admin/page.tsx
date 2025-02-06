"use server";

import EventList from "../components/admin/events-list";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "../components/button";
import Link from "next/link";


export default async function AdminPage() {

	const session = await auth()
	if (!session) { 
		redirect('/login')
	}

	if (session.user?.role !== 'admin') {
		redirect('/account')
	}


	return (
		<main className="relative h-full max-auto pt-8 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
			<div className="flex flex-col h-full justify-center items-center p-6">
				<div className="flex flex-col md:flex-row items-center md:items-start justify-between w-full space-y-10 md:space-y-0">
					<h1 className="text-2xl md:text-4xl">ADMIN PAGE</h1>
					<div className="flex flex-col space-y-2">
					<Button variant='outline' size='lg' className="text-white border-gray-100">
						<Link href='/admin/contact-form' replace>Switch to Contact Form list</Link>
					</Button>
					<Button variant='outline' size='lg' className="text-white border-gray-100">
						<Link href='/admin/speed-dating' replace>Switch to Speed Dating page</Link>
						</Button>
					</div>
				</div>
				<p className="p-6"> Welcome to the admin dashboard. Here you can view all event listings, remove listings, and add new ones</p>
				<EventList />
			</div>
		</main>
	)
}

