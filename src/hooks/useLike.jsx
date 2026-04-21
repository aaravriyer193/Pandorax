import { useState, useEffect } from 'react'
import { supabase, toggleLike } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

/**
 * Optimistic like toggle for any content type.
 * Usage: const { liked, count, toggle } = useLike(wonder.id, 'wonder', wonder.like_count)
 */
export function useLike(targetId, targetType, initialCount = 0) {
  const { session, profile } = useAuth()
  const [liked, setLiked]   = useState(false)
  const [count, setCount]   = useState(initialCount)

  // Check if user already liked this on mount
  useEffect(() => {
    if (!session || !targetId) return
    supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', session.user.id)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .single()
      .then(({ data }) => { if (data) setLiked(true) })
  }, [session, targetId, targetType])

  // Sync count if prop changes (e.g. refetch)
  useEffect(() => { setCount(initialCount) }, [initialCount])

  async function toggle() {
    if (!session) { toast('Sign in to like things ✦', { icon: '👋' }); return }

    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount(c => wasLiked ? c - 1 : c + 1)

    try {
      await toggleLike(session.user.id, targetId, targetType)
    } catch {
      // Revert on error
      setLiked(wasLiked)
      setCount(c => wasLiked ? c + 1 : c - 1)
      toast.error('Something went wrong')
    }
  }

  return { liked, count, toggle }
}