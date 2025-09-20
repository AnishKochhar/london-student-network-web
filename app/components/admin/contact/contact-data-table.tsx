// app/components/contact-data-table.tsx
import { DataTable } from "@/app/components/admin/data-table";
import { contactColumns } from "./contact-columns";
import { fetchAllContactForms } from "@/app/lib/data";

export default async function ContactFormList() {
    const allFormEntries = await fetchAllContactForms();

    return (
        <div>
            <h1 className="text-3xl font-semibold mb-4">
                Contact Form Submissions
            </h1>
            <DataTable
                columns={contactColumns}
                data={allFormEntries}
                control={false}
            />
        </div>
    );
}
