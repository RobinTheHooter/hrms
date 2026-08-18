import { FileText, Mail, Pencil, Trash2 } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { stageVariant } from '@/features/candidates/constants'
import { optionLabel } from '@/features/meta/hooks'

export function getCandidateColumns({
  onEdit,
  onDelete,
  onStageChange,
  onNotify,
  canManage,
  options,
}) {
  const stages = options?.candidate_stages ?? []

  const columns = [
    {
      accessorKey: 'full_name',
      header: 'Candidate',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar name={c.full_name} />
            <div className="leading-tight">
              <div className="font-medium">{c.full_name}</div>
              <div className="text-xs text-muted-foreground">{c.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      id: 'job',
      header: 'Role',
      cell: ({ row }) => row.original.job?.title ?? '—',
    },
    {
      accessorKey: 'current_role',
      header: 'Current role',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      accessorKey: 'experience_years',
      header: 'Exp',
      cell: ({ getValue }) => (getValue() != null ? `${getValue()} yrs` : '—'),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ getValue }) => (
        <Badge variant="secondary">
          {optionLabel(options?.candidate_sources, getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => {
        const value = row.original.stage
        if (!canManage) {
          return (
            <Badge variant={stageVariant(value)}>
              {optionLabel(stages, value)}
            </Badge>
          )
        }
        return (
          <Select
            value={value}
            onValueChange={(next) => onStageChange(row.original, next)}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.length === 0 ? (
                <SelectEmpty>No stages found</SelectEmpty>
              ) : (
                stages.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: 'resume',
      header: 'CV',
      cell: ({ row }) =>
        row.original.resume_url ? (
          <a
            href={row.original.resume_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <FileText className="size-3.5" /> View
          </a>
        ) : (
          '—'
        ),
    },
  ]

  if (canManage) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Notify candidate"
            onClick={() => onNotify(row.original)}
          >
            <Mail className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    })
  }

  return columns
}
