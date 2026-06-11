'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const DRAFT_PREFIX = 'inc_draft_'

export function usePostDraft(channelId: string) {
  const [draft, setDraft] = useState('')
  const [hasDraft, setHasDraft] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const key = `${DRAFT_PREFIX}${channelId}`

  useEffect(() => {
    const saved = localStorage.getItem(key)
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(saved)
      setHasDraft(true)
    }
  }, [key])

  const saveDraft = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (text.trim()) {
        localStorage.setItem(key, text)
        setHasDraft(true)
      } else {
        localStorage.removeItem(key)
        setHasDraft(false)
      }
    }, 500)
  }, [key])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key)
    setDraft('')
    setHasDraft(false)
  }, [key])

  const restoreDraft = useCallback(() => {
    const saved = localStorage.getItem(key)
    return saved ?? ''
  }, [key])

  return { draft, hasDraft, saveDraft, clearDraft, restoreDraft, setDraft }
}
