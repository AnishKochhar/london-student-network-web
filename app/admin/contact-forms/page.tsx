"use server";

import ContactFormList from "@/app/components/admin/contact/contact-data-table";
import AdminPageHeader from "@/app/components/admin/admin-page-header";

export default async function AdminContactFormsPage() {
    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="Contact Form Submissions"
                description="View all contact form submissions from users"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Contact Forms" },
                ]}
            />

            <div className="p-6 sm:p-8">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-200">
                        <strong className="text-amber-300">Note:</strong> You cannot edit or delete these submissions. They are read-only for record-keeping purposes.
                    </p>
                </div>

                <ContactFormList />
            </div>
        </div>
    );
}
