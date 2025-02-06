"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DatingEventAttendee } from "@/app/lib/types";
import { DataTableColumnHeader } from "../column-header";

export const datingAttendeesColumns: ColumnDef<DatingEventAttendee>[] = [
	{
		accessorKey: "id",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="ID" />
		),
		cell: ({ row }) => {
			return <div className="text-sm">{row.getValue("id")}</div>
		},
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
		cell: ({ row }) => {
			return <div className="text-sm">{row.getValue("name")}</div>
		},
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Email" />
		),
		cell: ({ row }) => {
			return <div className="text-sm">{row.getValue("email")}</div>
		},
	},
];
