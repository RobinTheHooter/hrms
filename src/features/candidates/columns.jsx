import { Mail, Pencil, Sparkles, Trash2 } from 'lucide-react'

import { ActionsRenderer } from '@/components/GlobalComponents/TableComponents/ActionsRenderer'
import { AiScoreRenderer } from '@/components/GlobalComponents/TableComponents/AiScoreRenderer'
import { BadgeRenderer } from '@/components/GlobalComponents/TableComponents/BadgeRenderer'
import { PersonRenderer } from '@/components/GlobalComponents/TableComponents/PersonRenderer'
import { ResumeRenderer } from '@/components/GlobalComponents/TableComponents/ResumeRenderer'
import { StageRenderer } from '@/components/GlobalComponents/TableComponents/StageRenderer'
import { stageVariant } from '@/features/candidates/constants'
import { optionLabel } from '@/features/meta/hooks'
import { priorityVariant } from '@/lib/priority'

export function getCandidateColumns({
  onEdit,
  onDelete,
  onStageChange,
  onNotify,
  onScreen,
  onViewResume,
  canManage,
  options,
}) {
  const stages = options?.candidate_stages ?? []

  const columns = [
    {
      headerName: 'Candidate',
      field: 'full_name',
      flex: 2,
      minWidth: 220,
      cellRenderer: PersonRenderer,
      cellRendererParams: {
        getName: (d) => d.full_name,
        getSubtitle: (d) => d.email,
      },
      valueGetter: (p) => `${p.data.full_name ?? ''} ${p.data.email ?? ''}`,
    },
    {
      headerName: 'Role',
      colId: 'job',
      valueGetter: (p) => p.data.job?.title ?? '—',
    },
    {
      headerName: 'Current role',
      field: 'current_role',
      valueFormatter: (p) => p.value || '—',
    },
    {
      headerName: 'Exp',
      field: 'experience_years',
      maxWidth: 110,
      valueFormatter: (p) => (p.value != null ? `${p.value} yrs` : '—'),
    },
    {
      headerName: 'Source',
      colId: 'source',
      valueGetter: (p) => optionLabel(options?.candidate_sources, p.data.source),
      cellRenderer: BadgeRenderer,
    },
    {
      headerName: 'Stage',
      field: 'stage',
      minWidth: 150,
      cellRenderer: StageRenderer,
      cellRendererParams: {
        canManage,
        stages,
        onStageChange,
        getVariant: stageVariant,
      },
    },
    {
      headerName: 'Priority',
      colId: 'priority',
      valueGetter: (p) => optionLabel(options?.priorities, p.data.priority),
      cellRenderer: BadgeRenderer,
      cellRendererParams: { getVariant: (_v, d) => priorityVariant(d.priority) },
    },
    {
      headerName: 'AI score',
      field: 'ai_score',
      maxWidth: 120,
      cellRenderer: AiScoreRenderer,
    },
    {
      headerName: 'CV',
      colId: 'resume',
      maxWidth: 110,
      sortable: false,
      filter: false,
      cellRenderer: ResumeRenderer,
      cellRendererParams: { onView: onViewResume },
    },
  ]

  if (canManage) {
    columns.push({
      headerName: 'Actions',
      colId: 'actions',
      headerClass: 'header-center',
      flex: 0,
      width: 200,
      minWidth: 200,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ActionsRenderer,
      cellRendererParams: {
        getActions: () => [
          { icon: Sparkles, title: 'AI screening', onClick: onScreen, className: 'text-primary' },
          { icon: Mail, title: 'Notify candidate', onClick: onNotify },
          { icon: Pencil, title: 'Edit', onClick: onEdit },
          { icon: Trash2, title: 'Delete', danger: true, onClick: onDelete },
        ],
      },
    })
  }

  return columns
}
