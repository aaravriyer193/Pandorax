import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, ExternalLink, Share2 } from 'lucide-react'
import { useLike } from '../hooks/useLike'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Avatar } from './Nav'
import CategoryPill from './CategoryPill'
import toast from 'react-hot-toast'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n
}

export default function WonderCard({ wonder, featured = false, onCommentClick }) {
  const { session } = useAuth()
  const { liked, count, toggle } = useLike(wonder.id, 'wonder', wonder.like_count)
  const [bookmarked, setBookmarked] = useState(false)

  async function handleBookmark() {
    if (!session) { toast('Sign in to bookmark ✦'); return }
    if (bookmarked) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', session.user.id).eq('target_id', wonder.id).eq('target_type', 'wonder')
      setBookmarked(false)
      toast('Removed from bookmarks')
    } else {
      await supabase.from('bookmarks').insert({ user_id: session.user.id, target_id: wonder.id, target_type: 'wonder' })
      setBookmarked(true)
      toast('Bookmarked ✦')
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.origin + '/wonders/' + wonder.id)
    toast('Link copied ✦')
  }

  if (featured) return <FeaturedCard wonder={wonder} liked={liked} count={count} toggle={toggle} onCommentClick={onCommentClick} />

  return (
    <article className="card card-hover group flex flex-col">

      {/* Image */}
      {wonder.image_url && (
        <div className="overflow-hidden aspect-[16/9]">
          <img
            src={wonder.image_url}
            alt={wonder.image_caption ?? wonder.headline}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Category */}
        <div className="flex items-center justify-between">
          <CategoryPill
            slug={wonder.category_slug}
            label={wonder.category_label}
            emoji={wonder.category_emoji}
            color={wonder.category_color}
            size="xs"
          />
          <span className="text-[11px] text-ink-faint">{timeAgo(wonder.published_at)}</span>
        </div>

        {/* Headline */}
        <h3 className="font-serif font-medium text-[17px] leading-[1.3] tracking-tight">
          {wonder.headline}
        </h3>

        {/* Body preview */}
        {wonder.body && (
          <p className="text-[13px] text-ink-muted leading-relaxed line-clamp-3">
            {wonder.body}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-ink/8">
          {/* Author */}
          <div className="flex items-center gap-2">
            {wonder.author_id ? (
              <Link to={`/u/${wonder.username}`} className="flex items-center gap-1.5 group/author">
                <Avatar profile={{ username: wonder.username, display_name: wonder.display_name, avatar_url: wonder.avatar_url, avatar_color: wonder.avatar_color }} size={20} />
                <span className="text-[12px] text-ink-muted group-hover/author:text-ink transition-colors">
                  {wonder.username}
                </span>
              </Link>
            ) : wonder.source_name ? (
              <span className="text-[12px] text-ink-faint">{wonder.source_name}</span>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {wonder.external_url && (
              <a
                href={wonder.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={13} />
              </a>
            )}
            <button onClick={handleShare} className="btn-ghost">
              <Share2 size={13} />
            </button>
            <button onClick={handleBookmark} className={`btn-ghost ${bookmarked ? 'text-accent-gold' : ''}`}>
              <Bookmark size={13} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            {onCommentClick && (
              <button onClick={() => onCommentClick(wonder)} className="btn-ghost">
                <MessageCircle size={13} />
                <span className="text-[12px]">{fmtNum(wonder.comment_count)}</span>
              </button>
            )}
            <button
              onClick={toggle}
              className={`btn-ghost transition-colors ${liked ? 'text-accent-coral' : ''}`}
            >
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-[12px]">{fmtNum(count)}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Featured card variant (dark, large) ──────────────────────
function FeaturedCard({ wonder, liked, count, toggle, onCommentClick }) {
  return (
    <article className="bg-ink text-beige group relative overflow-hidden flex flex-col">
      {wonder.image_url && (
        <div className="overflow-hidden aspect-[16/7] sm:aspect-[21/9]">
          <img
            src={wonder.image_url}
            alt={wonder.image_caption ?? wonder.headline}
            className="w-full h-full object-cover opacity-40 transition-all duration-500 group-hover:opacity-50 group-hover:scale-[1.02]"
          />
        </div>
      )}

      <div className={`p-6 sm:p-8 flex flex-col gap-4 flex-1 ${wonder.image_url ? 'absolute inset-0 justify-end' : ''}`}>
        <CategoryPill
          slug={wonder.category_slug}
          label={wonder.category_label}
          emoji={wonder.category_emoji}
          color={wonder.category_color}
          size="xs"
        />

        <h2 className="font-serif font-medium text-[22px] sm:text-[28px] leading-[1.2] tracking-tight text-beige max-w-[28ch]">
          {wonder.headline}
        </h2>

        {wonder.body && (
          <p className="text-[13px] text-beige/55 leading-relaxed line-clamp-2 max-w-prose">
            {wonder.body}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-beige/40">
            {wonder.source_name && <span>{wonder.source_name}</span>}
            <span>·</span>
            <span>{timeAgo(wonder.published_at)}</span>
          </div>
          <div className="flex items-center gap-4">
            {onCommentClick && (
              <button onClick={() => onCommentClick(wonder)} className="flex items-center gap-1.5 text-beige/40 hover:text-beige/70 transition-colors">
                <MessageCircle size={14} />
                <span className="text-[12px]">{fmtNum(wonder.comment_count)}</span>
              </button>
            )}
            <button
              onClick={toggle}
              className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-accent-coral' : 'text-beige/40 hover:text-beige/70'}`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-[12px]">{fmtNum(count)}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}