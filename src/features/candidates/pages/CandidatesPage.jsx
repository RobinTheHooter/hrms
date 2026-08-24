import { Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Pagination } from '@/components/GlobalComponents/Table/Pagination'
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
import { getCandidateColumns } from '@/features/candidates/columns'
import { AiScreeningDialog } from '@/features/candidates/components/AiScreeningDialog'
import { CandidateFormDialog } from '@/features/candidates/components/CandidateFormDialog'
import { NotifyDialog } from '@/features/candidates/components/NotifyDialog'
import { downloadResume } from '@/features/candidates/api'
import {
  useCandidates,
  useCreateCandidate,
  useDeleteCandidate,
  useUpdateCandidate,
  useUploadResume,
} from '@/features/candidates/hooks'
import { useJobs } from '@/features/jobs/hooks'
import { useOptions } from '@/features/meta/hooks'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { errorMessage } from '@/lib/api-error'

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
    priority: c.priority ?? 'medium',
    notes: c.notes ?? '',
  }
}

export function CandidatesPage() {
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const canManage = can(user, PERMISSIONS.CANDIDATES_MANAGE)
  const confirm = useConfirm()

  const [params] = useSearchParams()
  // Server-side pagination: only the current page is fetched, so the candidates
  // list stays light even once the careers page starts adding applicants.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState(() => params.get('search') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => params.get('search') ?? '')
  const [stage, setStage] = useState(() => params.get('stage') ?? 'all')
  const [source, setSource] = useState(() => params.get('source') ?? 'all')
  const [jobId, setJobId] = useState(() => params.get('job') ?? 'all')
  const [minScore, setMinScore] = useState(() => params.get('min_score') ?? 'all')
  const [sort, setSort] = useState(() => params.get('sort') ?? 'recent')
  const [dialog, setDialog] = useState({ open: false, mode: 'create', candidate: null })
  const [notify, setNotify] = useState({ open: false, candidate: null })
  const [screen, setScreen] = useState({ open: false, candidate: null })

  const { data: jobsPage } = useJobs({ page: 1, size: 1000 })
  const jobs = jobsPage?.items ?? []

  // Debounce free-text search, then reset to the first page.
  const timer = useRef()
  const handleSearchChange = (value) => {
    setSearch(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 400)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  // Changing a filter/sort always returns to the first page.
  const withReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const { data, isLoading, isFetching, isError } = useCandidates({
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
    stage: stage === 'all' ? undefined : stage,
    source: source === 'all' ? undefined : source,
    jobId: jobId === 'all' ? undefined : Number(jobId),
    min_score: minScore === 'all' ? undefined : Number(minScore),
    sort: sort === 'score' ? 'score' : undefined,
  })

  const createMut = useCreateCandidate()
  const updateMut = useUpdateCandidate()
  const deleteMut = useDeleteCandidate()
  const uploadMut = useUploadResume()

  const openCreate = () => setDialog({ open: true, mode: 'create', candidate: null })
  const openEdit = (candidate) => setDialog({ open: true, mode: 'edit', candidate })
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))
  const openNotify = (candidate) => setNotify({ open: true, candidate })
  const openScreen = (candidate) => setScreen({ open: true, candidate })

  const handleViewResume = async (candidate) => {
    try {
      const blob = await downloadResume(candidate.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      toast.error('Could not open the resume')
    }
  }

  const handleStageChange = (candidate, next) => {
    updateMut.mutate(
      { id: candidate.id, payload: { stage: next } },
      {
        onSuccess: () => toast.success(`Moved to ${next}`),
        onError: (e) => toast.error(errorMessage(e, 'Failed to update stage')),
      },
    )
  }

  const handleDelete = async (candidate) => {
    const ok = await confirm({
      title: 'Delete candidate?',
      description: `This permanently removes ${candidate.full_name} and their records.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMut.mutate(candidate.id, {
      onSuccess: () => toast.success('Candidate deleted'),
      onError: (e) => toast.error(errorMessage(e, 'Failed to delete candidate')),
    })
  }

  const handleSubmit = async (payload, file) => {
    try {
      const isEdit = dialog.mode === 'edit'
      const saved = isEdit
        ? await updateMut.mutateAsync({ id: dialog.candidate.id, payload })
        : await createMut.mutateAsync(payload)

      if (file) {
        // Uploading triggers automatic AI screening on the backend.
        await uploadMut.mutateAsync({ id: saved.id, file })
      }
      toast.success(isEdit ? 'Candidate updated' : 'Candidate added')
      closeDialog()
    } catch (e) {
      toast.error(errorMessage(e, 'Failed to save candidate'))
    }
  }

  const columns = useMemo(
    () =>
      getCandidateColumns({
        onEdit: openEdit,
        onDelete: handleDelete,
        onStageChange: handleStageChange,
        onNotify: openNotify,
        onScreen: openScreen,
        onViewResume: handleViewResume,
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

      {isError ? (
        <p className="p-6 text-sm text-destructive">
          Couldn't load candidates. Is the backend running?
        </p>
      ) : (
        <>
          <Table
            rowData={data?.items ?? []}
            columnData={columns}
            isLoading={isLoading}
            useAgGridPagination={false}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by name or email…"
            toolbar={
              <>
                <Select value={stage} onValueChange={withReset(setStage)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {(options?.candidate_stages ?? []).map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={source} onValueChange={withReset(setSource)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {(options?.candidate_sources ?? []).map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={jobId} onValueChange={withReset(setJobId)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All jobs</SelectItem>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={minScore} onValueChange={withReset(setMinScore)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any AI score</SelectItem>
                    <SelectItem value="60">60+</SelectItem>
                    <SelectItem value="75">75+</SelectItem>
                    <SelectItem value="85">85+</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={withReset(setSort)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most recent</SelectItem>
                    <SelectItem value="score">Top AI score</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            pages={data?.pages ?? 0}
            isFetching={isFetching}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n)
              setPage(1)
            }}
          />
        </>
      )}

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
          isSubmitting={
            createMut.isPending || updateMut.isPending || uploadMut.isPending
          }
        />
      )}

      {canManage && (
        <NotifyDialog
          open={notify.open}
          onOpenChange={(open) => setNotify((n) => ({ ...n, open }))}
          candidate={notify.candidate}
        />
      )}

      {canManage && (
        <AiScreeningDialog
          open={screen.open}
          onOpenChange={(open) => setScreen((s) => ({ ...s, open }))}
          candidate={screen.candidate}
        />
      )}
    </div>
  )
}
