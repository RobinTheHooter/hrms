import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
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
  useCreateJob,
  useDeleteJob,
  useJobs,
  useUpdateJob,
} from '@/features/jobs/hooks'

const errorMessage = (e, fallback) =>
  e?.response?.data?.detail ??
  (e?.response?.status === 403 ? "You don't have permission." : fallback)

function toFormValues(job) {
  return {
    title: job.title ?? '',
    department: job.department ?? '',
    location: job.location ?? '',
    employment_type: job.employment_type ?? 'full_time',
    positions: job.positions ?? 1,
    status: job.status ?? 'open',
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

  const [params] = useSearchParams()
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [search, setSearch] = useState(() => params.get('search') ?? '')
  const [status, setStatus] = useState(() => params.get('status') ?? 'all')
  const [dialog, setDialog] = useState({ open: false, mode: 'create', job: null })

  const { data, isLoading, isError } = useJobs({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    search,
    status: status === 'all' ? undefined : status,
  })

  const createMut = useCreateJob()
  const updateMut = useUpdateJob()
  const deleteMut = useDeleteJob()

  const openCreate = () => setDialog({ open: true, mode: 'create', job: null })
  const openEdit = (job) => setDialog({ open: true, mode: 'edit', job })
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))

  const handleDelete = (job) => {
    if (!window.confirm(`Delete "${job.title}"?`)) return
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

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, department, location…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          >
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
        </div>

        {isError ? (
          <p className="p-6 text-sm text-destructive">
            Couldn't load jobs. Is the backend running?
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            manualPagination
            pageCount={data?.pages ?? 0}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        )}
      </Card>

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
