import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, ExternalLink, Share2, Plus, TrendingUp, Clock } from 'lucide-react'
import { useLike } from '../hooks/useLike'
import { useAuth } from '../hooks/useAuth'
import { supabase, fetchWonders, fetchTrending } from '../lib/supabase'
import { Avatar } from '../components/Nav' 
import CategoryPill from '../components/CategoryPill'
import WonderModal from '../components/WonderModal' 
import SubmitWonderModal from '../components/SubmitWonderModal'
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

// ── Standard Card (Image top on mobile, Image left on desktop) ──
export function WonderCard({ wonder, featured = false, onCommentClick }) {
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
    <article className="card card-hover group flex flex-col sm:flex-row overflow-hidden">
      {/* Image Container: Relative positioning fixes the aspect ratio stretching */}
      {wonder.image_url && (
        <div className="relative w-full aspect-[16/9] sm:aspect-auto sm:w-[40%] lg:w-[35%] flex-shrink-0 border-b sm:border-b-0 sm:border-r border-ink/10 overflow-hidden">
          <img
            src={wonder.image_url}
            alt={wonder.image_caption ?? wonder.headline}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}

      {/* Content Container */}
      <div className="flex-1 p-5 sm:p-6 lg:p-7 flex flex-col gap-3 min-w-0">
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

        <h3 className="font-serif font-medium text-[18px] sm:text-[20px] leading-[1.3] tracking-tight group-hover:text-accent-coral transition-colors">
          {wonder.headline}
        </h3>

        {wonder.body && (
          <p className="text-[13px] sm:text-[14px] text-ink-muted leading-relaxed line-clamp-3 sm:line-clamp-4">
            {wonder.body}
          </p>
        )}

        <div className="flex-1" />

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-ink/8">
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

          <div className="flex items-center gap-3">
            {wonder.external_url && (
              <a href={wonder.external_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" onClick={e => e.stopPropagation()}>
                <ExternalLink size={14} />
              </a>
            )}
            <button onClick={handleShare} className="btn-ghost"><Share2 size={14} /></button>
            <button onClick={handleBookmark} className={`btn-ghost ${bookmarked ? 'text-accent-gold' : ''}`}>
              <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            {onCommentClick && (
              <button onClick={() => onCommentClick(wonder)} className="btn-ghost">
                <MessageCircle size={14} />
                <span className="text-[12px]">{fmtNum(wonder.comment_count)}</span>
              </button>
            )}
            <button onClick={toggle} className={`btn-ghost transition-colors ${liked ? 'text-accent-coral' : ''}`}>
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-[12px]">{fmtNum(count)}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Featured card variant (dark, full width image background) ──
function FeaturedCard({ wonder, liked, count, toggle, onCommentClick }) {
  return (
    <article className="card bg-ink text-beige group relative overflow-hidden flex flex-col min-h-[350px] sm:min-h-[450px]">
      {wonder.image_url && (
        <>
          <img
            src={wonder.image_url}
            alt={wonder.image_caption ?? wonder.headline}
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-all duration-500 group-hover:opacity-50 group-hover:scale-[1.02]"
          />
          {/* Gradient to make text readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent pointer-events-none" />
        </>
      )}

      <div className="relative p-6 sm:p-8 flex flex-col gap-4 flex-1 justify-end z-10">
        <div>
          <CategoryPill
            slug={wonder.category_slug}
            label={wonder.category_label}
            emoji={wonder.category_emoji}
            color={wonder.category_color}
            size="xs"
          />
        </div>

        <h2 className="font-serif font-medium text-[22px] sm:text-[32px] leading-[1.2] tracking-tight text-beige max-w-[32ch]">
          {wonder.headline}
        </h2>

        {wonder.body && (
          <p className="text-[14px] sm:text-[15px] text-beige/70 leading-relaxed line-clamp-2 max-w-prose">
            {wonder.body}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-4 border-t border-beige/10">
          <div className="flex items-center gap-2 text-[12px] text-beige/50">
            {wonder.source_name && <span>{wonder.source_name}</span>}
            <span>·</span>
            <span>{timeAgo(wonder.published_at)}</span>
          </div>
          <div className="flex items-center gap-4">
            {onCommentClick && (
              <button onClick={() => onCommentClick(wonder)} className="flex items-center gap-1.5 text-beige/50 hover:text-beige/90 transition-colors">
                <MessageCircle size={14} />
                <span className="text-[12px]">{fmtNum(wonder.comment_count)}</span>
              </button>
            )}
            <button onClick={toggle} className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-accent-coral' : 'text-beige/50 hover:text-beige/90'}`}>
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-[12px]">{fmtNum(count)}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

const CATEGORIES = [
  { slug: null,           label: 'All',          emoji: '✦' },
  { slug: 'space',        label: 'Space',         emoji: '🌌' },
  { slug: 'biology',      label: 'Biology',       emoji: '🧬' },
  { slug: 'psychology',   label: 'Psychology',    emoji: '🧠' },
  { slug: 'mathematics',  label: 'Mathematics',   emoji: '🔢' },
  { slug: 'ocean',        label: 'Ocean',         emoji: '🌊' },
  { slug: 'physics',      label: 'Physics',       emoji: '⚡' },
  { slug: 'history',      label: 'History',       emoji: '🏛' },
  { slug: 'philosophy',   label: 'Philosophy',    emoji: '🧩' },
  { slug: 'ecology',      label: 'Ecology',       emoji: '🌿' },
]

const SORT_OPTIONS = [
  { key: 'latest',   label: 'Latest',   icon: Clock },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
]

// Skeleton card matched to the new horizontal/vertical absolute layout
function WonderSkeleton() {
  return (
    <div className="card flex flex-col sm:flex-row overflow-hidden animate-pulse">
      <div className="relative w-full aspect-[16/9] sm:aspect-auto sm:w-[40%] lg:w-[35%] bg-ink/8 border-b sm:border-b-0 sm:border-r border-ink/10 flex-shrink-0" />
      <div className="flex-1 p-5 sm:p-6 lg:p-7 flex flex-col gap-3 min-w-0">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-ink/8 rounded-full" />
          <div className="h-3 w-14 bg-ink/6 rounded" />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="h-5 w-full bg-ink/8 rounded" />
          <div className="h-5 w-5/6 bg-ink/7 rounded" />
        </div>
        <div className="h-3 w-full bg-ink/5 rounded mt-2" />
        <div className="h-3 w-2/3 bg-ink/5 rounded" />
        <div className="flex-1 min-h-[1.5rem]" />
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-ink/8">
          <div className="h-3 w-20 bg-ink/6 rounded" />
          <div className="h-3 w-32 bg-ink/6 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function Feed() {
  const { session }             = useAuth()
  const [wonders, setWonders]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setMore]  = useState(false)
  const [hasMore, setHasMore]   = useState(true)
  const [page, setPage]         = useState(0)
  const [category, setCategory] = useState(null)
  const [sort, setSort]         = useState('latest')
  const [activeWonder, setActiveWonder] = useState(null)
  const [showSubmit, setShowSubmit]     = useState(false)
  const loaderRef = useRef(null)
  const PAGE_SIZE = 20

  useEffect(() => {
    setWonders([])
    setPage(0)
    setHasMore(true)
    loadWonders(0, true)
  }, [category, sort])

  async function loadWonders(pageNum, reset = false) {
    if (reset) setLoading(true)
    else setMore(true)

    try {
      let data
      if (sort === 'trending') {
        data = await fetchTrending({ limit: PAGE_SIZE, offset: pageNum * PAGE_SIZE })
      } else {
        data = await fetchWonders({ page: pageNum, limit: PAGE_SIZE, category })
      }

      if (data.length < PAGE_SIZE) setHasMore(false)
      setWonders(prev => reset ? data : [...prev, ...data])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    loadWonders(nextPage)
  }, [page, loadingMore, hasMore, category, sort])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const featured = (!category && sort === 'latest' && wonders.length > 0) ? wonders[0] : null
  const rest      = featured ? wonders.slice(1) : wonders

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Page header ── */}
        <div className="py-8 sm:py-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="label mb-2">The Feed</p>
            <h1 className="font-serif font-medium text-[32px] sm:text-[42px] leading-tight tracking-tight">
              Today's <em className="text-accent-coral">wonders</em>
            </h1>
          </div>
          {session && (
            <button onClick={() => setShowSubmit(true)} className="btn-primary self-start sm:self-auto">
              <Plus size={15} /> Submit a Wonder
            </button>
          )}
        </div>

        {/* ── Sort tabs ── */}
        <div className="flex items-center gap-1 mb-4 border-b border-ink/10 pb-0">
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-all border-b-2 -mb-px ${
                sort === key
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ── Category filter strip ── */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug ?? 'all'}
              onClick={() => setCategory(cat.slug)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all ${
                category === cat.slug
                  ? 'bg-ink text-beige border-ink'
                  : 'border-ink/15 text-ink-muted hover:border-ink/35 hover:text-ink'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => <WonderSkeleton key={i} />)}
          </div>
        ) : wonders.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-[22px] text-ink-muted italic mb-3">Nothing here yet.</p>
            <p className="text-[14px] text-ink-faint">
              {category ? 'Try a different category, or check back soon.' : 'Be the first to submit a wonder.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Featured card */}
            {featured && (
              <WonderCard
                wonder={featured}
                featured
                onCommentClick={setActiveWonder}
              />
            )}

            {/* List */}
            {rest.map(w => (
              <WonderCard
                key={w.id}
                wonder={w}
                onCommentClick={setActiveWonder}
              />
            ))}
          </div>
        )}

        {/* ── Infinite scroll sentinel ── */}
        <div ref={loaderRef} className="py-8 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-ink-faint text-[13px]">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Loading more
            </div>
          )}
          {!hasMore && wonders.length > 0 && (
            <p className="text-[12px] text-ink-faint italic font-serif">You've reached the end ✦</p>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {activeWonder && (
        <WonderModal wonder={activeWonder} onClose={() => setActiveWonder(null)} />
      )}
      {showSubmit && (
        <SubmitWonderModal onClose={() => setShowSubmit(false)} />
      )}
    </div>
  )
}