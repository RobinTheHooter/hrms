// Badge variant per priority level (options themselves come from the backend).
const VARIANT = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'secondary',
}

export const priorityVariant = (value) => VARIANT[value] ?? 'secondary'

// Rank for sorting (higher = more urgent). Unknown values sort last.
const RANK = { urgent: 4, high: 3, medium: 2, low: 1 }
export const priorityRank = (value) => RANK[value] ?? 0

// Ag-Grid comparator: sort by priority rank (raw row value), not the label.
export const priorityComparator = (_a, _b, nodeA, nodeB) =>
  priorityRank(nodeA?.data?.priority) - priorityRank(nodeB?.data?.priority)
