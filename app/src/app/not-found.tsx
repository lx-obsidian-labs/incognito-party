import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-inc-accent/10 flex items-center justify-center text-3xl">
        🔍
      </div>
      <h2 className="text-lg font-bold text-inc-text">Page not found</h2>
      <p className="text-sm text-inc-muted max-w-sm">
        This page doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/feed"
        className="px-6 py-2 rounded-full bg-inc-accent text-black font-semibold hover:opacity-90 transition-opacity"
      >
        Go to feed
      </Link>
    </div>
  )
}
