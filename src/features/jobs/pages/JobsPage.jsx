import { Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Table } from '@/components/GlobalComponents/Table/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const [status, setStatus] = useState(() => params.get('status') ?? 'all')
  const [dialog, setDialog] = useState({ open: false, mode: 'create', job: null })

  const { data, isLoading, isError } = useJobs({
    page: 1,
    size: 1000,
    status: status === 'all' ? undefined : status,
  })

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

  const handleDelete = async (job) => {
    const ok = await confirm({
      title: 'Delete job?',
      description: `This permanently removes "${job.title}".`,
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
    () => getJobColumns({ onEdit: openEdit, onDelete: handleDelete, canManage, options }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage, options],
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
        <p className="p-6 text-sm text-destructive">
          Couldn't load jobs. Is the backend running?
        </p>
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
          toolbar={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(options?.job_statuses ?? []).map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
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
