import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingBlock } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useEmailTemplates,
  useNotifyCandidate,
} from '@/features/candidates/hooks'
import { errorMessage } from '@/lib/api-error'

/**
 * `initialTemplateKey` preselects a template matching the context that opened
 * the dialog (e.g. 'offer' from the "Send offer email" action).
 */
export function NotifyDialog({ open, onOpenChange, candidate, initialTemplateKey }) {
  const { data, isLoading } = useEmailTemplates(candidate?.id, open)
  const templates = data?.templates ?? []
  const enabled = data?.enabled

  if (!candidate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email candidate</DialogTitle>
          <DialogDescription>
            {candidate.full_name}
            {data?.candidate_email ? ` · ${data.candidate_email}` : ''}
          </DialogDescription>
        </DialogHeader>

        {open &&
          (isLoading ? (
            <LoadingBlock className="min-h-[240px] py-0" />
          ) : !enabled ? (
            <p className="text-sm text-muted-foreground">
              Email isn't configured on the server yet, so messages can't be sent.
            </p>
          ) : (
            // Mounted only once templates are loaded, keyed by the requested
            // template — so its state seeds from the right template, no effect.
            <NotifyForm
              key={initialTemplateKey ?? 'default'}
              templates={templates}
              initialTemplateKey={initialTemplateKey}
              candidateId={candidate.id}
              candidateEmail={data?.candidate_email}
              onDone={() => onOpenChange(false)}
            />
          ))}
      </DialogContent>
    </Dialog>
  )
}

function NotifyForm({ templates, initialTemplateKey, candidateId, candidateEmail, onDone }) {
  const notify = useNotifyCandidate()
  const initial =
    templates.find((t) => t.key === initialTemplateKey) ?? templates[0] ?? null

  const [key, setKey] = useState(initial?.key ?? '')
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [body, setBody] = useState(initial?.body ?? '')

  const pick = (k) => {
    setKey(k)
    const t = templates.find((x) => x.key === k)
    if (t) {
      setSubject(t.subject)
      setBody(t.body)
    }
  }

  const send = () => {
    notify.mutate(
      { id: candidateId, payload: { subject, body } },
      {
        onSuccess: () => {
          toast.success(`Email sent to ${candidateEmail ?? 'candidate'}`)
          onDone()
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to send email')),
      },
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label className="mb-1">Template</Label>
          <Select value={key} onValueChange={pick}>
            <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
            <SelectContent>
              {templates.length === 0 ? (
                <SelectEmpty>No templates found</SelectEmpty>
              ) : (
                templates.map((t) => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick a starting point, then edit freely before sending.
          </p>
        </div>

        <div>
          <Label className="mb-1">Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div>
          <Label className="mb-1">Message</Label>
          <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button onClick={send} disabled={notify.isPending || !subject || !body}>
          {notify.isPending ? 'Sending…' : 'Send email'}
        </Button>
      </DialogFooter>
    </>
  )
}
