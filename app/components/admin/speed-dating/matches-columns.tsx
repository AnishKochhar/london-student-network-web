"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DatingMatch } from "@/app/lib/types";
import { DataTableColumnHeader } from "@/app/components/admin/column-header";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";

export function matchesColumns(): ColumnDef<DatingMatch>[] {
	return [
		{
			accessorKey: "from",
			header: ({ column }) => (
				<button
					type="button"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center"
				>
					<DataTableColumnHeader column={column} title="From" />
					<ArrowsUpDownIcon className="ml-2 h-4 w-4" />
				</button>
			),
			cell: ({ row }) => {
				const id = row.original.from;
				const name = row.original.fromName || "";
				return <div className="text-sm">{`${id} - ${name}`}</div>;
			},
		},
		{
			accessorKey: "to",
			header: ({ column }) => (
				<button
					type="button"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center"
				>
					<DataTableColumnHeader column={column} title="To" />
					<ArrowsUpDownIcon className="ml-2 h-4 w-4" />
				</button>
			),
			cell: ({ row }) => {
				const id = row.original.to;
				const name = row.original.toName || "";
				return <div className="text-sm">{`${id} - ${name}`}</div>;
			},
		},
	];
}
