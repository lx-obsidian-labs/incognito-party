'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePushNotifications() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false)
        return
      }
      supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          setEnabled(!!data)
          setLoading(false)
        })
    })
  }, [])

  async function subscribe() {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8'
      ),
    })

    const supabase = createClient()
    const { error } = await supabase.from('push_subscriptions').insert({
      subscription: JSON.stringify(sub),
    })
    if (error) throw error
    setEnabled(true)
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
    }
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (session.session?.user) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', session.session.user.id)
    }
    setEnabled(false)
  }

  return { enabled, loading, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}
