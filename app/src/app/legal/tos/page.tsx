'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TosPage() {
  return (
    <div className="px-4 py-6 space-y-4 text-sm leading-relaxed">
      <Link href="/settings" className="flex items-center gap-1 text-inc-muted hover:text-inc-text transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold text-inc-text">Terms of Service</h1>
      <p className="text-inc-muted">
        These are placeholder terms for the MVP. Full terms will be drafted
        with legal counsel before public launch.
      </p>
      <div className="text-inc-muted space-y-3">
        <h2 className="font-semibold text-inc-text">1. Acceptance</h2>
        <p>By using Incognito Party, you accept these terms.</p>
        <h2 className="font-semibold text-inc-text">2. Anonymity</h2>
        <p>
          Incognito Party does not collect personal information. Your identity
          is anonymous. We cannot recover accounts or messages.
        </p>
        <h2 className="font-semibold text-inc-text">3. Prohibited Content</h2>
        <p>
          You may not post content that is harassing, hateful, or otherwise
          violates applicable laws. We reserve the right to remove content
          and ban users.
        </p>
        <h2 className="font-semibold text-inc-text">4. No Guarantee</h2>
        <p>
          This is an MVP. Features may change, break, or disappear. Use at
          your own discretion.
        </p>
      </div>
    </div>
  )
}
