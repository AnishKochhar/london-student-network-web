"use server";

import ModernCreateEvent from "@/app/components/events-page/modern-create-event";
import { SocietyLogos } from "@/app/lib/utils";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { User } from "next-auth";

export default async function CreatePage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const user = session?.user;
    const user_id = user.id;

    const organiserList = await getAuthorisedOrganiserList(user);

    return (
        <ModernCreateEvent
            organiser_id={user_id}
            organiserList={organiserList}
        />
    );
}

// Returns the list of Organisers a user is allowed to post for
async function getAuthorisedOrganiserList(user: User): Promise<string[]> {
    try {
        if (user?.role === "admin") {
            return SocietyLogos.map((society) => society.name);
        }
        if (user?.name) {
            return [user?.name];
        } else {
            throw new Error("User is not authenticated");
        }
    } catch (error) {
        console.error("Failed to get authorised organiser list:", error);
        return [];
    }
}
