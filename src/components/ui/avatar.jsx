import { cn } from '@/lib/utils'

// Deterministic soft background per name, so avatars feel personal but calm.
const PALETTE = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-fuchsia-100 text-fuchsia-700',
]

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

function colorFor(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

const sizes = {
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
}

export function Avatar({ name, size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
        sizes[size],
        colorFor(name),
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  )
}
