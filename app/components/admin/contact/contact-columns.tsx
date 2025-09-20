"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/app/components/admin/column-header";
import { ContactFormInput } from "@/app/lib/types";

export const contactColumns: ColumnDef<ContactFormInput>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
            return <div className="text-sm">{row.getValue("name")}</div>;
        },
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => {
            return <div className="text-sm">{row.getValue("email")}</div>;
        },
    },
    {
        accessorKey: "message",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Message" />
        ),
        cell: ({ row }) => {
            return <div className="text-sm">{row.getValue("message")}</div>;
        },
    },
];
