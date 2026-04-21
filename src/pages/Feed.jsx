import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, TrendingUp, Clock, Sparkles } from 'lucide-react'
import { fetchWonders, fetchTrending } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import WonderCard from '../components/WonderCard'
import WonderModal from '../components/WonderModal'
import SubmitWonderModal from '../components/SubmitWonderModal'
import CategoryPill from '../components/CategoryPill'

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

// Skeleton card
function WonderSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-ink/8 rounded-full" />
        <div className="h-3 w-14 bg-ink/6 rounded" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 w-full bg-ink/8 rounded" />
        <div className="h-4 w-5/6 bg-ink/7 rounded" />
        <div className="h-4 w-4/6 bg-ink/6 rounded" />
      </div>
      <div className="h-3 w-full bg-ink/5 rounded" />
      <div className="h-3 w-2/3 bg-ink/5 rounded" />
      <div className="flex items-center justify-between pt-2 border-t border-ink/8">
        <div className="h-3 w-20 bg-ink/6 rounded" />
        <div className="h-3 w-16 bg-ink/6 rounded" />
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

  // Reset and fetch when filters change
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

  // Infinite scroll via IntersectionObserver
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

  // Split first item as featured if on latest + no category filter
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
            <button
              onClick={() => setShowSubmit(true)}
              className="btn-primary self-start sm:self-auto"
            >
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
            {Array.from({ length: 6 }).map((_, i) => <WonderSkeleton key={i} />)}
          </div>
        ) : wonders.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-[22px] text-ink-muted italic mb-3">Nothing here yet.</p>
            <p className="text-[14px] text-ink-faint">
              {category ? 'Try a different category, or check back soon.' : 'Be the first to submit a wonder.'}
            </p>
          </div>
        ) : (
          <>
            {/* Featured card */}
            {featured && (
              <div className="mb-px border border-ink/10 border-b-0">
                <WonderCard
                  wonder={featured}
                  featured
                  onCommentClick={setActiveWonder}
                />
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10 border-t-0">
              {rest.map(w => (
                <WonderCard
                  key={w.id}
                  wonder={w}
                  onCommentClick={setActiveWonder}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Infinite scroll sentinel ── */}
        <div ref={loaderRef} className="py-6 flex justify-center">
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