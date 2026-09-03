import { Mail, Pencil, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { DetailSkeleton } from '@/components/ui/detail-skeleton'
import { PERMISSIONS, can } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { ResumePreview } from '@/features/candidates/components/ResumePreview'
import { AiScreeningDialog } from '@/features/candidates/components/AiScreeningDialog'
import { CandidateFormDialog } from '@/features/candidates/components/CandidateFormDialog'
import { NotifyDialog } from '@/features/candidates/components/NotifyDialog'
import { stageVariant } from '@/features/candidates/constants'
import { useCandidate, useUpdateCandidate, useUploadResume } from '@/features/candidates/hooks'
import { formatWhen, outcomeVariant, statusVariant } from '@/features/interviews/constants'
import { useInterviews } from '@/features/interviews/hooks'
import { OfferPanel } from '@/features/offers/components/OfferPanel'
import { optionLabel, useOptions } from '@/features/meta/hooks'
import { priorityVariant } from '@/lib/priority'
import { errorMessage } from '@/lib/api-error'

const scoreVariant = (s) => (s >= 80 ? 'success' : s >= 60 ? 'warning' : 'destructive')

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children ?? '—'}</dd>
    </div>
  )
}

function Chips({ items, variant = 'secondary' }) {
  if (!items?.length) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <Badge key={i} variant={variant}>{t}</Badge>
      ))}
    </div>
  )
}

const COMPETENCY_LABEL = {
  technical: 'Technical',
  communication: 'Communication',
  culture_fit: 'Culture fit',
  problem_solving: 'Problem solving',
}
const RECOMMENDATION = {
  strong_yes: { label: 'Strong Yes', variant: 'success' },
  yes: { label: 'Yes', variant: 'success' },
  no: { label: 'No', variant: 'destructive' },
  strong_no: { label: 'Strong No', variant: 'destructive' },
}
const NEXT_STEP = {
  join: { label: 'Selected to join', variant: 'success' },
  next_round: { label: 'Next round', variant: 'info' },
  on_hold: { label: 'On hold', variant: 'warning' },
}
// Banner shown at the top of the interview history, per latest decision.
const DECISION_BANNER = {
  join: { text: 'Candidate advanced to Offer.', label: 'Send offer email', template: 'offer' },
  next_round: { text: 'Candidate moved to the next round.' },
  on_hold: { text: 'Candidate is on hold.' },
  reject: { text: 'Candidate marked Rejected.', label: 'Send rejection email', template: 'rejected' },
}

function InterviewFeedback({ feedback }) {
  const rec = RECOMMENDATION[feedback.recommendation]
  const step = NEXT_STEP[feedback.next_step]
  const ratings = Object.entries(feedback.ratings ?? {}).filter(([, v]) => v)
  return (
    <div className="mt-2 space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {step && <Badge variant={step.variant}>{step.label}</Badge>}
        {rec && <Badge variant={rec.variant}>{rec.label}</Badge>}
      </div>
      {feedback.next_step === 'join' &&
        (feedback.tentative_joining_date || feedback.estimated_ctc != null) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {feedback.tentative_joining_date && (
              <span>
                <span className="text-xs text-muted-foreground">Tentative joining: </span>
                {feedback.tentative_joining_date}
              </span>
            )}
            {feedback.estimated_ctc != null && (
              <span>
                <span className="text-xs text-muted-foreground">Est. CTC: </span>
                {feedback.estimated_ctc.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        )}
      {feedback.next_step_note && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            {feedback.next_step === 'next_round' ? 'Next round' : 'On hold'}
          </div>
          <p className="text-sm">{feedback.next_step_note}</p>
        </div>
      )}
      {ratings.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ratings.map(([k, v]) => (
            <span key={k} className="rounded border bg-card px-2 py-0.5 text-xs">
              {COMPETENCY_LABEL[k] ?? k} · {v}/5
            </span>
          ))}
        </div>
      )}
      {feedback.strengths && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">Strengths</div>
          <p className="text-sm">{feedback.strengths}</p>
        </div>
      )}
      {feedback.concerns && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">Concerns</div>
          <p className="text-sm">{feedback.concerns}</p>
        </div>
      )}
    </div>
  )
}

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

export function CandidateDetailPage() {
  const { id } = useParams()
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const canManage = can(user, PERMISSIONS.CANDIDATES_MANAGE)

  const { data: candidate, isLoading, isError } = useCandidate(id)
  const { data: interviewsPage } = useInterviews({ page: 1, size: 50, candidate_id: Number(id) })
  const interviews = interviewsPage?.items ?? []
  // The most recent decided interview drives the banner. Prefer the structured
  // next-step decision; fall back to the raw outcome for older records.
  const latestDecided = interviews.find(
    (iv) => iv.feedback?.next_step || iv.outcome === 'selected' || iv.outcome === 'rejected',
  )
  const latestStep =
    latestDecided?.feedback?.next_step ??
    (latestDecided?.outcome === 'rejected'
      ? 'reject'
      : latestDecided?.outcome === 'selected'
        ? 'join'
        : null)

  const updateMut = useUpdateCandidate()
  const uploadMut = useUploadResume()

  const [edit, setEdit] = useState(false)
  const [notify, setNotify] = useState({ open: false, templateKey: undefined })
  const [screen, setScreen] = useState(false)

  const openEmail = (templateKey) => setNotify({ open: true, templateKey })

  if (isLoading) return <DetailSkeleton />
  if (isError || !candidate) {
    return (
      <div>
        <PageHeader title="Candidate" breadcrumb={['Recruitment', 'Candidates']} />
        <p className="p-6 text-sm text-destructive">Candidate not found.</p>
      </div>
    )
  }

  const handleSubmit = async (payload, file) => {
    try {
      await updateMut.mutateAsync({ id: candidate.id, payload })
      if (file) await uploadMut.mutateAsync({ id: candidate.id, file })
      toast.success('Candidate updated')
      setEdit(false)
    } catch (e) {
      toast.error(errorMessage(e, 'Failed to save candidate'))
    }
  }

  return (
    <div>
      <PageHeader
        title={candidate.full_name}
        breadcrumb={[
          'Recruitment',
          { label: 'Candidates', to: '/candidates' },
          candidate.full_name,
        ]}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <Button variant="outline" size="sm" onClick={() => setScreen(true)}>
                  <Sparkles className="size-4 text-primary" /> AI screen
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEmail()}>
                  <Mail className="size-4" /> Email
                </Button>
                <Button size="sm" onClick={() => setEdit(true)}>
                  <Pencil className="size-4" /> Edit
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Profile" className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={candidate.full_name} />
              <div>
                <div className="font-medium">{candidate.full_name}</div>
                <div className="text-sm text-muted-foreground">{candidate.email}</div>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge variant={stageVariant(candidate.stage)}>
                  {optionLabel(options?.candidate_stages, candidate.stage)}
                </Badge>
                <Badge variant={priorityVariant(candidate.priority)}>
                  {optionLabel(options?.priorities, candidate.priority)}
                </Badge>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Detail label="Applied for">
                {candidate.job ? (
                  <Link to={`/jobs/${candidate.job_id}`} className="text-primary hover:underline">
                    {candidate.job.title}
                  </Link>
                ) : '—'}
              </Detail>
              <Detail label="Current role">{candidate.current_role}</Detail>
              <Detail label="Experience">
                {candidate.experience_years != null ? `${candidate.experience_years} yrs` : '—'}
              </Detail>
              <Detail label="Phone">{candidate.phone}</Detail>
              <Detail label="Source">{optionLabel(options?.candidate_sources, candidate.source)}</Detail>
              <Detail label="Notice period">
                {candidate.notice_period_days != null ? `${candidate.notice_period_days} days` : '—'}
              </Detail>
              <Detail label="Current CTC">{candidate.current_ctc ?? '—'}</Detail>
              <Detail label="Expected CTC">{candidate.expected_ctc ?? '—'}</Detail>
            </dl>
            <div className="mt-4 space-y-3">
              <Detail label="Skills"><Chips items={candidate.skills ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean) : null} /></Detail>
              {candidate.notes && <Detail label="Notes">{candidate.notes}</Detail>}
            </div>
          </Panel>

        <Panel title="Resume">
          <ResumePreview candidate={candidate} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <Panel title="AI screening" className="lg:col-span-2">
            {candidate.ai_score == null ? (
              <p className="py-4 text-sm text-muted-foreground">
                Not screened yet.{' '}
                {canManage && (
                  <button onClick={() => setScreen(true)} className="text-primary hover:underline">
                    Run AI screening
                  </button>
                )}
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={scoreVariant(candidate.ai_score)}>Score {candidate.ai_score}</Badge>
                  {candidate.ai_scored_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatWhen(candidate.ai_scored_at)}
                    </span>
                  )}
                </div>
                {candidate.ai_summary && <p className="text-sm">{candidate.ai_summary}</p>}
                <Detail label="Matched"><Chips items={candidate.ai_matched} variant="success" /></Detail>
                <Detail label="Missing"><Chips items={candidate.ai_missing} variant="destructive" /></Detail>
              </div>
            )}
          </Panel>

        <div className="space-y-4">
          {/* Offer / decision */}
          <OfferPanel
            candidate={candidate}
            canManage={canManage}
            decision={latestStep}
            onSendLetter={openEmail}
          />

          {/* Interviews */}
          <Panel title="Interview history">
            {canManage && DECISION_BANNER[latestStep] && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-primary/5 px-3 py-2">
                <span className="text-sm">{DECISION_BANNER[latestStep].text}</span>
                {DECISION_BANNER[latestStep].label && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEmail(DECISION_BANNER[latestStep].template)}
                  >
                    <Mail className="size-4" />
                    {DECISION_BANNER[latestStep].label}
                  </Button>
                )}
              </div>
            )}
            {interviews.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No interviews scheduled.</p>
            ) : (
              <ul className="divide-y">
                {interviews.map((iv) => (
                  <li key={iv.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">{formatWhen(iv.scheduled_at)}</div>
                        <div className="text-xs text-muted-foreground">
                          {optionLabel(options?.interview_modes, iv.mode)}
                          {iv.hiring_manager ? ` · ${iv.hiring_manager.full_name}` : ''}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={statusVariant(iv.status)}>
                          {optionLabel(options?.interview_statuses, iv.status)}
                        </Badge>
                        {iv.outcome && (
                          <Badge variant={outcomeVariant(iv.outcome)}>
                            {optionLabel(options?.interview_outcomes, iv.outcome)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {iv.feedback && <InterviewFeedback feedback={iv.feedback} />}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {canManage && (
        <>
          <CandidateFormDialog
            open={edit}
            onOpenChange={setEdit}
            mode="edit"
            initialValues={toFormValues(candidate)}
            onSubmit={handleSubmit}
            isSubmitting={updateMut.isPending || uploadMut.isPending}
          />
          <NotifyDialog
            open={notify.open}
            onOpenChange={(open) => setNotify((n) => ({ ...n, open }))}
            candidate={candidate}
            initialTemplateKey={notify.templateKey}
          />
          <AiScreeningDialog open={screen} onOpenChange={setScreen} candidate={candidate} />
        </>
      )}
    </div>
  )
}

export default CandidateDetailPage
