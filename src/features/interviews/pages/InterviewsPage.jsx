import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
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
  useDeleteInterview,
  useInterviews,
  useRecordOutcome,
  useScheduleInterview,
  useUpdateInterview,
} from '@/features/interviews/hooks'
import { useOptions } from '@/features/meta/hooks'

const errorMessage = (e, fallback) =>
  e?.response?.data?.detail ??
  (e?.response?.status === 403 ? "You don't have permission." : fallback)

export function InterviewsPage() {
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const canSchedule = can(user, PERMISSIONS.INTERVIEWS_SCHEDULE)
  const canConduct = can(user, PERMISSIONS.INTERVIEWS_CONDUCT)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [status, setStatus] = useState('all')
  const [schedule, setSchedule] = useState({ open: false, mode: 'create', interview: null })
  const [outcome, setOutcome] = useState({ open: false, interview: null })

  const { data, isLoading, isError } = useInterviews({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    status: status === 'all' ? undefined : status,
  })

  const scheduleMut = useScheduleInterview()
  const updateMut = useUpdateInterview()
  const outcomeMut = useRecordOutcome()
  const deleteMut = useDeleteInterview()

  const openSchedule = () => setSchedule({ open: true, mode: 'create', interview: null })
  const openReschedule = (interview) => setSchedule({ open: true, mode: 'edit', interview })
  const openOutcome = (interview) => setOutcome({ open: true, interview })

  const handleDelete = (interview) => {
    if (!window.confirm('Delete this interview?')) return
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

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          >
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(options?.interview_statuses ?? []).map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <p className="p-6 text-sm text-destructive">
            Couldn't load interviews. Is the backend running?
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
