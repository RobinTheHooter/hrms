import { Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Table } from '@/components/GlobalComponents/Table/Table'
import { ErrorState } from '@/components/ui/error-state'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { PERMISSIONS, can } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { useOptions } from '@/features/meta/hooks'
import { getJobColumns } from '@/features/jobs/columns'
import { JobFormDialog } from '@/features/jobs/components/JobFormDialog'
import {
  useBulkDeleteJobs,
  useCreateJob,
  useDeleteJob,
  useJobs,
  useUpdateJob,
} from '@/features/jobs/hooks'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { errorMessage } from '@/lib/api-error'

function toFormValues(job) {
  return {
    title: job.title ?? '',
    department: job.department ?? '',
    location: job.location ?? '',
    employment_type: job.employment_type ?? 'full_time',
    positions: job.positions ?? 1,
    status: job.status ?? 'open',
    priority: job.priority ?? 'medium',
    assigned_consultant_id:
      job.assigned_consultant_id != null ? String(job.assigned_consultant_id) : '',
    description: job.description ?? '',
    required_skills: job.required_skills ?? '',
  }
}

export function JobsPage() {
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const canManage = can(user, PERMISSIONS.JOBS_MANAGE)
  const confirm = useConfirm()

  const [params] = useSearchParams()
  const [dialog, setDialog] = useState({ open: false, mode: 'create', job: null })

  // Active tab = open jobs; Inactive = closed. Seed from a status deep-link.
  const [tab, setTab] = useState(() =>
    params.get('status') === 'closed' ? 'inactive' : 'active',
  )
  const status = tab === 'inactive' ? 'closed' : 'open'

  const { data, isLoading, isError, refetch } = useJobs({ page: 1, size: 1000, status })

  const createMut = useCreateJob()
  const updateMut = useUpdateJob()
  const deleteMut = useDeleteJob()
  const bulkDeleteMut = useBulkDeleteJobs()

  const [selected, setSelected] = useState([])
  const gridApi = useRef(null)
  const clearSelection = () => {
    gridApi.current?.deselectAll()
    setSelected([])
  }

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: `Delete ${selected.length} job${selected.length > 1 ? 's' : ''}?`,
      description: 'This permanently removes the selected jobs.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!ok) return
    bulkDeleteMut.mutate(
      selected.map((j) => j.id),
      {
        onSuccess: (res) => {
          toast.success(`Deleted ${res?.deleted ?? selected.length} job(s)`)
          clearSelection()
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to delete jobs')),
      },
    )
  }

  const openCreate = () => setDialog({ open: true, mode: 'create', job: null })
  const openEdit = (job) => setDialog({ open: true, mode: 'edit', job })
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))

  const handleToggleStatus = (job) => {
    const next = job.status === 'open' ? 'closed' : 'open'
    updateMut.mutate(
      { id: job.id, payload: { status: next } },
      {
        onSuccess: () => toast.success(next === 'closed' ? 'Job closed' : 'Job reopened'),
        onError: (e) => toast.error(errorMessage(e, 'Failed to update job')),
      },
    )
  }

  const handleDelete = async (job) => {
    const count = job.candidate_count ?? 0
    const ok = await confirm({
      title: 'Delete job?',
      description:
        count > 0
          ? `"${job.title}" has ${count} candidate${count > 1 ? 's' : ''}. Deleting also permanently removes them and their interviews — consider closing the job instead.`
          : `This permanently removes "${job.title}".`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMut.mutate(job.id, {
      onSuccess: () => toast.success('Job deleted'),
      onError: (e) => toast.error(errorMessage(e, 'Failed to delete job')),
    })
  }

  const handleSubmit = (payload) => {
    if (dialog.mode === 'edit') {
      updateMut.mutate(
        { id: dialog.job.id, payload },
        {
          onSuccess: () => {
            toast.success('Job updated')
            closeDialog()
          },
          onError: (e) => toast.error(errorMessage(e, 'Failed to update job')),
        },
      )
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Job created')
          closeDialog()
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to create job')),
      })
    }
  }

  const columns = useMemo(
    () =>
      getJobColumns({
        onEdit: openEdit,
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        canManage,
        options,
        tab,
      }),
    [canManage, options, tab],
  )

  const tabs = (
    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
      {[
        { key: 'active', label: 'Active' },
        { key: 'inactive', label: 'Inactive' },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={
            'cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors ' +
            (tab === t.key
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground')
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Jobs"
        breadcrumb={['Recruitment', 'Jobs']}
        actions={
          canManage && (
            <Button onClick={openCreate} size="sm">
              <Plus className="size-4" /> Create job
            </Button>
          )
        }
      />

      {isError ? (
        <ErrorState
          description="We couldn't load your jobs right now. Please try again in a moment."
          onRetry={refetch}
        />
      ) : (
        <Table
          rowData={data?.items ?? []}
          columnData={columns}
          isLoading={isLoading}
          initialSearch={params.get('search') ?? ''}
          searchPlaceholder="Search by title, department, location…"
          selectable={canManage}
          onSelectionChanged={setSelected}
          onGridReady={(p) => (gridApi.current = p.api)}
          selection={{
            count: selected.length,
            onDelete: handleBulkDelete,
            onClear: clearSelection,
            isDeleting: bulkDeleteMut.isPending,
          }}
          toolbar={tabs}
        />
      )}

      {canManage && (
        <JobFormDialog
          open={dialog.open}
          onOpenChange={(open) => (open ? null : closeDialog())}
          mode={dialog.mode}
          initialValues={
            dialog.mode === 'edit' && dialog.job ? toFormValues(dialog.job) : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  )
}
