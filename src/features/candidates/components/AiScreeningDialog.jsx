import { FileCheck2, Sparkles, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useScoreCandidate,
  useUploadResume,
} from '@/features/candidates/hooks'

const scoreVariant = (s) => (s >= 80 ? 'success' : s >= 60 ? 'warning' : 'destructive')
const errMsg = (e, f) => e?.response?.data?.detail ?? f

export function AiScreeningDialog({ open, onOpenChange, candidate }) {
  const [current, setCurrent] = useState(candidate)
  const upload = useUploadResume()
  const score = useScoreCandidate()

  useEffect(() => {
    if (open) setCurrent(candidate)
  }, [open, candidate])

  if (!current) return null

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    upload.mutate(
      { id: current.id, file },
      {
        onSuccess: (u) => {
          setCurrent(u)
          toast.success('Resume uploaded')
        },
        onError: (err) => toast.error(errMsg(err, 'Failed to read resume')),
      },
    )
  }

  const runScore = () =>
    score.mutate(current.id, {
      onSuccess: (u) => {
        setCurrent(u)
        toast.success('AI screening complete')
      },
      onError: (err) => toast.error(errMsg(err, 'AI screening failed')),
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI resume screening</DialogTitle>
          <DialogDescription>
            {current.full_name}
            {current.job?.title ? ` · ${current.job.title}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1: resume */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              {current.has_resume ? (
                <>
                  <FileCheck2 className="size-4 text-success" /> Resume on file
                </>
              ) : (
                <>
                  <Upload className="size-4 text-muted-foreground" /> Upload a resume
                </>
              )}
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={onFile}
              disabled={upload.isPending}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, DOCX, or TXT. {upload.isPending ? 'Reading…' : 'Text is extracted and stored.'}
            </p>
          </div>

          {/* Step 2: run */}
          <Button
            className="w-full gap-1.5"
            onClick={runScore}
            disabled={!current.has_resume || score.isPending}
          >
            <Sparkles className="size-4" />
            {score.isPending ? 'Screening…' : 'Run AI screening'}
          </Button>

          {/* Step 3: results */}
          {current.ai_score != null && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Match score</span>
                <Badge variant={scoreVariant(current.ai_score)} className="text-sm">
                  {current.ai_score}/100
                </Badge>
              </div>
              {current.ai_summary && (
                <p className="text-sm text-muted-foreground">{current.ai_summary}</p>
              )}
              {current.ai_matched?.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Matched</div>
                  <div className="flex flex-wrap gap-1.5">
                    {current.ai_matched.map((k) => (
                      <span key={k} className="rounded bg-success/12 px-2 py-0.5 text-xs text-success">{k}</span>
                    ))}
                  </div>
                </div>
              )}
              {current.ai_missing?.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Missing</div>
                  <div className="flex flex-wrap gap-1.5">
                    {current.ai_missing.map((k) => (
                      <span key={k} className="rounded bg-destructive/12 px-2 py-0.5 text-xs text-destructive">{k}</span>
                    ))}
                  </div>
                </div>
              )}
              <p className="border-t pt-2 text-[11px] text-muted-foreground">
                AI assist — use as a ranking aid, not an automatic decision.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
