import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { getCandidateColumns } from '@/features/candidates/columns'
import { CandidateFormDialog } from '@/features/candidates/components/CandidateFormDialog'
import { NotifyDialog } from '@/features/candidates/components/NotifyDialog'
import {
  useCandidates,
  useCreateCandidate,
  useDeleteCandidate,
  useUpdateCandidate,
} from '@/features/candidates/hooks'
import { useJobs } from '@/features/jobs/hooks'
import { useOptions } from '@/features/meta/hooks'

const errorMessage = (e, fallback) =>
  e?.response?.data?.detail ??
  (e?.response?.status === 403 ? "You don't have permission." : fallback)

function toFormValues(c) {
  const str = (v) => (v != null ? String(v) : '')
  return {
    job_id: str(c.job_id),
    full_name: c.full_name ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    current_role: c.current_role ?? '',
    experience_years: str(c.experience_years),
    skills: c.skills ?? '',
    source: c.source ?? 'applied',
    current_ctc: str(c.current_ctc),
    expected_ctc: str(c.expected_ctc),
    notice_period_days: str(c.notice_period_days),
    resume_url: c.resume_url ?? '',
    stage: c.stage ?? 'applied',
    notes: c.notes ?? '',
  }
}

export function CandidatesPage() {
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const canManage = can(user, PERMISSIONS.CANDIDATES_MANAGE)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const [jobId, setJobId] = useState('all')
  const [dialog, setDialog] = useState({ open: false, mode: 'create', candidate: null })
  const [notify, setNotify] = useState({ open: false, candidate: null })

  const { data: jobsPage } = useJobs({ page: 1, size: 100 })
  const jobs = jobsPage?.items ?? []

  const { data, isLoading, isError } = useCandidates({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    search,
    stage: stage === 'all' ? undefined : stage,
    jobId: jobId === 'all' ? undefined : Number(jobId),
  })

  const createMut = useCreateCandidate()
  const updateMut = useUpdateCandidate()
  const deleteMut = useDeleteCandidate()

  const openCreate = () => setDialog({ open: true, mode: 'create', candidate: null })
  const openEdit = (candidate) => setDialog({ open: true, mode: 'edit', candidate })
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))
  const openNotify = (candidate) => setNotify({ open: true, candidate })

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }))

  const handleStageChange = (candidate, next) => {
    updateMut.mutate(
      { id: candidate.id, payload: { stage: next } },
      {
        onSuccess: () => toast.success(`Moved to ${next}`),
        onError: (e) => toast.error(errorMessage(e, 'Failed to update stage')),
      },
    )
  }

  const handleDelete = (candidate) => {
    if (!window.confirm(`Delete ${candidate.full_name}?`)) return
    deleteMut.mutate(candidate.id, {
      onSuccess: () => toast.success('Candidate deleted'),
      onError: (e) => toast.error(errorMessage(e, 'Failed to delete candidate')),
    })
  }

  const handleSubmit = (payload) => {
    if (dialog.mode === 'edit') {
      updateMut.mutate(
        { id: dialog.candidate.id, payload },
        {
          onSuccess: () => {
            toast.success('Candidate updated')
            closeDialog()
          },
          onError: (e) => toast.error(errorMessage(e, 'Failed to update candidate')),
        },
      )
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Candidate added')
          closeDialog()
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to add candidate')),
      })
    }
  }

  const columns = useMemo(
    () =>
      getCandidateColumns({
        onEdit: openEdit,
        onDelete: handleDelete,
        onStageChange: handleStageChange,
        onNotify: openNotify,
        canManage,
        options,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage, options],
  )

  return (
    <div>
      <PageHeader
        title="Candidates"
        breadcrumb={['Recruitment', 'Candidates']}
        actions={
          canManage && (
            <Button onClick={openCreate} size="sm">
              <Plus className="size-4" /> Add candidate
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={stage}
            onValueChange={(v) => {
              setStage(v)
              resetPage()
            }}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {(options?.candidate_stages ?? []).map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={jobId}
            onValueChange={(v) => {
              setJobId(v)
              resetPage()
            }}
          >
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <p className="p-6 text-sm text-destructive">
            Couldn't load candidates. Is the backend running?
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
        <CandidateFormDialog
          open={dialog.open}
          onOpenChange={(open) => (open ? null : closeDialog())}
          mode={dialog.mode}
          initialValues={
            dialog.mode === 'edit' && dialog.candidate
              ? toFormValues(dialog.candidate)
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={createMut.isPending || updateMut.isPending}
        />
      )}

      {canManage && (
        <NotifyDialog
          open={notify.open}
          onOpenChange={(open) => setNotify((n) => ({ ...n, open }))}
          candidate={notify.candidate}
        />
      )}
    </div>
  )
}
