import { fetchEvents } from "@/app/lib/data";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export default async function EventList() {
    const allEvents = await fetchEvents();

    return (
        <div className="container mx-auto px-4">
            <DataTable columns={columns} data={allEvents} />
        </div>
    );
}
