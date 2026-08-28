import { CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useBulkUploadCandidates } from '@/features/candidates/hooks'
import { useJobs } from '@/features/jobs/hooks'

export function BulkUploadDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk add candidates</DialogTitle>
          <DialogDescription>
            Upload multiple resumes at once. Each becomes a candidate on the
            selected job and is screened automatically. Name and email are
            auto-detected — review and fix them afterwards.
          </DialogDescription>
        </DialogHeader>
        {open && <BulkForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function BulkForm({ onDone }) {
  const { data: jobsPage } = useJobs({ page: 1, size: 1000 })
  const jobOptions = (jobsPage?.items ?? []).map((j) => ({
    value: String(j.id),
    label: j.department ? `${j.title} · ${j.department}` : j.title,
  }))

  const [jobId, setJobId] = useState('')
  const [files, setFiles] = useState([])
  const [result, setResult] = useState(null)
  const mut = useBulkUploadCandidates()

  const submit = () => {
    if (!jobId) return toast.error('Select a job first')
    if (files.length === 0) return toast.error('Choose at least one resume')
    mut.mutate(
      { jobId, files },
      {
        onSuccess: (data) => {
          setResult(data)
          toast.success(`${data.created} of ${data.total} candidates added`)
        },
        onError: () => toast.error('Bulk upload failed'),
      },
    )
  }

  if (result) {
    return (
      <>
        <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
          {result.results.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              {r.status === 'created' ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : (
                <XCircle className="size-4 shrink-0 text-destructive" />
              )}
              <span className="truncate">
                {r.filename}
                {r.status === 'created'
                  ? ` → ${r.name} (${r.email})`
                  : ` — ${r.error}`}
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={onDone}>Done</Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Job</Label>
        <Combobox
          value={jobId}
          onValueChange={setJobId}
          options={jobOptions}
          placeholder="Select a job"
          searchPlaceholder="Search jobs…"
          emptyText="No jobs found"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Resumes (PDF, DOCX, TXT)</Label>
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
        />
        {files.length > 0 && (
          <p className="text-xs text-muted-foreground">{files.length} file(s) selected</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={mut.isPending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={mut.isPending}>
          {mut.isPending ? 'Uploading…' : 'Upload & screen'}
        </Button>
      </DialogFooter>
    </div>
  )
}
