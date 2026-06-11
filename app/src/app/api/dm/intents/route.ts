import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'received' // received | sent

  const column = type === 'received' ? 'recipient_id' : 'sender_id'
  const { data, error } = await supabase
    .from('dm_intents')
    .select('*')
    .eq(column, user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ intents: data ?? [] })
}

// Accept / Decline an intent
export async function PATCH(req: Request) {
  const { intent_id, status } = await req.json()

  if (!intent_id || !['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'intent_id and status (accepted/declined) required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: intent } = await supabase.from('dm_intents').select('*').eq('id', intent_id).single()
  if (!intent) return NextResponse.json({ error: 'Intent not found' }, { status: 404 })
  if (intent.recipient_id !== user.id) return NextResponse.json({ error: 'Not your intent' }, { status: 403 })
  if (intent.status !== 'pending') return NextResponse.json({ error: 'Already responded' }, { status: 400 })

  if (status === 'declined') {
    // Refund the sender
    const { data: senderWallet } = await supabase.from('wallets').select('id, balance').eq('user_id', intent.sender_id).single()
    if (senderWallet) {
      await supabase.from('wallets').update({ balance: senderWallet.balance + intent.amount }).eq('user_id', intent.sender_id)
      await supabase.from('txns').insert({
        wallet_id: senderWallet.id,
        type: 'earn',
        amount: intent.amount,
        note: 'Refund for declined chat request',
      })
    }
  }

  if (status === 'accepted') {
    // Pay the recipient (platform takes no cut for MVP)
    const { data: recipientWallet } = await supabase.from('wallets').select('id, balance').eq('user_id', intent.recipient_id).single()
    if (recipientWallet) {
      await supabase.from('wallets').update({ balance: recipientWallet.balance + intent.amount }).eq('user_id', intent.recipient_id)
      await supabase.from('txns').insert({
        wallet_id: recipientWallet.id,
        type: 'tip_received',
        amount: intent.amount,
        note: 'Paid chat session',
      })
    }

    // Auto-create a DM relationship for the duration
    await supabase.from('dm_relationships').upsert(
      { user_id: intent.sender_id, allowed_user_id: intent.recipient_id },
      { onConflict: 'user_id,allowed_user_id' }
    )
    await supabase.from('dm_relationships').upsert(
      { user_id: intent.recipient_id, allowed_user_id: intent.sender_id },
      { onConflict: 'user_id,allowed_user_id' }
    )
  }

  const { data: updated } = await supabase
    .from('dm_intents')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', intent_id)
    .select()
    .single()

  return NextResponse.json({ intent: updated, success: true })
}
