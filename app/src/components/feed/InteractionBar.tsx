'use client'

import { cn } from '@/lib/utils'
import { Heart, Zap, Share2, Bookmark, Edit3, Trash2, Flag } from 'lucide-react'
import { Tooltip } from '@/components/shared/Tooltip'

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
    <div className="mt-3 flex items-center gap-3">
      <Tooltip content={liked ? 'Unlike' : 'Like'}>
        <button
          onClick={onLike}
          aria-label={`Like${likeCount > 0 ? ` (${likeCount})` : ''}`}
          className={cn(
            'flex items-center gap-1.5 transition-all text-sm focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-2 py-1',
            liked ? 'text-inc-accent' : 'text-inc-muted hover:text-inc-accent hover:bg-inc-accent/5',
          )}
        >
          <Heart className={cn('h-4 w-4', liked && 'fill-inc-accent')} strokeWidth={liked ? 2.5 : 1.5} />
          {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
        </button>
      </Tooltip>
      <Tooltip content={superLiked ? 'Super-liked' : 'Super-like (2 credits)'}>
        <button
          onClick={onSuperLike}
          aria-label={`Super-like${superLikeCount > 0 ? ` (${superLikeCount})` : ''}`}
          className={cn(
            'flex items-center gap-1.5 transition-all text-sm focus-visible:ring-2 focus-visible:ring-inc-tip focus-visible:outline-none rounded-lg px-2 py-1',
            superLiked ? 'text-inc-tip' : 'text-inc-muted hover:text-inc-tip hover:bg-inc-tip/5',
            superLikeAnimating && 'animate-super-burst',
          )}
        >
          <Zap className={cn('h-4 w-4', superLiked && 'fill-inc-tip')} strokeWidth={superLiked ? 2.5 : 1.5} />
          {superLikeCount > 0 && <span className="text-xs font-medium">{superLikeCount}</span>}
        </button>
      </Tooltip>
      <Tooltip content={tipped ? 'Tipped' : 'Send a tip'}>
        <button
          onClick={onTip}
          aria-label={`Tip${tipCount > 0 ? ` (${tipCount})` : ''}`}
          className={cn(
            'flex items-center gap-1.5 transition-all text-sm focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none rounded-lg px-2 py-1',
            tipped ? 'text-yellow-400' : 'text-inc-muted hover:text-yellow-400 hover:bg-yellow-400/5',
          )}
        >
          <svg className={cn('h-4 w-4', tipped && 'fill-yellow-400')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tipped ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 3 8 9l4 13 4-13-2.5-6" /><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" /><path d="M2 9h20" /></svg>
          {tipCount > 0 && <span className="text-xs font-medium">{tipCount}</span>}
        </button>
      </Tooltip>
      {onShare && (
        <Tooltip content="Share">
          <button
            onClick={onShare}
            aria-label="Share post link"
            className="flex items-center gap-1 text-inc-muted hover:text-inc-accent transition-colors text-sm focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-2 py-1"
          >
            <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </Tooltip>
      )}
      {onBookmark && (
        <Tooltip content={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
          <button
            onClick={onBookmark}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
            className={cn(
              'flex items-center gap-1 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-2 py-1',
              bookmarked ? 'text-inc-accent' : 'text-inc-muted hover:text-inc-accent',
            )}
          >
            <Bookmark className="h-3.5 w-3.5" strokeWidth={bookmarked ? 2.5 : 1.5} />
          </button>
        </Tooltip>
      )}
      <div className="ml-auto flex items-center gap-1">
        {isOwnPost && onEdit && (
          <Tooltip content="Edit">
            <button
              onClick={onEdit}
              aria-label="Edit post"
              className="flex items-center gap-1 text-inc-muted hover:text-inc-accent transition-colors text-sm focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-2 py-1"
            >
              <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}
        {isOwnPost && onDelete && (
          <Tooltip content="Delete">
            <button
              onClick={onDelete}
              aria-label="Delete post"
              className="flex items-center gap-1 text-inc-muted hover:text-red-400 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded-lg px-2 py-1"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Report">
          <button
            onClick={onReport}
            aria-label="Report post"
            className="flex items-center gap-1 text-inc-muted hover:text-red-400 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded-lg px-2 py-1"
          >
            <Flag className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
