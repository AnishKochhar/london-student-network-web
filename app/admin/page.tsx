"use server";

import { hasAdminPermissions } from "@/app/lib/actions";
import { redirect } from "next/navigation";
import EventList from "../components/admin/events-list";

export default async function AdminPage() {

	const isAdmin = await hasAdminPermissions('/login')

	if (!isAdmin) {
		return redirect('/login')
	}

	return (
		<main className="relative h-full max-auto pt-8 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
			<div className="flex flex-col h-full justify-center items-center p-6">
				<h1 className="text-2xl md:text-4xl">ADMIN PAGE</h1>
				<p className="p-6"> Welcome to the admin dashboard. Here you can view all event listings, remove listings, and add new ones</p>
				<EventList />
			</div>

		</main>
	)
}
