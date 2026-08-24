import { Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { SelectionBar } from '@/components/GlobalComponents/Table/SelectionBar'
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
import { getInterviewColumns } from '@/features/interviews/columns'
import { toLocalInput } from '@/features/interviews/constants'
import { InterviewScheduleDialog } from '@/features/interviews/components/InterviewScheduleDialog'
import { OutcomeDialog } from '@/features/interviews/components/OutcomeDialog'
import {
  useBulkDeleteInterviews,
  useDeleteInterview,
  useInterviews,
  useRecordOutcome,
  useScheduleInterview,
  useUpdateInterview,
} from '@/features/interviews/hooks'
import { useOptions } from '@/features/meta/hooks'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { errorMessage } from '@/lib/api-error'

export function InterviewsPage() {
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const canSchedule = can(user, PERMISSIONS.INTERVIEWS_SCHEDULE)
  const canConduct = can(user, PERMISSIONS.INTERVIEWS_CONDUCT)
  const confirm = useConfirm()

  const [params] = useSearchParams()
  const [status, setStatus] = useState(() => params.get('status') ?? 'all')
  const [schedule, setSchedule] = useState({ open: false, mode: 'create', interview: null })
  const [outcome, setOutcome] = useState({ open: false, interview: null })

  const { data, isLoading, isError } = useInterviews({
    page: 1,
    size: 1000,
    status: status === 'all' ? undefined : status,
  })

  const scheduleMut = useScheduleInterview()
  const updateMut = useUpdateInterview()
  const outcomeMut = useRecordOutcome()
  const deleteMut = useDeleteInterview()
  const bulkDeleteMut = useBulkDeleteInterviews()

  const [selected, setSelected] = useState([])
  const gridApi = useRef(null)
  const clearSelection = () => {
    gridApi.current?.deselectAll()
    setSelected([])
  }

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: `Delete ${selected.length} interview${selected.length > 1 ? 's' : ''}?`,
      description: 'This permanently removes the selected interviews.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!ok) return
    bulkDeleteMut.mutate(
      selected.map((i) => i.id),
      {
        onSuccess: (res) => {
          toast.success(`Deleted ${res?.deleted ?? selected.length} interview(s)`)
          clearSelection()
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to delete interviews')),
      },
    )
  }

  const openSchedule = () => setSchedule({ open: true, mode: 'create', interview: null })
  const openReschedule = (interview) => setSchedule({ open: true, mode: 'edit', interview })
  const openOutcome = (interview) => setOutcome({ open: true, interview })

  const handleDelete = async (interview) => {
    const ok = await confirm({
      title: 'Delete interview?',
      description: 'This permanently removes the interview and its calendar sync.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMut.mutate(interview.id, {
      onSuccess: () => toast.success('Interview deleted'),
      onError: (e) => toast.error(errorMessage(e, 'Failed to delete')),
    })
  }

  const handleScheduleSubmit = (payload) => {
    const opts = {
      onSuccess: () => {
        toast.success(schedule.mode === 'edit' ? 'Interview updated' : 'Interview scheduled')
        setSchedule((s) => ({ ...s, open: false }))
      },
      onError: (e) => toast.error(errorMessage(e, 'Failed to save interview')),
    }
    if (schedule.mode === 'edit') {
      updateMut.mutate({ id: schedule.interview.id, payload }, opts)
    } else {
      scheduleMut.mutate(payload, opts)
    }
  }

  const handleOutcomeSubmit = (payload) => {
    outcomeMut.mutate(
      { id: outcome.interview.id, payload },
      {
        onSuccess: () => {
          toast.success('Outcome recorded')
          setOutcome({ open: false, interview: null })
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to record outcome')),
      },
    )
  }

  const columns = useMemo(
    () =>
      getInterviewColumns({
        onEdit: openReschedule,
        onOutcome: openOutcome,
        onDelete: handleDelete,
        canSchedule,
        canConduct,
        options,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canSchedule, canConduct, options],
  )

  const scheduleInitial =
    schedule.mode === 'edit' && schedule.interview
      ? {
          candidate_id: String(schedule.interview.candidate_id),
          hiring_manager_id: schedule.interview.hiring_manager_id
            ? String(schedule.interview.hiring_manager_id)
            : '',
          mode: schedule.interview.mode,
          scheduled_at: toLocalInput(schedule.interview.scheduled_at),
          location_or_link: schedule.interview.location_or_link ?? '',
          priority: schedule.interview.priority ?? 'medium',
          notes: schedule.interview.notes ?? '',
        }
      : undefined

  return (
    <div>
      <PageHeader
        title="Interviews"
        breadcrumb={['Recruitment', 'Interviews']}
        actions={
          canSchedule && (
            <Button onClick={openSchedule} size="sm">
              <Plus className="size-4" /> Schedule interview
            </Button>
          )
        }
      />

      {isError ? (
        <p className="p-6 text-sm text-destructive">
          Couldn't load interviews. Is the backend running?
        </p>
      ) : (
        <>
        {canSchedule && (
          <SelectionBar
            count={selected.length}
            onDelete={handleBulkDelete}
            onClear={clearSelection}
            isDeleting={bulkDeleteMut.isPending}
          />
        )}
        <Table
          rowData={data?.items ?? []}
          columnData={columns}
          isLoading={isLoading}
          searchPlaceholder="Search candidate, manager…"
          selectable={canSchedule}
          onSelectionChanged={setSelected}
          onGridReady={(p) => (gridApi.current = p.api)}
          toolbar={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(options?.interview_statuses ?? []).map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        </>
      )}

      {canSchedule && (
        <InterviewScheduleDialog
          open={schedule.open}
          onOpenChange={(open) => setSchedule((s) => ({ ...s, open }))}
          mode={schedule.mode}
          initialValues={scheduleInitial}
          onSubmit={handleScheduleSubmit}
          isSubmitting={scheduleMut.isPending || updateMut.isPending}
        />
      )}

      {canConduct && (
        <OutcomeDialog
          open={outcome.open}
          onOpenChange={(open) => setOutcome((o) => ({ ...o, open }))}
          interview={outcome.interview}
          onSubmit={handleOutcomeSubmit}
          isSubmitting={outcomeMut.isPending}
        />
      )}
    </div>
  )
}
