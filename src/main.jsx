import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { queryClient } from '@/app/queryClient'
import { router } from '@/app/router'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ConfirmProvider>
    </QueryClientProvider>
  </StrictMode>,
)
