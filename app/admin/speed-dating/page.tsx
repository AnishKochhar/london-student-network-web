"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/app/components/button";
import Link from "next/link";
import SpeedDatingAttendeeList from "@/app/components/admin/speed-dating/speed-dating-data-table";


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
				<div className="flex flex-col md:flex-row items-center md:items-start justify-between w-full space-y-10 md:space-y-0 p-10">
					<h1 className="text-2xl md:text-4xl">ADMIN PAGE</h1>
					<Button variant='outline' size='lg' className="text-white border-gray-100">
						<Link href='/admin/' replace>Switch to Events list</Link>
					</Button>
				</div>
				<div className="container mx-auto px-4">
					<SpeedDatingAttendeeList />
				</div>
			</div>
		</main>
	)
}

