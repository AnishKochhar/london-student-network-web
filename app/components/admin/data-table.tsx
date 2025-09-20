"use client";

import { useState } from "react";

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    RowSelectionState,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/components/table";

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "../dropdown";

import { Button } from "../button";
import { Input } from "../input";

import {
    ChevronDownIcon,
    ChevronLeftIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface DataTableProps<TData extends { id: string }, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    control?: boolean;
}

export function DataTable<TData extends { id: string }, TValue>({
    columns,
    data,
    control = true,
}: DataTableProps<TData, TValue>) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    // const [isDeleting, setIsDeleting] = useState(false)
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        event_id: false,
    });
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const selectedRows = Object.keys(rowSelection);

    const router = useRouter();

    const searchTerm = control ? "title" : "name"; // events or contact_form

    const handleDelete = async () => {
        // setIsDeleting(true)
        try {
            const selectedIds = table
                .getSelectedRowModel()
                .rows.map((row) => row.original.id);
            await fetch("/api/events/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids: selectedIds }),
            });
            setRowSelection({});
        } catch (error) {
            console.error("Failed to delete events:", error);
        } finally {
            // setIsDeleting(false)
            setShowDeleteDialog(false);
        }
    };

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(), // defaults to 10
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        defaultColumn: {
            size: 10,
            minSize: 50,
            maxSize: 100,
        },
        columnResizeMode: "onChange",
    });
    return (
        <div>
            <div className="flex items-center py-4 justify-between space-x-2 sm:space-x-0">
                <Input
                    placeholder={
                        control
                            ? "Filter events by title.."
                            : "Filter form by sender name"
                    }
                    value={
                        (table
                            .getColumn(searchTerm)
                            ?.getFilterValue() as string) ?? ""
                    }
                    onChange={(event) =>
                        table
                            .getColumn(searchTerm)
                            ?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm bg-transparent"
                />
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                    {control && (
                        <div className="ml-auto flex space-x-2">
                            <Button
                                variant="filled"
                                className="border-slate-200 text-white"
                                disabled={selectedRows.length !== 1}
                                onClick={() => {
                                    const event =
                                        table.getSelectedRowModel().rows[0]
                                            .original;
                                    const eventData = encodeURIComponent(
                                        JSON.stringify(event),
                                    );
                                    router.push(
                                        `/events/edit?data=${eventData}`,
                                    );
                                }}
                            >
                                <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="border-green-700 text-white hover:bg-green-800"
                                onClick={() => router.push("/events/create")}
                            >
                                <PlusIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="border-slate-200 text-white hover:bg-red-900"
                                disabled={selectedRows.length === 0}
                                onClick={() => {
                                    setShowDeleteDialog(true);
                                }}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="ml-auto border-slate-200  text-white"
                            >
                                Toggle{" "}
                                <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="bg-white text-black p-4"
                        >
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize hover:bg-slate-300 rounded-lg"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id.replace("_", " ")}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="relative group"
                                            style={{ width: header.getSize() }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                            {/* {header.column.getCanResize() && (
												<div
													onMouseDown={header.getResizeHandler()}
													onTouchStart={header.getResizeHandler()}
													className={`absolute right-0 top-0 h-full w-1 bg-transparent group-hover:bg-gray-400 cursor-col-resize ${header.column.getIsResizing() ? "bg-gray-600" : ""}`}
												/>
											)} */}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{
                                                width: cell.column.getSize(),
                                            }}
                                            className="overflow-hidden truncate max-w-[500px] text-ellipsis"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
            {showDeleteDialog && (
                <DeleteConfirmDialog
                    toggleDialog={() => setShowDeleteDialog(false)}
                    handleConfirm={handleDelete}
                />
            )}
        </div>
    );
}

interface DeleteConfirmDialogProps {
    toggleDialog: () => void;
    handleConfirm: () => void;
}

function DeleteConfirmDialog({
    toggleDialog,
    handleConfirm,
}: DeleteConfirmDialogProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-300 p-6 rounded-lg w-[40%] h-auto min-w-[300px] flex flex-col justify-between items-center text-center text-black shadow-lg">
                <h3 className="text-lg font-medium">
                    Are you sure you would like to delete these events?
                </h3>
                <p className="text-red-600 font-semibold text-sm mt-2">
                    WARNING - THIS ACTION IS IRREVERSIBLE
                </p>
                <div className="flex justify-between w-full mt-6 space-x-4">
                    <Button
                        variant="outline"
                        size="md"
                        onClick={toggleDialog}
                        className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-4 rounded-full w-full"
                    >
                        <ChevronLeftIcon
                            width={4}
                            height={4}
                            className="w-4 h-4 mr-2"
                        />
                        CANCEL
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-full w-full justify-end"
                    >
                        DELETE
                        <TrashIcon className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
