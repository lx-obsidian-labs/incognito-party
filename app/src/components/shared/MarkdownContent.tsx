'use client'

import Link from 'next/link'

export function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(@\w+|#\w+|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return (
    <p className="mt-2 text-inc-text leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const handle = part.slice(1)
          return (
            <Link key={i} href={`/user/${handle}`} className="text-inc-accent hover:underline">{part}</Link>
          )
        }
        if (part.startsWith('#')) {
          const tag = part.slice(1)
          return (
            <Link key={i} href={`/search?q=${encodeURIComponent(tag)}`} className="text-inc-tip hover:underline">{part}</Link>
          )
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="rounded bg-inc-border/50 px-1.5 py-0.5 text-sm font-mono">{part.slice(1, -1)}</code>
        }
        if (part.startsWith('[') && part.includes('](')) {
          const text = part.slice(1, part.indexOf(']'))
          const url = part.slice(part.indexOf('](') + 2, -1)
          return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-inc-accent hover:underline">{text}</a>
        }
        return part
      })}
    </p>
  )
}
