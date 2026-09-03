import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useGenerateJobDescription } from '@/features/jobs/hooks'
import { useOptions } from '@/features/meta/hooks'
import { errorMessage } from '@/lib/api-error'

export function AiCenterDialog({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { data: options } = useOptions()
  const employmentTypes = options?.employment_types ?? []
  const generate = useGenerateJobDescription()

  const [title, setTitle] = useState('')
  const [skills, setSkills] = useState('')
  const [seniority, setSeniority] = useState('')
  const [employmentType, setEmploymentType] = useState('')

  const [description, setDescription] = useState('')
  const [skillsResult, setSkillsResult] = useState('')
  const hasResult = description.length > 0

  const onGenerate = () => {
    if (!title.trim()) {
      toast.error('Enter a job title first')
      return
    }
    generate.mutate(
      {
        title: title.trim(),
        skills: skills.trim() || undefined,
        seniority: seniority.trim() || undefined,
        employment_type: employmentType || undefined,
      },
      {
        onSuccess: (res) => {
          setDescription(res.description ?? '')
          setSkillsResult((res.required_skills ?? []).join(', '))
        },
        onError: (e) =>
          toast.error(errorMessage(e, "Couldn't generate a description. Please try again.")),
      },
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(description)
      toast.success('Description copied')
    } catch {
      toast.error('Copy failed — please select and copy manually.')
    }
  }

  // Hand off to the Jobs page, which opens its create dialog prefilled.
  const createJob = () => {
    navigate('/jobs', {
      state: {
        aiJob: {
          title: title.trim(),
          description,
          required_skills: skillsResult,
          employment_type: employmentType || undefined,
        },
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            AI Center · Job description generator
          </DialogTitle>
          <DialogDescription>
            Draft a job description from a title and a few hints, then send it
            straight into a new job.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1">Job title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
              />
            </div>
            <div>
              <Label className="mb-1">Seniority (optional)</Label>
              <Input
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                placeholder="e.g. Senior"
              />
            </div>
            <div>
              <Label className="mb-1">Employment type (optional)</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1">Key skills / hints (optional)</Label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Python, FastAPI, PostgreSQL, AWS"
              />
            </div>
          </div>

          <Button onClick={onGenerate} disabled={generate.isPending}>
            <Sparkles className="size-4" />
            {generate.isPending
              ? 'Generating…'
              : hasResult
                ? 'Regenerate'
                : 'Generate description'}
          </Button>

          {hasResult && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label className="mb-1">Description</Label>
                <Textarea
                  rows={12}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1">Suggested skills (comma separated)</Label>
                <Input
                  value={skillsResult}
                  onChange={(e) => setSkillsResult(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hasResult && (
            <Button variant="outline" onClick={copy}>
              Copy
            </Button>
          )}
          {hasResult && <Button onClick={createJob}>Create job with this</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AiCenterDialog
