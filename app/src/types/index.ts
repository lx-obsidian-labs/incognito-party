export interface IAnonUser {
  id: string
  handle: string
  created_at: string
  last_seen: string
  is_banned: boolean
  dm_privacy?: 'nobody' | 'tipped' | 'anyone'
  bio?: string
  avatar_color?: string
}

export interface IChannel {
  id: string
  slug: string
  name: string
  description: string
  icon: string
}

export interface IPost {
  id: string
  channel_id: string
  author_id: string
  content: string
  media_url: string | string[] | null
  created_at: string
  is_flagged: boolean
  is_removed: boolean
  author_handle?: string
  like_count?: number
  super_like_count?: number
  tip_count?: number
  views?: number
  mood?: string | null
  comments_count?: number
  scheduled_at?: string | null
  is_moment?: boolean
  expires_at?: string | null
  user_interaction?: {
    liked: boolean
    super_liked: boolean
    tipped: boolean
  }
}

export interface IInteraction {
  id: string
  post_id: string
  user_id: string
  type: 'like' | 'super_like' | 'tip'
  amount: number
  created_at: string
}

export interface IDirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  is_read: boolean
  sender_handle?: string
  // optional fields used client-side for optimistic UI
  temp_client_id?: string
  is_pending?: boolean
  is_failed?: boolean
}

export interface IDMRelationship {
  user_id: string
  allowed_user_id: string
  allowed_handle?: string
  created_at: string
}

export interface IWallet {
  id: string
  user_id: string
  balance: number
  created_at: string
}

export interface ITxn {
  id: string
  wallet_id: string
  type: 'earn' | 'purchase' | 'tip_sent' | 'tip_received'
  amount: number
  ref_id: string | null
  note: string | null
  created_at: string
}

export interface IStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_login: string
}

export interface INotification {
  id: string
  user_id: string
  type: 'like' | 'super_like' | 'tip' | 'dm' | 'achievement'
  actor_id: string
  post_id: string | null
  read: boolean
  created_at: string
}

export interface IReaction {
  id: string
  post_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface IReport {
  id: string
  reporter_id: string
  post_id: string
  reason: string
  created_at: string
}

export interface ISavedPost {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface IAchievement {
  id: string
  user_id: string
  slug: string
  title: string
  description: string
  icon: string
  unlocked_at: string
}

export type InteractionType = 'like' | 'super_like' | 'tip'

export interface IPersona {
  persona: string
  vibe: string
  interests: string[]
  needs: string
  topics: string[]
  advice: string
}

export interface IMatchSuggestion {
  handle: string
  reason: string
}

export interface IDMIntent {
  id: string
  sender_id: string
  recipient_id: string
  amount: number
  message: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  hours: number
  created_at: string
  responded_at?: string
  sender_handle?: string
  recipient_handle?: string
}

export interface IContentFlag {
  id: string
  pattern: string
  label: string
  action: 'flag' | 'block' | 'warn'
}

export const CHANNEL_SLUGS = [
  'advice',
  'confessions',
  'wins',
  'rants',
  'daily',
  'offtopic',
] as const

export type ChannelSlug = (typeof CHANNEL_SLUGS)[number]
