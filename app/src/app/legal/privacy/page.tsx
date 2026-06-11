'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="px-4 py-6 space-y-4 text-sm leading-relaxed">
      <Link href="/settings" className="flex items-center gap-1 text-inc-muted hover:text-inc-text transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold text-inc-text">Privacy Policy</h1>
      <p className="text-inc-muted">
        These are placeholder privacy terms for the MVP.
      </p>
      <div className="text-inc-muted space-y-3">
        <h2 className="font-semibold text-inc-text">What We Collect</h2>
        <p>We collect no personal information. No email, no phone number, no name.</p>
        <h2 className="font-semibold text-inc-text">What We Store</h2>
        <p>
          We store your anonymous handle, your posts, interactions, and messages.
          This data is tied to a random session ID, not to your identity.
        </p>
        <h2 className="font-semibold text-inc-text">Data Deletion</h2>
        <p>
          Since we cannot identify you, we cannot delete specific accounts on
          request. Clearing your browser data effectively starts a new identity.
          Old data remains in our systems without personal identifiers.
        </p>
        <h2 className="font-semibold text-inc-text">Cookies</h2>
        <p>
          We use Supabase session cookies for authentication only. No tracking
          cookies are used.
        </p>
      </div>
    </div>
  )
}
