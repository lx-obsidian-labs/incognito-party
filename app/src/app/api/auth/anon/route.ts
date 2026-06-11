import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateHandle } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 })
  }

  const userId = session.user.id

  const { data: existing } = await supabase
    .from('anon_users')
    .select('handle')
    .eq('id', userId)
    .single() as { data: { handle: string } | null }

  if (existing) {
    return NextResponse.json({ handle: existing.handle })
  }

  let handle = generateHandle()
  let attempts = 0
  while (attempts < 20) {
    const { count } = await supabase
      .from('anon_users')
      .select('*', { count: 'exact', head: true })
      .eq('handle', handle)
    if (count === 0) break
    handle = generateHandle()
    attempts++
  }

  const admin = createAdminClient()
  const { error: insertErr } = await admin.from('anon_users').insert({
    id: userId,
    handle,
  })
  if (insertErr) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }

  const { error: walletErr } = await admin.from('wallets').insert({
    user_id: userId,
    balance: 50,
    last_daily_credits: new Date(Date.now() - 86400000).toISOString(),
  })
  if (walletErr) {
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
  }

  return NextResponse.json({ handle })
}
