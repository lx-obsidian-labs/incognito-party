'use client'

import { cn } from '@/lib/utils'

interface Props {
  likeCount: number
  superLikeCount: number
  tipCount: number
  liked?: boolean
  superLiked?: boolean
  tipped?: boolean
  superLikeAnimating?: boolean
  onLike: () => void
  onSuperLike: () => void
  onTip: () => void
  onReport: () => void
  onShare?: () => void
  onDelete?: () => void
  onEdit?: () => void
  bookmarked?: boolean
  onBookmark?: () => void
  isOwnPost?: boolean
}

export function InteractionBar({
  likeCount,
  superLikeCount,
  tipCount,
  liked,
  superLiked,
  tipped,
  superLikeAnimating,
  onLike,
  onSuperLike,
  onTip,
  onReport,
  onShare,
  onDelete,
  onEdit,
  bookmarked,
  onBookmark,
  isOwnPost,
}: Props) {
  return (
    <div className="mt-3 flex items-center gap-4">
      <button
        onClick={onLike}
        aria-label={`Like${likeCount > 0 ? ` (${likeCount})` : ''}`}
        className={cn(
          'flex items-center gap-1 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-1',
          liked ? 'text-inc-accent' : 'text-inc-muted hover:text-inc-accent',
        )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('h-4 w-4', liked && 'fill-inc-accent')}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>
      <button
        onClick={onSuperLike}
        aria-label={`Super-like${superLikeCount > 0 ? ` (${superLikeCount})` : ''}`}
        className={cn(
          'flex items-center gap-1 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-inc-tip focus-visible:outline-none rounded-lg px-1',
          superLiked ? 'text-inc-tip' : 'text-inc-muted hover:text-inc-tip',
          superLikeAnimating && 'animate-super-burst',
        )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={superLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('h-4 w-4', superLiked && 'fill-inc-tip')}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        {superLikeCount > 0 && <span>{superLikeCount}</span>}
      </button>
      <button
        onClick={onTip}
        aria-label={`Tip${tipCount > 0 ? ` (${tipCount})` : ''}`}
        className={cn(
          'flex items-center gap-1 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none rounded-lg px-1',
          tipped ? 'text-yellow-400' : 'text-inc-muted hover:text-yellow-400',
        )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={tipped ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('h-4 w-4', tipped && 'fill-yellow-400')}><ellipse cx="12" cy="12" rx="10" ry="6"/><path d="M22 12v4c0 2.21-4.48 4-10 4S2 18.21 2 16v-4"/><path d="M22 8v4c0 2.21-4.48 4-10 4S2 14.21 2 12V8"/></svg>
        {tipCount > 0 && <span>{tipCount}</span>}
      </button>
      {onShare && (
        <button
          onClick={onShare}
          aria-label="Share post link"
          className="flex items-center gap-1 text-inc-muted hover:text-inc-accent transition-colors text-sm focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-1"
          title="Share"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
      )}
      {onBookmark && (
        <button
          onClick={onBookmark}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
          className={cn(
            'flex items-center gap-1 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-1',
            bookmarked ? 'text-inc-accent' : 'text-inc-muted hover:text-inc-accent',
          )}
          title={bookmarked ? 'Saved' : 'Save'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}
      {isOwnPost && onEdit && (
        <button
          onClick={onEdit}
          aria-label="Edit post"
          className="flex items-center gap-1 text-inc-muted hover:text-inc-accent transition-colors text-sm focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-1"
          title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </button>
      )}
      {isOwnPost && onDelete && (
        <button
          onClick={onDelete}
          aria-label="Delete post"
          className="flex items-center gap-1 text-inc-muted hover:text-red-400 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded-lg px-1"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      )}
      <button
        onClick={onReport}
        aria-label="Report post"
        className="ml-auto flex items-center gap-1 text-inc-muted hover:text-red-400 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded-lg px-1"
        title="Report"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>
      </button>
    </div>
  )
}
