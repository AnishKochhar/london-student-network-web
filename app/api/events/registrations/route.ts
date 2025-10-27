import { NextResponse } from "next/server";
import { getRegistrationsForEvent } from "@/app/lib/data";

export async function POST(req: Request) {
    const { event_id }: { event_id: string } = await req.json();
    const response = await getRegistrationsForEvent(event_id);

    if (!response.success) {
        return NextResponse.json(response);
    }

    // Calculate statistics from registrations
    const registrations = response.registrations;
    const totalRegistrations = registrations.length;
    const internalRegistrations = registrations.filter(r => !r.external).length;
    const externalRegistrations = registrations.filter(r => r.external).length;

    // Sort by most recent
    const sortedRegistrations = [...registrations].sort((a, b) => {
        const dateA = new Date(a.date_registered).getTime();
        const dateB = new Date(b.date_registered).getTime();
        return dateB - dateA;
    });

    return NextResponse.json({
        success: true,
        registrations: sortedRegistrations,
        totalRegistrations,
        internalRegistrations,
        externalRegistrations,
    });
}
