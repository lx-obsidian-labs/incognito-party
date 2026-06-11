'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#1a1a3e',
          color: '#e8e8f0',
          border: '1px solid #2a2a5e',
          borderRadius: '12px',
        },
      }}
    />
  )
}
