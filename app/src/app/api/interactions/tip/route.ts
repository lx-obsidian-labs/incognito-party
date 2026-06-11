import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id, amount } = await req.json()
  if (!post_id || !amount || amount < 1) {
    return NextResponse.json({ error: 'post_id and valid amount required' }, { status: 400 })
  }

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', user.id)
    .single()

  if (!wallet || wallet.balance < amount) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
  }

  const { error: interactionErr } = await supabase.from('interactions').insert({
    post_id,
    user_id: user.id,
    type: 'tip',
    amount,
  })
  if (interactionErr) return NextResponse.json({ error: interactionErr.message }, { status: 500 })

  await supabase.from('wallets').update({ balance: wallet.balance - amount }).eq('id', wallet.id)
  await supabase.from('txns').insert({
    wallet_id: wallet.id,
    type: 'tip_sent',
    amount,
    ref_id: post_id,
    note: `Tip of ${amount} credits`,
  })

  return NextResponse.json({ success: true })
}
