import { CalendarClock, MessageSquarePlus, Pencil, Video } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  COMPETENCIES,
  RECOMMENDATIONS,
} from '@/features/interviews/components/scorecard'
import {
  formatWhen,
  outcomeVariant,
  statusVariant,
} from '@/features/interviews/constants'
import { optionLabel } from '@/features/meta/hooks'

function InfoRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  )
}

function Scorecard({ feedback }) {
  const rec = RECOMMENDATIONS.find((r) => r.value === feedback.recommendation)
  const ratings = feedback.ratings ?? {}
  return (
    <div className="space-y-3">
      {rec && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Recommendation</span>
          <Badge variant={rec.positive ? 'success' : 'destructive'}>{rec.label}</Badge>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {COMPETENCIES.map((c) => {
          const v = ratings[c.key]
          return (
            <div key={c.key}>
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-medium tabular-nums">{v ? `${v}/5` : '—'}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${((v ?? 0) / 5) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {feedback.strengths && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">Strengths</div>
          <p className="text-sm whitespace-pre-wrap">{feedback.strengths}</p>
        </div>
      )}
      {feedback.concerns && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">Concerns</div>
          <p className="text-sm whitespace-pre-wrap">{feedback.concerns}</p>
        </div>
      )}
    </div>
  )
}

export function InterviewDetailsDialog({
  open,
  onOpenChange,
  interview,
  options,
  canConduct = false,
  canSchedule = false,
  onReschedule,
  onRecordOutcome,
  onAddFeedback,
}) {
  if (!interview) return null

  const link = interview.meeting_link || interview.location_or_link
  const isUrl = typeof link === 'string' && /^https?:\/\//i.test(link)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview details</DialogTitle>
          <DialogDescription>
            {interview.candidate ? (
              <Link
                to={`/candidates/${interview.candidate.id}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {interview.candidate.full_name}
              </Link>
            ) : (
              '—'
            )}
            {interview.candidate?.job?.title ? ` · ${interview.candidate.job.title}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Result */}
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(interview.status)}>
              {optionLabel(options?.interview_statuses, interview.status)}
            </Badge>
            <Badge variant={outcomeVariant(interview.outcome)}>
              {optionLabel(options?.interview_outcomes, interview.outcome)}
            </Badge>
          </div>

          {/* Meeting */}
          <div className="rounded-lg border p-3">
            <InfoRow label="When">{formatWhen(interview.scheduled_at)}</InfoRow>
            <InfoRow label="Mode">
              {optionLabel(options?.interview_modes, interview.mode)}
            </InfoRow>
            <InfoRow label="Hiring manager">
              {interview.hiring_manager?.full_name ?? 'Unassigned'}
            </InfoRow>
            {link && (
              <InfoRow label={isUrl ? 'Link' : 'Location'}>
                {isUrl ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Video className="size-4" /> Join
                  </a>
                ) : (
                  link
                )}
              </InfoRow>
            )}
          </div>

          {/* Notes */}
          {interview.notes && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Notes</div>
              <p className="text-sm whitespace-pre-wrap">{interview.notes}</p>
            </div>
          )}

          {/* Scorecard */}
          <div>
            <div className="mb-2 text-sm font-semibold">Scorecard</div>
            {interview.feedback ? (
              <Scorecard feedback={interview.feedback} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No scorecard recorded for this interview yet.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canSchedule && (
            <Button variant="outline" onClick={() => onReschedule?.(interview)}>
              <Pencil className="size-4" /> Reschedule
            </Button>
          )}
          {canConduct && (
            <Button variant="outline" onClick={() => onAddFeedback?.(interview)}>
              <MessageSquarePlus className="size-4" />
              {interview.feedback ? 'Edit feedback' : 'Add feedback'}
            </Button>
          )}
          {canConduct && (
            <Button onClick={() => onRecordOutcome?.(interview)}>
              <CalendarClock className="size-4" /> Record outcome
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InterviewDetailsDialog
