import { useEffect } from 'react'
import { X, ExternalLink, Heart, Share2, Bookmark } from 'lucide-react'
import { useLike } from '../hooks/useLike'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Nav'
import CategoryPill from './CategoryPill'
import CommentSection from './CommentSection'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (hours < 1)  return 'just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n
}

export default function WonderModal({ wonder, onClose }) {
  const { session } = useAuth()
  const { liked, count, toggle } = useLike(wonder?.id, 'wonder', wonder?.like_count)

  // Trap scroll + handle Escape
  useEffect(() => {
    if (!wonder) return
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)

    // Increment view count
    if (wonder?.id) {
      supabase.rpc('increment_view', { p_id: wonder.id, p_type: 'wonder' }).then(() => {})
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [wonder])

  if (!wonder) return null

  function handleShare() {
    navigator.clipboard.writeText(`${window.location.origin}/wonders/${wonder.id}`)
    toast('Link copied ✦')
  }

  async function handleBookmark() {
    if (!session) { toast('Sign in to bookmark'); return }
    await supabase.from('bookmarks').insert({
      user_id: session.user.id, target_id: wonder.id, target_type: 'wonder',
    }).then(({ error }) => {
      if (error?.code === '23505') toast('Already bookmarked')
      else toast('Bookmarked ✦')
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet — slides up on mobile, centered on desktop */}
      <div className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6">
        <div className="
          bg-beige w-full md:max-w-2xl md:rounded-px
          max-h-[92vh] md:max-h-[85vh]
          flex flex-col
          shadow-2xl
          rounded-t-[12px] md:rounded-px
          animate-[slideUp_0.28s_ease]
          md:animate-[fadeScale_0.22s_ease]
        ">
          {/* Drag handle (mobile only) */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 bg-ink/15 rounded-full" />
          </div>

          {/* Close button */}
          <div className="flex items-center justify-between px-5 pt-3 pb-0 md:pt-5">
            <CategoryPill
              slug={wonder.category_slug}
              label={wonder.category_label}
              emoji={wonder.category_emoji}
              color={wonder.category_color}
              size="xs"
            />
            <button onClick={onClose} className="btn-ghost p-1">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-5 pb-6 pt-4">

            {/* Headline */}
            <h2 className="font-serif font-medium text-[22px] sm:text-[26px] leading-[1.2] tracking-tight mb-4">
              {wonder.headline}
            </h2>

            {/* Image */}
            {wonder.image_url && (
              <div className="mb-5 overflow-hidden rounded-px border border-ink/10">
                <img
                  src={wonder.image_url}
                  alt={wonder.image_caption ?? wonder.headline}
                  className="w-full object-cover max-h-72"
                />
                {wonder.image_caption && (
                  <p className="text-[11px] text-ink-faint px-3 py-2 italic">{wonder.image_caption}</p>
                )}
              </div>
            )}

            {/* Body */}
            {wonder.body && (
              <p className="text-[15px] text-ink leading-[1.75] mb-5">
                {wonder.body}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 border-y border-ink/10 mb-5">
              {/* Author */}
              {wonder.author_id ? (
                <div className="flex items-center gap-2">
                  <Avatar profile={{ username: wonder.username, display_name: wonder.display_name, avatar_url: wonder.avatar_url, avatar_color: wonder.avatar_color }} size={22} />
                  <span className="text-[13px] text-ink-muted">{wonder.username}</span>
                </div>
              ) : wonder.source_name ? (
                <span className="text-[13px] text-ink-muted">{wonder.source_name}</span>
              ) : null}

              <span className="text-[12px] text-ink-faint">{timeAgo(wonder.published_at)}</span>

              <div className="ml-auto flex items-center gap-3">
                {wonder.external_url && (
                  <a href={wonder.external_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-[12px]">
                    <ExternalLink size={13} /> Source
                  </a>
                )}
                <button onClick={handleShare} className="btn-ghost text-[12px]">
                  <Share2 size={13} />
                </button>
                <button onClick={handleBookmark} className="btn-ghost text-[12px]">
                  <Bookmark size={13} />
                </button>
                <button
                  onClick={toggle}
                  className={`btn-ghost text-[12px] transition-colors ${liked ? 'text-accent-coral' : ''}`}
                >
                  <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                  <span>{fmtNum(count)}</span>
                </button>
              </div>
            </div>

            {/* Comments */}
            <CommentSection
              targetId={wonder.id}
              targetType="wonder"
              initialCount={wonder.comment_count}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}