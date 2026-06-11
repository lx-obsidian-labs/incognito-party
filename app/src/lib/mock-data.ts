// Mock backend — all data stored in localStorage under key 'incognito_db'
// Activated by setting NEXT_PUBLIC_MOCK_MODE=true in .env.local

let listeners: Array<() => void> = []
let sessionId: string | null = null

export function onDataChange(fn: () => void) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

function notify() {
  listeners.forEach((fn) => fn())
  persist()
}

function persist() {
  if (typeof window !== 'undefined') {
    const raw: Record<string, unknown> = {}
    for (const [k, v] of db.entries()) {
      raw[k] = v
    }
    localStorage.setItem('incognito_db', JSON.stringify(raw))
  }
}

function load(): Map<string, unknown[]> {
  if (typeof window === 'undefined') return new Map()
  try {
    const raw = JSON.parse(localStorage.getItem('incognito_db') ?? '{}')
    const m = new Map<string, unknown[]>()
    for (const [k, v] of Object.entries(raw)) {
      m.set(k, v as unknown[])
    }
    return m
  } catch {
    return new Map()
  }
}

const db = load()

function table(name: string): Record<string, unknown>[] {
  if (!db.has(name)) db.set(name, [])
  return db.get(name)! as Record<string, unknown>[]
}

function uuid() {
  return crypto.randomUUID()
}

function now() {
  return new Date().toISOString()
}

const adjectives = [
  'Misty', 'Silent', 'Neon', 'Crimson', 'Frozen', 'Velvet', 'Electric',
  'Cosmic', 'Shadow', 'Solar', 'Lunar', 'Crystal', 'Ember', 'Phantom',
  'Savage', 'Wild', 'Bold', 'Quiet', 'Swift', 'Brave', 'Calm', 'Deep',
]

const nouns = [
  'Wolf', 'Phoenix', 'Storm', 'Vortex', 'Tiger', 'Falcon', 'Dragon',
  'Hawk', 'Lynx', 'Raven', 'Fox', 'Bear', 'Lion', 'Eagle', 'Otter',
  'Whale', 'Crow', 'Owl', 'Puma', 'Viper', 'Elk', 'Ram',
]

function randomHandle() {
  const a = adjectives[Math.floor(Math.random() * adjectives.length)]
  const n = nouns[Math.floor(Math.random() * nouns.length)]
  return `${a}${n}`
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ---- Seed data ----

function ensureChannels() {
  const items = table('channels')
  if (items.length === 0) {
    const seed = [
      { id: uuid(), slug: 'advice', name: 'Advice', description: 'Seek and give advice', icon: '💡' },
      { id: uuid(), slug: 'confessions', name: 'Confessions', description: 'Get it off your chest', icon: '🤫' },
      { id: uuid(), slug: 'wins', name: 'Wins', description: 'Share your victories', icon: '🏆' },
      { id: uuid(), slug: 'rants', name: 'Rants', description: 'Vent about anything', icon: '😤' },
      { id: uuid(), slug: 'daily', name: 'Daily', description: 'Your day, your way', icon: '📆' },
      { id: uuid(), slug: 'offtopic', name: 'Off Topic', description: 'Everything else', icon: '🌀' },
    ]
    seed.forEach((c) => items.push(c))
    persist()
  }
}

function seedMockPosts() {
  const posts = table('posts')
  const users = table('anon_users')
  const channels = table('channels')
  const interactions = table('interactions')

  if (posts.length > 0) return

  const mockContent = [
    'Just finished my first marathon today! Never thought I could do it 🏃‍♂️',
    'Anyone else feel like social media is exhausting sometimes? Glad this place exists.',
    'Hot take: pineapple belongs on pizza. Fight me.',
    'Today was rough. My cat knocked over my coffee and then looked me dead in the eye.',
    'What is everyone reading right now? Need book recommendations!',
    'I just realized I\'ve been putting my socks on wrong my entire life.',
    'Pro tip: if you\'re feeling down, go for a walk without your phone. It helps.',
    'Can we talk about how underrated silence is?',
    'Just learned to cook pasta from scratch. Game changer.',
    'Sometimes the best advice is just listening without judgement.',
    'I tipped someone today just because their post made me smile. This platform rocks.',
    'Venting: my boss scheduled a meeting at 5 PM on a Friday. Why?',
    'Unpopular opinion: mornings are actually great if you give them a chance.',
    'Just made a new friend here. Love this anonymous community 💜',
    'Day 3 of my gratitude journal. Already feeling different.',
  ]

  const momentContent = [
    'Who\'s up right now? 🌙',
    'Drop your favorite song in replies 🎵',
    'Hot take of the moment: go!',
    'What are you thinking about?',
  ]

  for (let i = 0; i < 15; i++) {
    const user = pick(users) as Record<string, unknown>
    const channel = pick(channels) as Record<string, unknown>
    const post = {
      id: uuid(),
      channel_id: channel.id,
      author_id: user.id,
      content: mockContent[i],
      media_url: null,
      created_at: new Date(Date.now() - randomInt(0, 86400000 * 3)).toISOString(),
      is_flagged: false,
      is_removed: false,
      removed_at: null,
      views: randomInt(0, 120),
      scheduled_at: null,
      is_moment: false,
      expires_at: null,
    }
    posts.push(post)
  }

  for (const content of momentContent) {
    const user = pick(users) as Record<string, unknown>
    const channel = pick(channels) as Record<string, unknown>
    const post = {
      id: uuid(),
      channel_id: channel.id,
      author_id: user.id,
      content,
      media_url: null,
      created_at: new Date(Date.now() - randomInt(0, 3600000 * 6)).toISOString(),
      is_flagged: false,
      is_removed: false,
      removed_at: null,
      views: randomInt(0, 40),
      scheduled_at: null,
      is_moment: true,
      expires_at: new Date(Date.now() + randomInt(3600000, 86400000)).toISOString(),
    }
    posts.push(post)
  }

  for (const post of posts) {
    const p = post as Record<string, unknown>
    const likers = table('anon_users').slice(0, randomInt(0, 5)) as Array<Record<string, unknown>>
    for (const liker of likers) {
      if (liker.id === p.author_id) continue
      const interactionType = pick(['like', 'like', 'like', 'super_like', 'tip'] as const)
      const interaction = {
        id: uuid(),
        post_id: p.id,
        user_id: liker.id,
        type: interactionType,
        amount: interactionType === 'tip' ? randomInt(1, 5) : 0,
        created_at: now(),
      }
      interactions.push(interaction)
    }
  }

  // Seed notifications from interactions
  const notifications = table('notifications')
  for (const interaction of interactions) {
    const i = interaction as Record<string, unknown>
    const post = posts.find((p) => (p as Record<string, unknown>).id === i.post_id) as Record<string, unknown> | undefined
    if (!post) continue
    const exists = notifications.some(
      (n) =>
        (n as Record<string, unknown>).actor_id === i.user_id &&
        (n as Record<string, unknown>).post_id === i.post_id &&
        (n as Record<string, unknown>).type === i.type,
    )
    if (exists) continue
    notifications.push({
      id: uuid(),
      user_id: post.author_id,
      type: i.type,
      actor_id: i.user_id,
      post_id: i.post_id,
      read: Math.random() > 0.6,
      created_at: i.created_at,
    })
  }

  persist()
}

function seedMockDMs() {
  const msgs = table('direct_messages')
  if (msgs.length > 0) return

  const users = table('anon_users') as Array<Record<string, unknown>>
  if (users.length < 2) return

  const convos = [
    { content: 'Hey! Loved your post about marathons!', senderIdx: 1, recipientIdx: 0 },
    { content: 'Thanks so much! It was tough but worth it 😊', senderIdx: 0, recipientIdx: 1 },
    { content: 'Any tips for a beginner?', senderIdx: 1, recipientIdx: 0 },
    { content: 'Start slow and stay consistent. You got this!', senderIdx: 0, recipientIdx: 1 },
  ]

  for (const c of convos) {
    msgs.push({
      id: uuid(),
      sender_id: users[c.senderIdx].id,
      recipient_id: users[c.recipientIdx].id,
      content: c.content,
      created_at: now(),
      is_read: false,
    })
  }

  // DM relationships
  const rels = table('dm_relationships')
  rels.push({
    user_id: users[0].id,
    allowed_user_id: users[1].id,
    created_at: now(),
  })
  rels.push({
    user_id: users[1].id,
    allowed_user_id: users[0].id,
    created_at: now(),
  })

  persist()
}

function seedMockBlockedUsers() {
  const blocked = table('blocked_users')
  if (blocked.length > 0) return

  const users = table('anon_users') as Array<Record<string, unknown>>
  if (users.length < 4) return

  blocked.push({
    id: uuid(),
    user_id: users[0].id,
    blocked_user_id: users[2].id,
    created_at: now(),
  })
  blocked.push({
    id: uuid(),
    user_id: users[1].id,
    blocked_user_id: users[3].id,
    created_at: now(),
  })

  persist()
}

function seedMockAchievements() {
  const achievements = table('achievements')
  if (achievements.length > 0) return

  const users = table('anon_users') as Array<Record<string, unknown>>
  if (users.length < 2) return

  const defs = [
    { slug: 'first_post', title: 'First Post', description: 'Posted for the first time', icon: '📝' },
    { slug: 'first_tip', title: 'First Tipper', description: 'Sent your first tip', icon: '💰' },
    { slug: 'ten_likes', title: 'Getting Popular', description: 'Received 10 likes', icon: '⭐' },
    { slug: 'chatty', title: 'Chatty', description: 'Sent 5 DMs', icon: '💬' },
  ]

  for (let i = 0; i < Math.min(2, users.length); i++) {
    for (const def of defs) {
      achievements.push({
        id: uuid(),
        user_id: users[i].id,
        slug: def.slug,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlocked_at: new Date(Date.now() - randomInt(0, 86400000 * 7)).toISOString(),
      })
    }
  }

  persist()
}

function seedMockReactions() {
  const reactions = table('reactions')
  if (reactions.length > 0) return
  const posts = table('posts') as Array<Record<string, unknown>>
  const users = table('anon_users') as Array<Record<string, unknown>>
  const EMOJIS = ['❤️', '🔥', '💯', '😂', '😢']
  for (const post of posts) {
    const numReactions = randomInt(0, 4)
    for (let i = 0; i < numReactions; i++) {
      reactions.push({
        id: uuid(),
        post_id: post.id,
        user_id: pick(users).id,
        emoji: pick(EMOJIS),
        created_at: now(),
      })
    }
  }
  persist()
}

function seedMockStreaks() {
  const streaks = table('streaks')
  if (streaks.length > 0) return

  const users = table('anon_users') as Array<Record<string, unknown>>
  for (const user of users) {
    streaks.push({
      id: uuid(),
      user_id: user.id,
      current_streak: 1,
      longest_streak: 3,
      last_login: new Date(Date.now() - randomInt(0, 86400000 * 2)).toISOString(),
    })
  }
  persist()
}

function cleanExpiredMoments() {
  const posts = table('posts') as Array<Record<string, unknown>>
  const now = new Date().toISOString()
  for (let i = posts.length - 1; i >= 0; i--) {
    const p = posts[i]
    if (p.is_moment && p.expires_at && (p.expires_at as string) < now) {
      posts.splice(i, 1)
    }
  }
}

export function ensureSeedData() {
  const users = table('anon_users')
  if (users.length === 0) {
    for (let i = 0; i < 8; i++) {
      const bioOptions = [
        'Just vibing 🌊',
        'Here for the good vibes',
        'Living life one day at a time',
        'Ask me anything',
        'I write things sometimes',
        '',
        'Professional overthinker',
        'Spread kindness',
      ]
      users.push({
        id: uuid(),
        handle: randomHandle(),
        created_at: new Date(Date.now() - randomInt(86400000, 86400000 * 30)).toISOString(),
        last_seen: new Date(Date.now() - randomInt(0, 86400000)).toISOString(),
        is_banned: false,
        dm_privacy: 'anyone',
        bio: bioOptions[users.length % bioOptions.length],
        avatar_color: undefined,
      })
    }
    persist()
  }

  ensureChannels()
  seedMockPosts()
  seedMockDMs()
  seedMockBlockedUsers()
  seedMockAchievements()
  seedMockReactions()
  seedMockStreaks()
  cleanExpiredMoments()
}

export function getSession() {
  const users = table('anon_users') as Array<Record<string, unknown>>
  if (!sessionId) {
    const uid = uuid()
    sessionId = uid
    users.push({
      id: uid,
      handle: randomHandle(),
      created_at: now(),
      last_seen: now(),
      is_banned: false,
      dm_privacy: 'anyone',
      bio: '',
      avatar_color: undefined,
    })
    // Give wallet
    const wallets = table('wallets')
    wallets.push({
      id: uuid(),
      user_id: sessionId,
      balance: 50,
      last_daily_credits: new Date(Date.now() - 86400000).toISOString(),
      created_at: now(),
    })
    // Give daily credits txn
    const txns = table('txns')
    txns.push({
      id: uuid(),
      wallet_id: wallets[wallets.length - 1].id,
      type: 'earn',
      amount: 20,
      note: 'Welcome credits',
      ref_id: null,
      created_at: now(),
    })
    // Give streak
    const streaks = table('streaks')
    streaks.push({
      id: uuid(),
      user_id: sessionId,
      current_streak: 1,
      longest_streak: 3,
      last_login: new Date(Date.now() - 86400000).toISOString(),
    })
    // Subscribe to first channel
    const subs = table('channel_subs')
    const channels = table('channels')
    if (channels.length > 0) {
      subs.push({ user_id: sessionId, channel_id: (channels[0] as Record<string, unknown>).id })
    }
    persist()
  }

  return {
    data: {
      session: {
        user: {
          id: sessionId,
          aud: 'authenticated',
          role: 'authenticated',
          email: null,
          phone: null,
          created_at: now(),
        },
      },
    },
  }
}

export function createMockClient() {

  function getTable(name: string): Record<string, unknown>[] {
    if (!db.has(name)) db.set(name, [])
    return db.get(name)! as Record<string, unknown>[]
  }

  function cloneTable(name: string): Record<string, unknown>[] {
    return JSON.parse(JSON.stringify(getTable(name))) as Record<string, unknown>[]
  }

  return {
    auth: {
      getSession: () => Promise.resolve(getSession()),
      signInAnonymously: () => {
        const sessionRes = getSession()
        return Promise.resolve({
          data: {
            user: sessionRes.data.session?.user ?? null,
            session: sessionRes.data.session ?? null,
          },
        })
      },
      onAuthStateChange: (callback: (event: string, session: { user?: { id: string } | null } | null) => void) => {
        const unsub = onDataChange(() => {
          const s = getSession().data.session
          callback('SIGNED_IN', s)
        })
        return { data: { subscription: { unsubscribe: unsub } } }
      },
    },
    from: (tableName: string) => {
      let data = cloneTable(tableName)
      const filters: Array<(row: Record<string, unknown>) => boolean> = []
      let pendingUpdate: Record<string, unknown> | null = null
      let pendingUpsert: Record<string, unknown> | null = null

      const execute = () => {
        if (tableName === 'posts') cleanExpiredMoments()
        if (pendingUpdate) {
          const table = getTable(tableName) as Record<string, unknown>[]
          for (const row of table) {
            let match = true
            for (const fn of filters) {
              if (!fn(row)) { match = false; break }
            }
            if (match) {
              Object.assign(row, pendingUpdate)
            }
          }
          pendingUpdate = null
          persist()
          notify()
          return { data: [], error: null }
        }
        if (pendingUpsert) {
          const rows = getTable(tableName) as Record<string, unknown>[]
          const existing = rows.find((r) => {
            let match = true
            for (const fn of filters) {
              if (!fn(r)) { match = false; break }
            }
            return match
          })
          if (existing) {
            Object.assign(existing, pendingUpsert)
          } else {
            if (!pendingUpsert.id) pendingUpsert.id = uuid()
            rows.push(pendingUpsert)
          }
          pendingUpsert = null
          notify()
          return { data: [], error: null }
        }
        let results = data.slice()
        for (const fn of filters) {
          results = results.filter(fn)
        }
        return { data: results, error: null }
      }

      const builder: {
        select: (columns?: string) => typeof builder
        insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => Promise<{ data: Record<string, unknown>[]; error: null }>
        update: (updates: Record<string, unknown>) => typeof builder
        upsert: (row: Record<string, unknown>, opts?: unknown) => typeof builder
        delete: () => typeof builder
        eq: (col: string, val: unknown) => typeof builder
        lt: (col: string, val: unknown) => typeof builder
        in: (col: string, vals: unknown[]) => typeof builder
        or: (filterStr: string) => typeof builder
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
        order: (col: string, opts?: { ascending?: boolean }) => typeof builder
        limit: (n: number) => typeof builder
        then: <T>(resolve: (v: { data: unknown[]; error: null }) => T, reject?: (e: Error) => T) => Promise<T>
      } = {
        select: (_columns?: string) => {
          return builder
        },
        insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => {
          const arr = Array.isArray(rows) ? rows : [rows]
          for (const row of arr) {
            if (!row.id) row.id = uuid()
            if (!row.created_at) row.created_at = now()
            getTable(tableName).push(row)
          }
          notify()
          return Promise.resolve({ data: arr, error: null })
        },
        update: (updates: Record<string, unknown>) => {
          pendingUpdate = updates
          return builder
        },
        upsert: (row: Record<string, unknown>, _opts?: unknown) => {
          pendingUpsert = row
          return builder
        },
        delete: () => {
          const table = getTable(tableName) as Record<string, unknown>[]
          const toDelete = new Set(table.filter((r) => {
            let match = true
            for (const fn of filters) {
              if (!fn(r)) { match = false; break }
            }
            return match
          }))
          for (let i = table.length - 1; i >= 0; i--) {
            if (toDelete.has(table[i])) {
              table.splice(i, 1)
            }
          }
          notify()
          return builder
        },
        eq: (col: string, val: unknown) => {
          filters.push((r) => r[col] === val)
          data = data.filter((r) => r[col] === val)
          return builder
        },
        lt: (col: string, val: unknown) => {
          filters.push((r) => (r[col] as string) < (val as string))
          data = data.filter((r) => (r[col] as string) < (val as string))
          return builder
        },
        in: (col: string, vals: unknown[]) => {
          filters.push((r) => (vals as unknown[]).includes(r[col]))
          data = data.filter((r) => (vals as unknown[]).includes(r[col]))
          return builder
        },
        or: (filterStr: string) => {
          // Parse "and(sender_id.eq.X,recipient_id.eq.Y),and(sender_id.eq.Z,recipient_id.eq.W)"
          // Also support simple "col.eq.val,col2.eq.val2"
          const groups: Array<Array<{ col: string; val: string }>> = []

          const remaining = filterStr.trim()
          if (remaining.startsWith('and(')) {
            // Complex format: and(...),and(...)
            const groupStrs = remaining.split('),and(')
            for (let gs of groupStrs) {
              gs = gs.replace(/^and\(/, '').replace(/\)$/, '')
              const conds = gs.split(',').map((c) => {
                const parts = c.split('.')
                return { col: parts[0], val: parts.slice(2).join('.') }
              })
              groups.push(conds)
            }
          } else {
            // Simple format: col.eq.val,col2.eq.val2
            const conds = remaining.split(',').map((c) => {
              const parts = c.split('.')
              return { col: parts[0], val: parts.slice(2).join('.') }
            })
            groups.push(conds)
          }

          const matchFn = (r: Record<string, unknown>) =>
            groups.some((group) => group.every((cond) => String(r[cond.col]) === cond.val))

          filters.push(matchFn)
          data = data.filter(matchFn)
          return builder
        },
        single: () => {
          const result = data[0] ?? null
          return Promise.resolve({ data: result, error: result ? null : { message: 'Not found' } })
        },
        maybeSingle: () => {
          const result = data[0] ?? null
          return Promise.resolve({ data: result, error: null })
        },
        order: (col: string, opts?: { ascending?: boolean }) => {
          const asc = opts?.ascending ?? true
          data.sort((a, b) => {
            const va = a[col] as string
            const vb = b[col] as string
            if (!va && !vb) return 0
            if (!va) return 1
            if (!vb) return -1
            return asc ? va.localeCompare(vb) : vb.localeCompare(va)
          })
          return builder
        },
        limit: (n: number) => {
          data = data.slice(0, n)
          return builder
        },
        then: <T>(resolve: (v: { data: unknown[]; error: null }) => T | PromiseLike<T>, reject?: ((e: Error) => T | PromiseLike<T>) | null) => {
          return Promise.resolve(execute() as unknown as { data: unknown[]; error: null }).then(resolve, reject ?? undefined) as Promise<T> & { catch: (onreject: (e: Error) => T | PromiseLike<T>) => Promise<T> }
        },
      }
      return builder
    },
    channel: (_name: string) => ({
      on: (_type: string, _config: unknown, _callback: (payload: unknown) => void) => ({
        subscribe: () => {
          const unsub = onDataChange(() => { cleanExpiredMoments() })
          return { unsubscribe: unsub }
        },
        on: (_type2: string, _config2: unknown, _callback2: (payload: unknown) => void) => ({
          subscribe: () => {
            const unsub = onDataChange(() => { cleanExpiredMoments() })
            return { unsubscribe: unsub }
          },
        }),
      }),
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => {},
    storage: {
      from: (_bucket: string) => ({
        upload: (_path: string, _file: File) => {
          const url = URL.createObjectURL(_file)
          return Promise.resolve({ data: { path: _path }, error: null })
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: path.startsWith('blob:') ? path : `/mock-uploads/${path}` },
        }),
      }),
    },
  }
}

export function isMockMode(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
}
