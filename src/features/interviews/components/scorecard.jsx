import { cn } from '@/lib/utils'

export const COMPETENCIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'communication', label: 'Communication' },
  { key: 'culture_fit', label: 'Culture fit' },
  { key: 'problem_solving', label: 'Problem solving' },
]

export const RECOMMENDATIONS = [
  { value: 'strong_no', label: 'Strong No', positive: false },
  { value: 'no', label: 'No', positive: false },
  { value: 'yes', label: 'Yes', positive: true },
  { value: 'strong_yes', label: 'Strong Yes', positive: true },
]

export function Rating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            'flex size-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
            value >= n
              ? 'border-primary bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
