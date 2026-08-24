import { Pencil } from 'lucide-react'
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
import { useCandidates } from '@/features/candidates/hooks'
import { stageVariant } from '@/features/candidates/constants'
import { jobStatusVariant } from '@/features/jobs/constants'
import { useJob, useUpdateJob } from '@/features/jobs/hooks'
import { JobFormDialog } from '@/features/jobs/components/JobFormDialog'
import { optionLabel, useOptions } from '@/features/meta/hooks'
import { priorityVariant } from '@/lib/priority'
import { errorMessage } from '@/lib/api-error'

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children ?? '—'}</dd>
    </div>
  )
}

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

export function JobDetailPage() {
  const { id } = useParams()
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const canManage = can(user, PERMISSIONS.JOBS_MANAGE)

  const { data: job, isLoading, isError } = useJob(id)
  const { data: candPage } = useCandidates({ page: 1, size: 100, jobId: Number(id) })
  const candidates = candPage?.items ?? []

  const updateMut = useUpdateJob()
  const [edit, setEdit] = useState(false)

  if (isLoading) return <LoadingBlock />
  if (isError || !job) {
    return (
      <div>
        <PageHeader title="Job" breadcrumb={['Recruitment', 'Jobs']} />
        <p className="p-6 text-sm text-destructive">Job not found.</p>
      </div>
    )
  }

  const handleSubmit = (payload) => {
    updateMut.mutate(
      { id: job.id, payload },
      {
        onSuccess: () => {
          toast.success('Job updated')
          setEdit(false)
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to update job')),
      },
    )
  }

  return (
    <div>
      <PageHeader
        title={job.title}
        breadcrumb={[
          'Recruitment',
          { label: 'Jobs', to: '/jobs' },
          job.title,
        ]}
        actions={
          canManage && (
            <Button size="sm" onClick={() => setEdit(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Role details">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant={jobStatusVariant(job.status)}>
                {optionLabel(options?.job_statuses, job.status)}
              </Badge>
              <Badge variant={priorityVariant(job.priority)}>
                {optionLabel(options?.priorities, job.priority)}
              </Badge>
              <Badge variant="secondary">
                {optionLabel(options?.employment_types, job.employment_type)}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Detail label="Department">{job.department}</Detail>
              <Detail label="Location">{job.location}</Detail>
              <Detail label="Openings">{job.positions}</Detail>
              <Detail label="Consultant">{job.assigned_consultant?.full_name}</Detail>
            </dl>
            {job.description && (
              <div className="mt-4">
                <Detail label="Description">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </Detail>
              </div>
            )}
            {job.required_skills && (
              <div className="mt-4">
                <Detail label="Required skills">
                  <p className="whitespace-pre-wrap">{job.required_skills}</p>
                </Detail>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title={`Candidates (${candidates.length})`}
          >
            {candidates.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No candidates yet.</p>
            ) : (
              <>
                <ul className="divide-y">
                  {candidates.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/candidates/${c.id}`}
                        className="flex items-center gap-3 py-2.5 hover:bg-muted/40"
                      >
                        <Avatar name={c.full_name} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {c.full_name}
                        </span>
                        <Badge variant={stageVariant(c.stage)}>
                          {optionLabel(options?.candidate_stages, c.stage)}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/candidates?job=${job.id}`}
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  View all candidates
                </Link>
              </>
            )}
          </Panel>
        </div>
      </div>

      {canManage && (
        <JobFormDialog
          open={edit}
          onOpenChange={setEdit}
          mode="edit"
          initialValues={toFormValues(job)}
          onSubmit={handleSubmit}
          isSubmitting={updateMut.isPending}
        />
      )}
    </div>
  )
}

export default JobDetailPage
