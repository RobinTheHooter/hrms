import { Calendar, CheckCircle2, Link2 } from 'lucide-react'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Spinner } from '@/components/ui/spinner'
import { getGoogleConnectUrl } from '@/features/integrations/api'
import {
  useDisconnectGoogle,
  useGoogleStatus,
} from '@/features/integrations/hooks'

export function IntegrationsPage() {
  const [params, setParams] = useSearchParams()
  const { data: status, isLoading } = useGoogleStatus()
  const disconnect = useDisconnectGoogle()
  const confirm = useConfirm()

  // Toast + clean the URL after returning from Google's consent screen.
  useEffect(() => {
    if (params.get('google') === 'connected') {
      toast.success('Google Calendar connected')
      params.delete('google')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const handleConnect = async () => {
    try {
      const url = await getGoogleConnectUrl()
      window.location.assign(url)
    } catch (e) {
      toast.error(
        e?.response?.data?.detail ?? 'Google Calendar is not configured yet.',
      )
    }
  }

  const handleDisconnect = async () => {
    const ok = await confirm({
      title: 'Disconnect Google Calendar?',
      description:
        'Interview events will no longer sync to your calendar until you reconnect.',
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    })
    if (!ok) return
    disconnect.mutate(undefined, {
      onSuccess: () => toast.success('Disconnected'),
      onError: () => toast.error('Failed to disconnect'),
    })
  }

  const enabled = status?.enabled
  const connected = status?.connected

  return (
    <div>
      <PageHeader title="Integrations" breadcrumb={['Account', 'Integrations']} />

      <Card className="max-w-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Google Calendar</h3>
                {connected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Not connected</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your Google account so scheduled interviews land on your
                calendar and invite the candidate. Your busy times can then be
                shown to recruiters when they book.
              </p>

              {isLoading ? (
                <div className="mt-4"><Spinner /></div>
              ) : !enabled ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Google Calendar isn't configured on the server yet.
                </p>
              ) : connected ? (
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-success" />
                    {status.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnect.isPending}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button className="mt-4 gap-1.5" onClick={handleConnect}>
                  <Link2 className="size-4" /> Connect Google Calendar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
