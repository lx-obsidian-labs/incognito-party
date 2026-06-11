import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scanContent } from '@/lib/ai/anonymity-guard'

export async function POST(req: Request) {
  const { recipient_id, amount, message, hours } = await req.json()

  if (!recipient_id || !amount || !message) {
    return NextResponse.json({ error: 'recipient_id, amount, message required' }, { status: 400 })
  }

  if (amount < 5) {
    return NextResponse.json({ error: 'Minimum 5 credits to start a chat' }, { status: 400 })
  }

  // Scan for PII
  const scan = scanContent(message)
  if (scan.blocked) {
    return NextResponse.json({ error: scan.message }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check sender has enough balance
  const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', user.id).single()
  if (!wallet || wallet.balance < amount) {
    return NextResponse.json({ error: 'Not enough credits' }, { status: 400 })
  }

  // Deduct credits
  const { error: deductError } = await supabase
    .from('wallets')
    .update({ balance: wallet.balance - amount })
    .eq('user_id', user.id)

  if (deductError) {
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })
  }

  // Record txn
  await supabase.from('txns').insert({
    wallet_id: wallet.id,
    type: 'tip_sent',
    amount: -amount,
    note: `Paid chat request to ${recipient_id}`,
  })

  // Create intent
  const { data: intent, error } = await supabase.from('dm_intents').insert({
    sender_id: user.id,
    recipient_id,
    amount,
    message: message.trim(),
    hours: hours || 24,
  }).select().single()

  if (error) {
    // Refund
    await supabase.from('wallets').update({ balance: wallet.balance }).eq('user_id', user.id)
    return NextResponse.json({ error: 'Could not create request' }, { status: 500 })
  }

  return NextResponse.json({ intent, success: true })
}
