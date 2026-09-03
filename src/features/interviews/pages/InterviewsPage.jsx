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
import { getInterviewColumns } from '@/features/interviews/columns'
import { toLocalInput } from '@/features/interviews/constants'
import { FeedbackDialog } from '@/features/interviews/components/FeedbackDialog'
import { InterviewDetailsDialog } from '@/features/interviews/components/InterviewDetailsDialog'
import { InterviewScheduleDialog } from '@/features/interviews/components/InterviewScheduleDialog'
import { OutcomeDialog } from '@/features/interviews/components/OutcomeDialog'
import {
  useBulkDeleteInterviews,
  useDeleteInterview,
  useInterviews,
  useRecordOutcome,
  useSaveFeedback,
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
  const [schedule, setSchedule] = useState({ open: false, mode: 'create', interview: null })
  const [outcome, setOutcome] = useState({ open: false, interview: null })
  const [feedback, setFeedback] = useState({ open: false, interview: null })
  const [details, setDetails] = useState({ open: false, interview: null })

  // Status filter comes from the URL (e.g. dashboard drill-down); no dropdown.
  const status = params.get('status') ?? undefined

  const { data, isLoading, isError, refetch } = useInterviews({ page: 1, size: 1000, status })

  const scheduleMut = useScheduleInterview()
  const updateMut = useUpdateInterview()
  const outcomeMut = useRecordOutcome()
  const feedbackMut = useSaveFeedback()
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
  const openFeedback = (interview) => setFeedback({ open: true, interview })
  const openDetails = (interview) => setDetails({ open: true, interview })

  // From the details dialog: close it, then open the chosen action dialog.
  const fromDetails = (fn) => (interview) => {
    setDetails({ open: false, interview: null })
    fn(interview)
  }

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

  const handleFeedbackSubmit = (payload) => {
    feedbackMut.mutate(
      { id: feedback.interview.id, payload },
      {
        onSuccess: () => {
          toast.success('Feedback saved')
          setFeedback({ open: false, interview: null })
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to save feedback')),
      },
    )
  }

  const columns = useMemo(
    () =>
      getInterviewColumns({
        onEdit: openReschedule,
        onOutcome: openOutcome,
        onFeedback: openFeedback,
        onDelete: handleDelete,
        onStatusClick: openDetails,
        canSchedule,
        canConduct,
        options,
      }),
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
        <ErrorState
          description="We couldn't load your interviews right now. Please try again in a moment."
          onRetry={refetch}
        />
      ) : (
        <Table
          rowData={data?.items ?? []}
          columnData={columns}
          isLoading={isLoading}
          searchPlaceholder="Search candidate, manager…"
          selectable={canSchedule}
          onSelectionChanged={setSelected}
          onGridReady={(p) => (gridApi.current = p.api)}
          selection={{
            count: selected.length,
            onDelete: handleBulkDelete,
            onClear: clearSelection,
            isDeleting: bulkDeleteMut.isPending,
          }}
        />
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

      {canConduct && (
        <FeedbackDialog
          open={feedback.open}
          onOpenChange={(open) => setFeedback((f) => ({ ...f, open }))}
          interview={feedback.interview}
          onSubmit={handleFeedbackSubmit}
          isSubmitting={feedbackMut.isPending}
        />
      )}

      <InterviewDetailsDialog
        open={details.open}
        onOpenChange={(open) => setDetails((d) => ({ ...d, open }))}
        interview={details.interview}
        options={options}
        canConduct={canConduct}
        canSchedule={canSchedule}
        onReschedule={fromDetails(openReschedule)}
        onRecordOutcome={fromDetails(openOutcome)}
        onAddFeedback={fromDetails(openFeedback)}
      />
    </div>
  )
}
