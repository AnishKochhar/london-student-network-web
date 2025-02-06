import { DataTable } from "@/app/components/admin/data-table";
import { datingAttendeesColumns } from "./speed-dating-columns";
import { fetchDatingAttendees } from "@/app/lib/data";


export default async function SpeedDatingAttendeeList() {

	const allFormEntries = await fetchDatingAttendees()

	return (
		<div>
			<h1 className="text-3xl font-semibold mb-4">Speed Dating Attendees</h1>
			<DataTable columns={datingAttendeesColumns} data={allFormEntries} control={false} />
		</div>
	);
}
