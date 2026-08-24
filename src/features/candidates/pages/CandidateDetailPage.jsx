import { FileText, Mail, Pencil, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { LoadingBlock } from '@/components/ui/spinner'
import { PERMISSIONS, can } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { downloadResume } from '@/features/candidates/api'
import { AiScreeningDialog } from '@/features/candidates/components/AiScreeningDialog'
import { CandidateFormDialog } from '@/features/candidates/components/CandidateFormDialog'
import { NotifyDialog } from '@/features/candidates/components/NotifyDialog'
import { stageVariant } from '@/features/candidates/constants'
import { useCandidate, useUpdateCandidate, useUploadResume } from '@/features/candidates/hooks'
import { formatWhen, outcomeVariant, statusVariant } from '@/features/interviews/constants'
import { useInterviews } from '@/features/interviews/hooks'
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

  const updateMut = useUpdateCandidate()
  const uploadMut = useUploadResume()

  const [edit, setEdit] = useState(false)
  const [notify, setNotify] = useState(false)
  const [screen, setScreen] = useState(false)

  if (isLoading) return <LoadingBlock />
  if (isError || !candidate) {
    return (
      <div>
        <PageHeader title="Candidate" breadcrumb={['Recruitment', 'Candidates']} />
        <p className="p-6 text-sm text-destructive">Candidate not found.</p>
      </div>
    )
  }

  const viewResume = async () => {
    try {
      const blob = await downloadResume(candidate.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      toast.error('Could not open the resume')
    }
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
                <Button variant="outline" size="sm" onClick={() => setNotify(true)}>
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
        <div className="space-y-4 lg:col-span-2">
          {/* Profile */}
          <Panel title="Profile">
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

          {/* AI screening */}
          <Panel title="AI screening">
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
        </div>

        <div className="space-y-4">
          {/* Resume */}
          <Panel title="Resume">
            {candidate.resume_url ? (
              <a href={candidate.resume_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <FileText className="size-4" /> View resume (link)
              </a>
            ) : candidate.has_resume_file ? (
              <button onClick={viewResume}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <FileText className="size-4" /> View uploaded resume
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">No resume on file.</p>
            )}
          </Panel>

          {/* Interviews */}
          <Panel title="Interview history">
            {interviews.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No interviews scheduled.</p>
            ) : (
              <ul className="divide-y">
                {interviews.map((iv) => (
                  <li key={iv.id} className="flex items-center gap-3 py-3">
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
          <NotifyDialog open={notify} onOpenChange={setNotify} candidate={candidate} />
          <AiScreeningDialog open={screen} onOpenChange={setScreen} candidate={candidate} />
        </>
      )}
    </div>
  )
}

export default CandidateDetailPage
