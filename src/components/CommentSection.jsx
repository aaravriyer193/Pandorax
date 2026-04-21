import { useState, useEffect, useRef } from 'react'
import { Heart, Send, Image as ImageIcon, X, ChevronDown } from 'lucide-react'
import { supabase, fetchComments } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Nav'
import toast from 'react-hot-toast'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function CommentSection({ targetId, targetType, initialCount = 0 }) {
  const { session, profile } = useAuth()
  const [comments, setComments]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [body, setBody]             = useState('')
  const [imageFile, setImageFile]   = useState(null)
  const [imagePreview, setPreview]  = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo]       = useState(null) // { id, username }
  const fileRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    load()
    // Realtime subscription
    const channel = supabase
      .channel(`comments:${targetId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `target_id=eq.${targetId}`,
      }, payload => {
        // Fetch full comment with author info
        supabase
          .from('comments_with_author')
          .select('*')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if (data) setComments(c => [...c, data])
          })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [targetId])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchComments(targetId, targetType)
      setComments(data)
    } catch (e) {
      toast.error('Could not load comments')
    } finally {
      setLoading(false)
    }
  }

  function handleImagePick(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e) {
    e.preventDefault()
    if (!body.trim() && !imageFile) return
    if (!session) { toast('Sign in to comment'); return }
    setSubmitting(true)

    try {
      let imageUrl = null

      // Upload image if present
      if (imageFile) {
        const ext  = imageFile.name.split('.').pop()
        const path = `${session.user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('wonder-images')
          .upload(path, imageFile, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('wonder-images').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('comments').insert({
        author_id:   session.user.id,
        target_id:   targetId,
        target_type: targetType,
        parent_id:   replyTo?.id ?? null,
        body:        body.trim(),
        image_url:   imageUrl,
      })
      if (error) throw error

      setBody('')
      clearImage()
      setReplyTo(null)
    } catch (err) {
      toast.error('Failed to post comment')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-serif font-medium text-[16px] tracking-tight">
          {initialCount} {initialCount === 1 ? 'comment' : 'comments'}
        </h4>
      </div>

      {/* Composer */}
      {session ? (
        <form onSubmit={submit} className="flex flex-col gap-3">
          {replyTo && (
            <div className="flex items-center gap-2 text-[12px] text-ink-muted bg-beige-mid px-3 py-2 rounded-px">
              <span>Replying to <strong>@{replyTo.username}</strong></span>
              <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-ink-faint hover:text-ink">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <Avatar profile={profile} size={32} />
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                ref={textRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="What does this make you think?"
                rows={2}
                className="textarea text-[14px]"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e) }}
              />

              {/* Image preview */}
              {imagePreview && (
                <div className="relative w-24">
                  <img src={imagePreview} alt="" className="w-24 h-16 object-cover rounded-px border border-ink/10" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ink text-beige rounded-full flex items-center justify-center"
                  >
                    <X size={9} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="btn-ghost text-[12px]"
                    title="Attach image"
                  >
                    <ImageIcon size={14} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImagePick}
                  />
                  <span className="text-[11px] text-ink-faint">⌘↵ to send</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting || (!body.trim() && !imageFile)}
                  className="btn-primary text-[13px] py-2 px-4 disabled:opacity-40"
                >
                  {submitting ? '...' : <><Send size={13} /> Post</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 border border-ink/10 rounded-px">
          <p className="text-[13px] text-ink-muted">
            <button className="text-ink underline underline-offset-2" onClick={() => toast('Use the Sign in button above')}>
              Sign in
            </button>{' '}
            to join the conversation
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="flex flex-col gap-0 divide-y divide-ink/8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <CommentSkeleton key={i} />)
        ) : comments.length === 0 ? (
          <p className="text-[13px] text-ink-faint text-center py-8 italic font-serif">
            Be the first to wonder aloud.
          </p>
        ) : (
          comments.map(c => (
            <Comment
              key={c.id}
              comment={c}
              session={session}
              onReply={() => { setReplyTo({ id: c.id, username: c.username }); textRef.current?.focus() }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function Comment({ comment, session, onReply }) {
  const [liked, setLiked]   = useState(false)
  const [count, setCount]   = useState(comment.like_count ?? 0)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies]         = useState([])

  async function toggleLike() {
    if (!session) { toast('Sign in to like'); return }
    const { data: existing } = await supabase
      .from('likes').select('user_id')
      .eq('user_id', session.user.id).eq('target_id', comment.id).eq('target_type', 'forum_reply')
      .single()
    if (existing) {
      await supabase.from('likes').delete().eq('user_id', session.user.id).eq('target_id', comment.id).eq('target_type', 'forum_reply')
      setLiked(false); setCount(c => c - 1)
    } else {
      await supabase.from('likes').insert({ user_id: session.user.id, target_id: comment.id, target_type: 'forum_reply' })
      setLiked(true); setCount(c => c + 1)
    }
  }

  async function loadReplies() {
    if (showReplies) { setShowReplies(false); return }
    const { data } = await supabase
      .from('comments_with_author').select('*')
      .eq('parent_id', comment.id).order('created_at', { ascending: true })
    setReplies(data ?? [])
    setShowReplies(true)
  }

  return (
    <div className="py-4 flex gap-3">
      <Avatar profile={{ username: comment.username, display_name: comment.display_name, avatar_url: comment.avatar_url, avatar_color: comment.avatar_color }} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[13px] font-medium text-ink">{comment.username}</span>
          <span className="text-[11px] text-ink-faint">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-[14px] text-ink leading-relaxed">{comment.body}</p>

        {comment.image_url && (
          <img
            src={comment.image_url}
            alt=""
            className="mt-3 max-w-[240px] rounded-px border border-ink/10 cursor-pointer"
            onClick={() => window.open(comment.image_url, '_blank')}
          />
        )}

        <div className="flex items-center gap-4 mt-2">
          <button onClick={toggleLike} className={`btn-ghost text-[12px] ${liked ? 'text-accent-coral' : ''}`}>
            <Heart size={12} fill={liked ? 'currentColor' : 'none'} /> {count > 0 && count}
          </button>
          <button onClick={onReply} className="btn-ghost text-[12px]">Reply</button>
          {comment.reply_count > 0 && (
            <button onClick={loadReplies} className="btn-ghost text-[12px]">
              <ChevronDown size={12} className={`transition-transform ${showReplies ? 'rotate-180' : ''}`} />
              {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>

        {/* Nested replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-3 pl-3 border-l border-ink/10 flex flex-col gap-3">
            {replies.map(r => (
              <div key={r.id} className="flex gap-2">
                <Avatar profile={{ username: r.username, display_name: r.display_name, avatar_url: r.avatar_url, avatar_color: r.avatar_color }} size={22} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-medium">{r.username}</span>
                    <span className="text-[11px] text-ink-faint">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">{r.body}</p>
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="mt-2 max-w-[200px] rounded-px border border-ink/10" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentSkeleton() {
  return (
    <div className="py-4 flex gap-3 animate-pulse">
      <div className="w-7 h-7 rounded-full bg-ink/8 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-24 bg-ink/8 rounded" />
        <div className="h-3 w-full bg-ink/6 rounded" />
        <div className="h-3 w-2/3 bg-ink/5 rounded" />
      </div>
    </div>
  )
}