import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { AgGridReact } from 'ag-grid-react'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import './Table.css'

// Ag-Grid v33 is modular; register the community bundle once.
ModuleRegistry.registerModules([AllCommunityModule])

const DEFAULT_COL_DEF = {
  sortable: true,
  resizable: true,
  filter: true,
  flex: 1,
  minWidth: 130,
}

function GridSkeleton({ columns = 5, rows = 6 }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex gap-4 border-b bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b px-4 py-4 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Global data table (Ag-Grid) themed to the app. Client-side model:
 * pass all rows via `rowData` and the grid handles sorting, quick-filter
 * search and pagination. Custom cells come from the shared renderer
 * components in ../TableComponents.
 *
 * Props:
 * - rowData, columnData        — data + Ag-Grid column defs
 * - isLoading                  — show a skeleton instead of the grid
 * - getRowId                   — stable row id (defaults to row.id)
 * - pageSize                   — rows per page (default 10)
 * - quickFilter                — show the built-in search box (default true)
 * - searchPlaceholder          — search box placeholder
 * - toolbar                    — extra controls rendered beside the search box
 * - rowClassRules              — Ag-Grid per-row class rules
 * - onRowClicked               — row click handler
 */
export function Table({
  rowData = [],
  columnData = [],
  isLoading = false,
  getRowId,
  pageSize = 10,
  quickFilter = true,
  searchPlaceholder = 'Search…',
  initialSearch = '',
  toolbar = null,
  rowClassRules,
  onRowClicked,
}) {
  const [quick, setQuick] = useState(initialSearch)

  const resolveRowId = useMemo(
    () => getRowId ?? ((p) => String(p.data?.id ?? p.data?.uuid ?? '')),
    [getRowId],
  )

  if (isLoading) {
    return <GridSkeleton columns={Math.max(columnData.length, 3)} />
  }

  return (
    <div>
      {(quickFilter || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 pb-4">
          {quickFilter && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="ag-theme-quartz ag-app overflow-hidden rounded-xl border">
        <AgGridReact
          theme="legacy"
          rowData={rowData}
          columnDefs={columnData}
          defaultColDef={DEFAULT_COL_DEF}
          getRowId={resolveRowId}
          quickFilterText={quick}
          rowClassRules={rowClassRules}
          onRowClicked={onRowClicked}
          pagination
          paginationPageSize={pageSize}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          domLayout="autoHeight"
          enableCellTextSelection
          tooltipShowDelay={0}
          tooltipHideDelay={2000}
          animateRows
          overlayNoRowsTemplate="No results."
        />
      </div>
    </div>
  )
}

export default Table
