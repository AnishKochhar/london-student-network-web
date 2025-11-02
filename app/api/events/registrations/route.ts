import { NextResponse } from "next/server";
import { getRegistrationsForEvent } from "@/app/lib/data";

export async function POST(req: Request) {
    const { event_id, includeCancelled }: { event_id: string; includeCancelled?: boolean } = await req.json();
    const response = await getRegistrationsForEvent(event_id, includeCancelled);

    if (!response.success) {
        return NextResponse.json(response);
    }

    // Calculate statistics from registrations
    const registrations = response.registrations;
    const activeRegistrations = registrations.filter(r => !r.is_cancelled);
    const cancelledRegistrations = registrations.filter(r => r.is_cancelled);

    const totalRegistrations = activeRegistrations.length;
    const internalRegistrations = activeRegistrations.filter(r => !r.external).length;
    const externalRegistrations = activeRegistrations.filter(r => r.external).length;

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
        totalCancellations: cancelledRegistrations.length,
    });
}
