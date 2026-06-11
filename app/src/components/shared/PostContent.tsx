'use client'

import Link from 'next/link'

export function PostContent({ content }: { content: string }) {
  const parts = content.split(/(@\w+|#\w+)/g)
  return (
    <p className="mt-2 text-inc-text leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const handle = part.slice(1)
          return (
            <Link
              key={i}
              href={`/user/${handle}`}
              className="text-inc-accent hover:underline"
            >
              {part}
            </Link>
          )
        }
        if (part.startsWith('#')) {
          const tag = part.slice(1)
          return (
            <Link
              key={i}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="text-inc-tip hover:underline"
            >
              {part}
            </Link>
          )
        }
        return part
      })}
    </p>
  )
}
