"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Event } from "@/app/lib/types";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { Button } from "../button";
import { DataTableColumnHeader } from "./column-header";
import { Checkbox } from "../checkbox";

const parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split("/").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JavaScript
};

export const columns: ColumnDef<Event>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected()
                        ? "indeterminate"
                        : false)
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                className="bg-white text-black"
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                className="bg-white text-black"
                aria-label="Select event"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "event_id",
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => row.getValue("event_id"),
        enableHiding: true,
    },
    {
        accessorKey: "date",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Date
                    <ArrowsUpDownIcon className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        sortingFn: (rowA, rowB, columnId) => {
            const dateA = parseDate(rowA.getValue(columnId));
            const dateB = parseDate(rowB.getValue(columnId));
            return dateA.getTime() - dateB.getTime();
        },
    },
    {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) => {
            return (
                <div className="text-start min-w-[70px]">
                    {row.getValue("time")}
                </div>
            );
        },
        enableResizing: true,
    },
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
            return (
                <div className="text-md line-clamp-5 italic">
                    {row.getValue("title")}
                </div>
            );
        },
        enableResizing: true,
    },
    {
        accessorKey: "organiser",
        // header: "Organiser",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Organiser" />
        ),
        enableResizing: true,
    },
    {
        accessorKey: "description",
        header: () => <div className="max-w-[100px]">Description</div>,
        cell: ({ row }) => {
            return (
                <div className="line-clamp-4">
                    {row.getValue("description")}
                </div>
            );
        },
        enableResizing: true,
    },
    // {
    // 	accessorKey: "image_url",
    // 	header: "Image",
    // 	cell: ({ row }) => {
    // 		console.log(`Image: ${row.getValue('image_url')}`)
    // 		return <img src={row.getValue("image_url")} alt={row.getValue("image_url")} className="w-10 h-10 object-cover cursor-pointer" />
    // 	}
    // }
    {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
            return (
                <div className="line-clamp-5">
                    <div className="text-gray-400">
                        {row.original.location_building}
                    </div>
                    <div className="text-gray-300">
                        {row.original.location_area}
                    </div>
                    <div className="text-white">
                        {row.original.location_address}
                    </div>
                </div>
            );
        },
    },
];
