import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id } = await req.json()
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', user.id)
    .single()

  if (!wallet || wallet.balance < 2) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
  }

  const { error: interactionErr } = await supabase.from('interactions').insert({
    post_id,
    user_id: user.id,
    type: 'super_like',
    amount: 2,
  })
  if (interactionErr) return NextResponse.json({ error: interactionErr.message }, { status: 500 })

  await supabase.from('wallets').update({ balance: wallet.balance - 2 }).eq('id', wallet.id)
  await supabase.from('txns').insert({
    wallet_id: wallet.id,
    type: 'tip_sent',
    amount: 2,
    ref_id: post_id,
    note: 'Super-like',
  })

  return NextResponse.json({ success: true })
}
