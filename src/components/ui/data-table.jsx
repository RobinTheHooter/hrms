import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/**
 * Reusable table built on TanStack Table.
 * Supports client-side pagination (default) or server-side pagination
 * when `manualPagination` + `pageCount` + `pagination`/`onPaginationChange`
 * are supplied.
 */
export function DataTable({
  columns,
  data = [],
  isLoading = false,
  manualPagination = false,
  pageCount,
  pagination,
  onPaginationChange,
}) {
  const [sorting, setSorting] = useState([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      ...(manualPagination ? { pagination } : {}),
    },
    onSortingChange: setSorting,
    onPaginationChange,
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
  })

  return (
    <div>
      <div className="overflow-hidden">
        <Table className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader className="bg-muted/40 [&_th]:h-11">
            {/* header groups below */}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
        <span className="text-xs text-muted-foreground">
          Page {(pagination?.pageIndex ?? 0) + 1}
          {pageCount ? ` of ${pageCount}` : ''}
        </span>
        <div className="flex gap-2">
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
      </div>
    </div>
  )
}
