import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { AgGridReact } from 'ag-grid-react'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import './Table.css'

// Ag-Grid v33 is modular; register the community bundle once (includes the
// client-side AND infinite row models).
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
 * Global data table (Ag-Grid) themed to the app.
 *
 * Two modes:
 * - Client-side (default): pass all rows via `rowData`; the grid handles
 *   sorting, quick-filter search and pagination in the browser.
 * - Server-side (`serverSide`): the Infinite Row Model fetches one page-block
 *   at a time via `fetchRows({ startRow, endRow, sortModel }) → { rows, rowCount }`.
 *   Search + toolbar filters are owned by the page; pass them through
 *   `searchValue`/`onSearchChange` and bump `refreshKey` to reload the grid.
 *
 * Common props: columnData, getRowId, pageSize, searchPlaceholder, toolbar,
 * rowClassRules, onRowClicked.
 */
export function Table({
  // client mode
  rowData = [],
  isLoading = false,
  // server mode
  serverSide = false,
  fetchRows,
  refreshKey,
  searchValue,
  onSearchChange,
  height = 560,
  // shared
  columnData = [],
  getRowId,
  pageSize = 20,
  quickFilter = true,
  searchPlaceholder = 'Search…',
  initialSearch = '',
  toolbar = null,
  rowClassRules,
  onRowClicked,
  // Toggle Ag-Grid's built-in pagination. Set false when the page drives
  // pagination itself (server-side, numbered pages via <Pagination />).
  useAgGridPagination = true,
  // Column header sorting. Disable when only the current page is loaded
  // (server-side), since client sort would reorder just that page.
  sortable = true,
}) {
  const [quick, setQuick] = useState(initialSearch)

  const resolveRowId = useMemo(
    () => getRowId ?? ((p) => String(p.data?.id ?? p.data?.uuid ?? '')),
    [getRowId],
  )

  const defaultColDef = useMemo(
    () => ({ ...DEFAULT_COL_DEF, sortable }),
    [sortable],
  )

  // Keep the latest fetchRows without forcing the datasource to be rebuilt on
  // every render — the datasource is only recreated when `refreshKey` changes,
  // which reloads the grid from the first block.
  const fetchRef = useRef(fetchRows)
  useEffect(() => {
    fetchRef.current = fetchRows
  }, [fetchRows])

  const datasource = useMemo(() => {
    if (!serverSide) return undefined
    return {
      getRows: async (params) => {
        try {
          const { rows, rowCount } = await fetchRef.current({
            startRow: params.startRow,
            endRow: params.endRow,
            sortModel: params.sortModel,
          })
          params.success({ rowData: rows, rowCount })
        } catch {
          params.fail()
        }
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSide, refreshKey])

  // Search box: controlled by the page in server mode, internal quick-filter
  // (client-side) otherwise.
  const searchControlled = typeof onSearchChange === 'function'
  const searchBoxValue = searchControlled ? (searchValue ?? '') : quick
  const handleSearch = searchControlled ? onSearchChange : setQuick

  if (!serverSide && isLoading) {
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
                value={searchBoxValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div
        className="ag-theme-quartz ag-app overflow-hidden rounded-xl border"
        style={serverSide ? { height } : undefined}
      >
        <AgGridReact
          theme="legacy"
          columnDefs={columnData}
          defaultColDef={defaultColDef}
          getRowId={resolveRowId}
          rowClassRules={rowClassRules}
          onRowClicked={onRowClicked}
          tooltipShowDelay={0}
          tooltipHideDelay={2000}
          animateRows
          overlayNoRowsTemplate="No results."
          {...(serverSide
            ? {
                rowModelType: 'infinite',
                datasource,
                cacheBlockSize: pageSize,
                maxBlocksInCache: 10,
                infiniteInitialRowCount: 1,
                pagination: true,
                paginationPageSize: pageSize,
                paginationPageSizeSelector: false,
              }
            : {
                rowData,
                quickFilterText: searchControlled ? undefined : quick,
                domLayout: 'autoHeight',
                enableCellTextSelection: true,
                pagination: useAgGridPagination,
                ...(useAgGridPagination
                  ? {
                      paginationPageSize: pageSize,
                      paginationPageSizeSelector: [10, 25, 50, 100],
                    }
                  : {}),
              })}
        />
      </div>
    </div>
  )
}

export default Table
