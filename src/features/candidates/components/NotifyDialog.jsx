import { useEffect, useState } from 'react'
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

export function NotifyDialog({ open, onOpenChange, candidate }) {
  const { data, isLoading } = useEmailTemplates(candidate?.id, open)
  const templates = data?.templates ?? []
  const enabled = data?.enabled
  const notify = useNotifyCandidate()

  const [key, setKey] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  // Prefill with the first template once they load.
  useEffect(() => {
    if (open && templates.length) {
      const first = templates[0]
      setKey(first.key)
      setSubject(first.subject)
      setBody(first.body)
    }
  }, [open, data]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (k) => {
    const t = templates.find((x) => x.key === k)
    setKey(k)
    if (t) {
      setSubject(t.subject)
      setBody(t.body)
    }
  }

  // Always feed the Select a value that matches an existing item.
  const selectedKey = key || templates[0]?.key || ''

  const send = () => {
    if (!candidate) return
    notify.mutate(
      { id: candidate.id, payload: { subject, body } },
      {
        onSuccess: () => {
          toast.success(`Email sent to ${data?.candidate_email ?? 'candidate'}`)
          onOpenChange(false)
        },
        onError: (e) =>
          toast.error(e?.response?.data?.detail ?? 'Failed to send email'),
      },
    )
  }

  if (!candidate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notify candidate</DialogTitle>
          <DialogDescription>
            {candidate?.full_name}
            {data?.candidate_email ? ` · ${data.candidate_email}` : ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !enabled ? (
          <p className="text-sm text-muted-foreground">
            Email isn't configured on the server yet, so messages can't be sent.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="mb-1">Template</Label>
              <Select value={selectedKey} onValueChange={pick}>
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
              <Textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={send}
            disabled={!enabled || notify.isPending || !subject || !body}
          >
            {notify.isPending ? 'Sending…' : 'Send email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
