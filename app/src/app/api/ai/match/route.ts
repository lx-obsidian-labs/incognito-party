import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/helper'

export async function POST(req: Request) {
  const { myPosts, myId } = await req.json()
  if (!myPosts || !Array.isArray(myPosts)) {
    return NextResponse.json({ error: 'myPosts array required' }, { status: 400 })
  }

  const myText = myPosts.map((p: any) => p.content).join(' | ')

  // Fetch a sample of other users' recent posts
  const supabase = createAdminClient()
  const { data: otherUsers } = await supabase
    .from('anon_users')
    .select('id, handle')
    .neq('id', myId || '')
    .limit(50)

  if (!otherUsers || otherUsers.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  const userIds = otherUsers.map((u) => u.id)
  const { data: otherPosts } = await supabase
    .from('posts')
    .select('author_id, content, created_at')
    .in('author_id', userIds)
    .order('created_at', { ascending: false })
    .limit(200)

  if (!otherPosts) return NextResponse.json({ suggestions: [] })

  // Group posts by user
  const userPostsMap = new Map<string, { handle: string; posts: string[] }>()
  for (const p of otherPosts) {
    const user = otherUsers.find((u) => u.id === p.author_id)
    if (!user) continue
    if (!userPostsMap.has(p.author_id)) {
      userPostsMap.set(p.author_id, { handle: user.handle, posts: [] })
    }
    userPostsMap.get(p.author_id)!.posts.push(p.content)
  }

  // Send batches to AI for matching
  const userSummaries = Array.from(userPostsMap.entries())
    .filter(([, v]) => v.posts.length > 0)
    .slice(0, 10)
    .map(([id, v]) => `User @${v.handle}: ${v.posts.slice(0, 5).join(' | ')}`)

  if (userSummaries.length === 0) return NextResponse.json({ suggestions: [] })

  const system = `You are a matchmaker for an anonymous social platform. Given "my" posts and a list of other users' posts, find users who share similar interests, life situations, or emotional states. Return ONLY a JSON array of objects: [{ "handle": "username", "reason": "why they match" }]. Max 4 matches.`
  const user = `My posts: ${myText}\n\nOther users:\n${userSummaries.join('\n')}`

  const result = await callAI(system, user, 0.3, 512)
  if (!result) return NextResponse.json({ suggestions: [] })

  try {
    const matches = JSON.parse(result)
    return NextResponse.json({ suggestions: Array.isArray(matches) ? matches : [] })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
