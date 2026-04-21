import { useState, useEffect } from 'react'
import { Heart, MessageCircle, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLike } from '../hooks/useLike'
import { useAuth } from '../hooks/useAuth'
import CommentSection from '../components/CommentSection'
import CategoryPill from '../components/CategoryPill'
import toast from 'react-hot-toast'

function fmtNum(n) {
  if (!n) return 0
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n
}

// Generate last N days for calendar
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().split('T')[0]
  })
}

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(iso) {
  const d = new Date(iso)
  return `${DAY_LABELS[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

export default function SimulationsPage() {
  const { session }             = useAuth()
  const today                   = new Date().toISOString().split('T')[0]
  const [selectedDate, setDate] = useState(today)
  const [sim, setSim]           = useState(null)
  const [htmlContent, setHtmlContent] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [fullscreen, setFull]   = useState(false)
  const days                    = lastNDays(14)

  useEffect(() => {
    fetchSim(selectedDate)
  }, [selectedDate])

  // Track views separately once the sim is loaded
  useEffect(() => {
    if (sim?.id) supabase.rpc('increment_view', { p_id: sim.id, p_type: 'simulation' })
  }, [sim?.id])

  async function fetchSim(date) {
    setLoading(true)
    setSim(null)
    setHtmlContent(null)
    
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('sim_date', date)
      .single()
      
    if (!error && data) {
      setSim(data)
      setLoading(false) // Show the layout immediately
      
      // Fetch the raw HTML to prevent the browser from downloading it as a file
      if (data.html_url) {
        try {
          const res = await fetch(data.html_url)
          const text = await res.text()
          setHtmlContent(text)
        } catch (e) {
          console.error('Failed to fetch sim HTML:', e)
          toast.error('Failed to load simulation engine')
        }
      }
    } else {
      setLoading(false)
    }
  }

  function prevDay() {
    const idx = days.indexOf(selectedDate)
    if (idx > 0) setDate(days[idx - 1])
  }

  function nextDay() {
    const idx = days.indexOf(selectedDate)
    if (idx < days.length - 1 && days[idx + 1] <= today) setDate(days[idx + 1])
  }

  const { liked, count, toggle } = useLike(sim?.id, 'simulation', sim?.like_count)

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Header ── */}
        <div className="mb-8 sm:mb-12">
          <p className="label mb-2">Daily Simulations</p>
          <h1 className="font-serif font-medium text-[32px] sm:text-[42px] leading-tight tracking-tight">
            Play with <em className="text-accent-gold">reality</em>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-ink-muted mt-3 max-w-[52ch] leading-relaxed">
            One new hand-crafted simulation drops every day. Explore it, break it, come back tomorrow.
          </p>
        </div>

        {/* ── Calendar strip ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={prevDay} className="btn-ghost p-1">
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13px] text-ink-muted font-medium">{formatDate(selectedDate)}</span>
            <button
              onClick={nextDay}
              disabled={selectedDate >= today}
              className="btn-ghost p-1 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {days.map(d => {
              const isToday    = d === today
              const isSelected = d === selectedDate
              const isFuture   = d > today
              const date       = new Date(d)
              return (
                <button
                  key={d}
                  onClick={() => !isFuture && setDate(d)}
                  disabled={isFuture}
                  className={`flex-shrink-0 w-12 sm:w-14 flex flex-col items-center py-2 border rounded-px transition-all text-center
                    ${isSelected
                      ? 'border-ink bg-ink text-beige'
                      : isFuture
                      ? 'border-ink/8 text-ink-faint opacity-30 cursor-not-allowed'
                      : 'border-ink/12 text-ink-muted hover:border-ink/30 hover:text-ink cursor-pointer'
                    }
                  `}
                >
                  <span className="text-[9px] uppercase tracking-wider opacity-70">
                    {DAY_LABELS[date.getDay()]}
                  </span>
                  <span className="text-[14px] font-medium mt-0.5">{date.getDate()}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-accent-gold mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Main content ── */}
        {loading ? (
          <SimSkeleton />
        ) : sim ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">

            {/* Sim embed */}
            <div className="flex flex-col gap-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sim.category_slug && (
                    <CategoryPill
                      slug={sim.category_slug}
                      size="xs"
                    />
                  )}
                  <h2 className="font-serif font-medium text-[18px] sm:text-[22px] tracking-tight">
                    {sim.title}
                  </h2>
                </div>
                <button
                  onClick={() => setFull(true)}
                  className="btn-ghost text-[12px]"
                  title="Fullscreen"
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              {/* iframe via srcDoc */}
              <div
                className="w-full border border-ink/12 bg-beige-mid overflow-hidden relative"
                style={{ aspectRatio: '16/10' }}
              >
                {htmlContent ? (
                  <iframe
                    srcDoc={htmlContent}
                    title={sim.title}
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/5">
                    <span className="text-[13px] text-ink-muted font-serif italic animate-pulse">
                      Initializing simulation engine...
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {sim.description && (
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  {sim.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t border-ink/10">
                <button
                  onClick={toggle}
                  className={`flex items-center gap-1.5 text-[13px] transition-colors ${liked ? 'text-accent-coral' : 'text-ink-muted hover:text-ink'}`}
                >
                  <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                  <span>{fmtNum(count)}</span>
                </button>
                <div className="flex items-center gap-1.5 text-[13px] text-ink-muted">
                  <MessageCircle size={15} />
                  <span>{fmtNum(sim.comment_count)}</span>
                </div>
                <span className="ml-auto text-[12px] text-ink-faint">
                  {sim.view_count?.toLocaleString() ?? 0} views
                </span>
              </div>
            </div>

            {/* Comments sidebar */}
            <div className="lg:border-l lg:border-ink/10 lg:pl-6">
              <CommentSection
                targetId={sim.id}
                targetType="simulation"
                initialCount={sim.comment_count}
              />
            </div>
          </div>
        ) : (
          <NoSimDay date={selectedDate} today={today} />
        )}
      </div>

      {/* ── Fullscreen overlay ── */}
      {fullscreen && sim && (
        <>
          <div className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige/10">
              <span className="font-serif text-beige text-[16px]">{sim.title}</span>
              <button
                onClick={() => setFull(false)}
                className="text-beige/60 hover:text-beige transition-colors text-[13px] flex items-center gap-1.5"
              >
                Exit fullscreen
              </button>
            </div>
            {htmlContent ? (
              <iframe
                srcDoc={htmlContent}
                title={sim.title}
                className="flex-1 border-0 w-full bg-ink"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-beige/60">Loading...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function NoSimDay({ date, today }) {
  const isToday = date === today
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 opacity-20">
        <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
          <path d="M40 8C22.3 8 8 22.3 8 40s14.3 32 32 32 32-14.3 32-32S57.7 8 40 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M40 18c-12.2 0-22 9.8-22 22s9.8 22 22 22 22-9.8 22-22-9.8-22-22-22z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <circle cx="40" cy="40" r="5" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
      <h3 className="font-serif text-[22px] font-medium text-ink-muted italic mb-2">
        {isToday ? "Today's simulation is coming..." : 'No simulation this day'}
      </h3>
      <p className="text-[14px] text-ink-faint max-w-[36ch]">
        {isToday
          ? 'Check back later — simulations drop daily.'
          : 'We were just getting started. New sims every day from here on.'}
      </p>
    </div>
  )
}

function SimSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="h-5 w-48 bg-ink/8 rounded" />
        <div className="w-full bg-ink/6 rounded-px" style={{ aspectRatio: '16/10' }} />
        <div className="h-3 w-full bg-ink/6 rounded" />
        <div className="h-3 w-2/3 bg-ink/5 rounded" />
      </div>
      <div className="hidden lg:flex flex-col gap-3 border-l border-ink/10 pl-6">
        {Array.from({length:4}).map((_,i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-ink/8 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-24 bg-ink/8 rounded" />
              <div className="h-3 w-full bg-ink/6 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}