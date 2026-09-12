import {
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useCurrentUser } from '@/features/auth/hooks'
import { PERMISSIONS, can } from '@/features/auth/acl'
import { ConvertDialog } from '@/features/onboarding/components/ConvertDialog'
import { StartOnboardingDialog } from '@/features/onboarding/components/StartOnboardingDialog'
import {
  ONBOARDING_STATUSES,
  OWNER_LABELS,
  TASK_CATEGORIES,
  countdownLabel,
  daysUntil,
  formatDate,
  labelOf,
  statusVariant,
} from '@/features/onboarding/constants'
import {
  useConvertOnboarding,
  useCreateOnboarding,
  useOnboarding,
  useOnboardingList,
  useSetOnboardingStatus,
  useUpdateTask,
} from '@/features/onboarding/hooks'
import { errorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

const TONE_CLASS = {
  info: 'bg-info/12 text-info',
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
}

function ProgressRing({ value = 0, size = 76, stroke = 8 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">
        {value}%
      </div>
    </div>
  )
}

function StatTile({ icon: Icon, tone, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn('flex size-8 items-center justify-center rounded-lg', TONE_CLASS[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</div>
    </Card>
  )
}

function HireRow({ item, selected, onClick }) {
  const pct = item.progress ?? 0
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full gap-3 border-b px-4 py-3.5 text-left transition-colors hover:bg-muted/60',
        selected && 'bg-primary/5',
      )}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-[3px] bg-primary" />}
      <Avatar name={item.full_name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{item.full_name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {item.job_title || '—'}
              {item.department ? ` · ${item.department}` : ''}
            </div>
          </div>
          <Badge variant={statusVariant(item.status)}>
            {labelOf(ONBOARDING_STATUSES, item.status)}
          </Badge>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDate(item.start_date)}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{item.task_done} of {item.task_total} tasks</span>
          <span className="font-semibold text-foreground tabular-nums">{pct}%</span>
        </div>
      </div>
    </button>
  )
}

function TaskChecklist({ onboarding, canManage, onToggle, toggling }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-6">
      {TASK_CATEGORIES.map((cat) => {
        const tasks = onboarding.tasks.filter((t) => t.category === cat.value)
        if (tasks.length === 0) return null
        const done = tasks.filter((t) => t.status === 'done').length
        const Icon = cat.icon
        return (
          <div key={cat.value}>
            <div className="mb-2 flex items-center gap-2.5">
              <span className={cn('flex size-6 items-center justify-center rounded-md', TONE_CLASS[cat.tone])}>
                <Icon className="size-3.5" />
              </span>
              <span className="text-sm font-semibold">{cat.label}</span>
              <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
                {done} / {tasks.length}
              </span>
            </div>
            <div className="rounded-lg border">
              {tasks.map((task, i) => {
                const isDone = task.status === 'done'
                const overdue =
                  !isDone && task.due_date && new Date(task.due_date) < today
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-start gap-3 px-3 py-2.5',
                      i > 0 && 'border-t',
                    )}
                  >
                    <button
                      type="button"
                      disabled={!canManage || toggling}
                      onClick={() => onToggle(task)}
                      aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                        isDone
                          ? 'border-success bg-success text-white'
                          : 'border-input hover:border-primary',
                        task.status === 'in_progress' && !isDone && 'border-primary border-dashed',
                        (!canManage || toggling) && 'cursor-not-allowed opacity-70',
                      )}
                    >
                      {isDone && <Check className="size-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-sm', isDone && 'text-muted-foreground line-through')}>
                        {task.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {task.owner && (
                          <span className="inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-current opacity-50" />
                            {OWNER_LABELS[task.owner] ?? task.owner}
                          </span>
                        )}
                        {isDone && task.completed_at ? (
                          <span>Done {formatDate(task.completed_at)}</span>
                        ) : task.due_date ? (
                          <Badge variant={overdue ? 'destructive' : 'secondary'} className="px-2 py-0">
                            {overdue ? 'Overdue · ' : 'Due '}
                            {formatDate(task.due_date)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OnboardingDetail({ id, canManage, onConvert }) {
  const { data: onboarding, isLoading, isError, refetch } = useOnboarding(id)
  const setStatusMut = useSetOnboardingStatus()
  const updateTaskMut = useUpdateTask()

  if (isLoading) {
    return (
      <Card className="flex min-h-80 items-center justify-center">
        <Spinner />
      </Card>
    )
  }
  if (isError || !onboarding) {
    return (
      <Card className="p-6">
        <ErrorState description="Couldn't load this onboarding record." onRetry={refetch} />
      </Card>
    )
  }

  const toggleTask = (task) => {
    const next = task.status === 'done' ? 'pending' : 'done'
    updateTaskMut.mutate(
      { id: onboarding.id, taskId: task.id, payload: { status: next } },
      { onError: (e) => toast.error(errorMessage(e, 'Failed to update task')) },
    )
  }

  const changeStatus = (status) => {
    setStatusMut.mutate(
      { id: onboarding.id, status },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (e) => toast.error(errorMessage(e, 'Failed to update status')),
      },
    )
  }

  const countdown = countdownLabel(onboarding.start_date)
  const isConverted = Boolean(onboarding.employee_id)

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 p-5">
        <Avatar name={onboarding.full_name} size="lg" className="size-14 text-base" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight">{onboarding.full_name}</h2>
          <p className="text-sm text-muted-foreground">
            {[onboarding.job_title, onboarding.department, onboarding.location]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(onboarding.start_date)}
            </Badge>
            {countdown && (
              <Badge variant={daysUntil(onboarding.start_date) < 0 ? 'secondary' : 'warning'} className="gap-1.5">
                <Clock className="size-3.5" />
                {countdown}
              </Badge>
            )}
            <Badge variant={statusVariant(onboarding.status)}>
              {labelOf(ONBOARDING_STATUSES, onboarding.status)}
            </Badge>
            {isConverted && (
              <Badge variant="success" className="gap-1.5">
                <UserCheck className="size-3.5" /> Employee created
              </Badge>
            )}
          </div>
        </div>
        <ProgressRing value={onboarding.progress ?? 0} />
      </div>

      {/* Action bar */}
      {canManage && (
        <div className="flex flex-wrap items-center gap-3 border-y bg-muted/40 px-5 py-3">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <Select value={onboarding.status} onValueChange={changeStatus}>
            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ONBOARDING_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button
              size="sm"
              onClick={() => onConvert(onboarding)}
              disabled={isConverted}
            >
              <UserCheck className="size-4" />
              {isConverted ? 'Converted' : 'Convert to employee'}
            </Button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 p-5 xl:grid-cols-[1fr_260px]">
        <TaskChecklist
          onboarding={onboarding}
          canManage={canManage}
          onToggle={toggleTask}
          toggling={updateTaskMut.isPending}
        />

        <div className="space-y-5">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reporting to
            </div>
            {onboarding.manager_name ? (
              <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2.5">
                <Avatar name={onboarding.manager_name} size="sm" />
                <span className="text-sm font-medium">{onboarding.manager_name}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not assigned</p>
            )}
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Onboarding buddy
            </div>
            {onboarding.buddy_name ? (
              <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2.5">
                <Avatar name={onboarding.buddy_name} size="sm" />
                <span className="text-sm font-medium">{onboarding.buddy_name}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not assigned</p>
            )}
          </div>
          {onboarding.notes && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </div>
              <p className="text-sm text-muted-foreground">{onboarding.notes}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export function OnboardingPage() {
  const { data: user } = useCurrentUser()
  const canManage = can(user, PERMISSIONS.ONBOARDING_MANAGE)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [startOpen, setStartOpen] = useState(false)
  const [convertFor, setConvertFor] = useState(null)

  const { data, isLoading, isError, refetch } = useOnboardingList({
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const items = data?.items ?? []

  const createMut = useCreateOnboarding()
  const convertMut = useConvertOnboarding()

  // Keep a valid selection as the list changes.
  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null)
    } else if (!items.some((i) => i.id === selectedId)) {
      setSelectedId(items[0].id)
    }
  }, [items, selectedId])

  const stats = useMemo(() => {
    const active = items.filter((i) => !['completed', 'cancelled'].includes(i.status))
    const joiningThisWeek = items.filter((i) => {
      const d = daysUntil(i.start_date)
      return d !== null && d >= 0 && d <= 7
    })
    return {
      inProgress: active.length,
      joiningThisWeek: joiningThisWeek.length,
      ready: items.filter((i) => i.status === 'ready').length,
      completed: items.filter((i) => i.status === 'completed').length,
    }
  }, [items])

  const handleCreate = (payload) => {
    createMut.mutate(payload, {
      onSuccess: (created) => {
        toast.success('Onboarding started')
        setStartOpen(false)
        if (created?.id) setSelectedId(created.id)
      },
      onError: (e) => toast.error(errorMessage(e, 'Failed to start onboarding')),
    })
  }

  const handleConvert = (payload) => {
    if (!convertFor) return
    convertMut.mutate(
      { id: convertFor?.id, payload },
      {
        onSuccess: () => {
          toast.success('Employee record created')
          setConvertFor(null)
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to convert')),
      },
    )
  }

  return (
    <div>
      <PageHeader
        title="Onboarding"
        breadcrumb={['People', 'Onboarding']}
        actions={
          canManage && (
            <Button size="sm" onClick={() => setStartOpen(true)}>
              <Plus className="size-4" />
              Start onboarding
            </Button>
          )
        }
      />

      {isError ? (
        <ErrorState
          description="We couldn't load onboarding right now. Please try again in a moment."
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex min-h-80 items-center justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 && statusFilter === 'all' && !search ? (
        <Card className="p-6">
          <EmptyState
            icon={Users}
            message="No one is onboarding yet. New hires appear here automatically when an offer is accepted — or start one manually."
            action={
              canManage && (
                <Button onClick={() => setStartOpen(true)}>
                  <Plus className="size-4" /> Start onboarding
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon={Clock} tone="info" label="In progress" value={stats.inProgress} />
            <StatTile icon={CalendarClock} tone="primary" label="Joining this week" value={stats.joiningThisWeek} />
            <StatTile icon={CheckCircle2} tone="warning" label="Ready to convert" value={stats.ready} />
            <StatTile icon={UserCheck} tone="success" label="Completed" value={stats.completed} />
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[360px_1fr]">
            {/* List */}
            <Card className="overflow-hidden">
              <div className="border-b p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search new hires…"
                    className="pl-9"
                  />
                </div>
                <div className="mt-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {ONBOARDING_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {items.length === 0 ? (
                  <EmptyState message="No new hires match your filters." className="py-12" />
                ) : (
                  items.map((item) => (
                    <HireRow
                      key={item.id}
                      item={item}
                      selected={item.id === selectedId}
                      onClick={() => setSelectedId(item.id)}
                    />
                  ))
                )}
              </div>
            </Card>

            {/* Detail */}
            {selectedId ? (
              <OnboardingDetail
                id={selectedId}
                canManage={canManage}
                onConvert={(o) => setConvertFor(o)}
              />
            ) : (
              <Card className="flex min-h-80 items-center justify-center">
                <EmptyState icon={UserCog} message="Select a new hire to see their onboarding checklist." />
              </Card>
            )}
          </div>
        </div>
      )}

      <StartOnboardingDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        onSubmit={handleCreate}
        isSubmitting={createMut.isPending}
      />
      <ConvertDialog
        open={Boolean(convertFor)}
        onOpenChange={(open) => (open ? null : setConvertFor(null))}
        onboarding={convertFor}
        onSubmit={handleConvert}
        isSubmitting={convertMut.isPending}
      />
    </div>
  )
}
