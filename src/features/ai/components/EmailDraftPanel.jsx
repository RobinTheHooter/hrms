import { Copy, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useEmailDraft } from '@/features/ai/hooks'
import { errorMessage } from '@/lib/api-error'

const KINDS = [
  { value: 'outreach', label: 'Outreach / sourcing' },
  { value: 'rejection', label: 'Rejection (respectful)' },
  { value: 'offer_nudge', label: 'Offer nudge / follow-up' },
  { value: 'interview_invite', label: 'Interview invitation' },
  { value: 'custom', label: 'Custom' },
]
const TONES = [
  { value: 'friendly and professional', label: 'Friendly & professional' },
  { value: 'warm', label: 'Warm' },
  { value: 'formal', label: 'Formal' },
  { value: 'concise', label: 'Concise' },
]

export function EmailDraftPanel() {
  const gen = useEmailDraft()
  const [kind, setKind] = useState('outreach')
  const [tone, setTone] = useState('friendly and professional')
  const [candidateName, setCandidateName] = useState('')
  const [role, setRole] = useState('')
  const [notes, setNotes] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const hasResult = body.length > 0

  const onGenerate = () => {
    gen.mutate(
      {
        kind,
        tone,
        candidate_name: candidateName.trim() || undefined,
        role: role.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setSubject(res.subject ?? '')
          setBody(res.body ?? '')
        },
        onError: (e) => toast.error(errorMessage(e, "Couldn't draft the email. Please try again.")),
      },
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
      toast.success('Email copied')
    } catch {
      toast.error('Copy failed — please copy manually.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1">Email type</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1">Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TONES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1">Candidate name (optional)</Label>
          <Input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="e.g. Ananya" />
        </div>
        <div>
          <Label className="mb-1">Role (optional)</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Video Editor" />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1">Context / notes (optional)</Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to include — e.g. why they're a fit, next steps, deadline…"
          />
        </div>
      </div>

      <Button onClick={onGenerate} disabled={gen.isPending}>
        <Sparkles className="size-4" />
        {gen.isPending ? 'Drafting…' : hasResult ? 'Redraft' : 'Draft email'}
      </Button>

      {hasResult && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label className="mb-1">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1">Body</Label>
            <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={copy}>
              <Copy className="size-4" /> Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
