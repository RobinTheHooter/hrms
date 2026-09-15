import { Copy, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInterviewQuestions } from '@/features/ai/hooks'
import { errorMessage } from '@/lib/api-error'

function QuestionList({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <ol className="space-y-2">
        {items.map((q, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="font-semibold text-primary tabular-nums">{i + 1}.</span>
            <span>{q}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function InterviewQuestionsPanel() {
  const gen = useInterviewQuestions()
  const [title, setTitle] = useState('')
  const [skills, setSkills] = useState('')
  const [seniority, setSeniority] = useState('')
  const [focus, setFocus] = useState('')
  const [result, setResult] = useState(null)
  const hasResult = Boolean(result)

  const onGenerate = () => {
    if (!title.trim()) {
      toast.error('Enter a role first')
      return
    }
    gen.mutate(
      {
        title: title.trim(),
        skills: skills.trim() || undefined,
        seniority: seniority.trim() || undefined,
        focus: focus.trim() || undefined,
      },
      {
        onSuccess: (res) => setResult(res),
        onError: (e) => toast.error(errorMessage(e, "Couldn't generate questions. Please try again.")),
      },
    )
  }

  const copyAll = async () => {
    if (!result) return
    const text = [
      'Technical:',
      ...(result?.technical ?? []).map((q, i) => `${i + 1}. ${q}`),
      '',
      'Behavioral:',
      ...(result?.behavioral ?? []).map((q, i) => `${i + 1}. ${q}`),
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Questions copied')
    } catch {
      toast.error('Copy failed — please copy manually.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="mb-1">Role</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
        </div>
        <div>
          <Label className="mb-1">Seniority (optional)</Label>
          <Input value={seniority} onChange={(e) => setSeniority(e.target.value)} placeholder="e.g. Senior" />
        </div>
        <div>
          <Label className="mb-1">Focus area (optional)</Label>
          <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. System design" />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1">Key skills (optional)</Label>
          <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Python, FastAPI, PostgreSQL" />
        </div>
      </div>

      <Button onClick={onGenerate} disabled={gen.isPending}>
        <Sparkles className="size-4" />
        {gen.isPending ? 'Generating…' : hasResult ? 'Regenerate' : 'Generate questions'}
      </Button>

      {hasResult && (
        <div className="space-y-5 border-t pt-4">
          <QuestionList title="Technical questions" items={result.technical} />
          <QuestionList title="Behavioral questions" items={result.behavioral} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={copyAll}>
              <Copy className="size-4" /> Copy all
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
