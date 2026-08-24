import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * Bulk-action bar shown above a table when rows are selected.
 * Props: count, onDelete, onClear, isDeleting.
 */
export function SelectionBar({ count = 0, onDelete, onClear, isDeleting = false }) {
  if (!count) return null
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
      <span className="text-sm font-medium">
        {count} selected
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onClear} disabled={isDeleting}>
          Clear
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
          <Trash2 className="size-4" /> {isDeleting ? 'Deleting…' : 'Delete selected'}
        </Button>
      </div>
    </div>
  )
}

export default SelectionBar
