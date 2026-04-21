import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// ── Scatter icons (SVGs inline as components) ────────────────
function Ammonite({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none">
      <path d="M40 8C22.3 8 8 22.3 8 40s14.3 32 32 32 32-14.3 32-32S57.7 8 40 8z" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M40 18c-12.2 0-22 9.8-22 22s9.8 22 22 22 22-9.8 22-22-9.8-22-22-22z" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7"/>
      <path d="M40 28c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12z" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
      <circle cx="40" cy="40" r="4" fill="currentColor" opacity="0.3"/>
    </svg>
  )
}
function EyeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 60" fill="none">
      <path d="M5 30 Q25 5 50 5 Q75 5 95 30 Q75 55 50 55 Q25 55 5 30z" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="50" cy="30" r="14" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7"/>
      <circle cx="50" cy="30" r="7" fill="currentColor" opacity="0.2"/>
      <circle cx="54" cy="26" r="2.5" fill="currentColor" opacity="0.3"/>
    </svg>
  )
}
function AtomIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="5" fill="currentColor" opacity="0.3"/>
      <ellipse cx="45" cy="45" rx="38" ry="15" stroke="currentColor" strokeWidth="0.8" fill="none"/>
      <ellipse cx="45" cy="45" rx="38" ry="15" stroke="currentColor" strokeWidth="0.8" fill="none" transform="rotate(60 45 45)"/>
      <ellipse cx="45" cy="45" rx="38" ry="15" stroke="currentColor" strokeWidth="0.8" fill="none" transform="rotate(120 45 45)"/>
    </svg>
  )
}
function LeafIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 60 80" fill="none">
      <path d="M30 75 C30 75 8 55 8 30 C8 12 18 5 30 5 C42 5 52 12 52 30 C52 55 30 75 30 75Z" stroke="currentColor" strokeWidth="1" fill="none"/>
      <line x1="30" y1="75" x2="30" y2="5" stroke="currentColor" strokeWidth="0.8"/>
      <line x1="30" y1="35" x2="18" y2="22" stroke="currentColor" strokeWidth="0.6" opacity="0.7"/>
      <line x1="30" y1="45" x2="44" y2="32" stroke="currentColor" strokeWidth="0.6" opacity="0.7"/>
      <line x1="30" y1="55" x2="16" y2="45" stroke="currentColor" strokeWidth="0.6" opacity="0.5"/>
    </svg>
  )
}
function SpiralIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none">
      <path d="M40 40 Q40 10 70 10 Q70 70 10 70 Q10 30 40 30 Q40 50 55 50 Q55 25 25 25 Q25 55 50 55"
        stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ── Ticker data ──────────────────────────────────────────────
const TICKERS = [
  'Marine biologists discover octopuses dream in colour',
  'A star 2,000 light-years away just sent us a repeating signal',
  'Physicists confirm time moves slower near the mass of a coffee cup',
  'New fungal network found spanning 2,400 acres underground',
  'Dolphins have been documented calling each other by name',
  'Roman concrete self-heals using 2,000-year-old chemistry',
  'A 13-sided shape tiles infinitely without ever repeating',
]

// ── Wonder preview cards ─────────────────────────────────────
const PREVIEW_WONDERS = [
  {
    tag: 'Space', color: '#4A5580', emoji: '🌌',
    headline: 'James Webb captures a planet where it rains iron — sideways',
    ago: '12 min ago', likes: '2.4k', featured: true,
  },
  {
    tag: 'Biology', color: '#4A7C59', emoji: '🧬',
    headline: 'Plants can hear caterpillars chewing and boost their defences',
    ago: '34 min ago', likes: '847',
  },
  {
    tag: 'Psychology', color: '#D4604A', emoji: '🧠',
    headline: 'Your brain replays your day in fast-forward while you blink',
    ago: '1hr ago', likes: '1.1k',
  },
  {
    tag: 'Mathematics', color: '#4A5580', emoji: '🔢',
    headline: 'A 13-sided shape tiles a plane infinitely without repeating',
    ago: '2hrs ago', likes: '3.2k',
  },
  {
    tag: 'History', color: '#B85C38', emoji: '🏛',
    headline: 'Roman concrete gets stronger over centuries — scientists know why',
    ago: '3hrs ago', likes: '2.7k',
  },
]

const CATEGORY_TAGS = [
  { emoji: '🌌', label: 'Space' },
  { emoji: '🧬', label: 'Biology' },
  { emoji: '🧠', label: 'Psychology' },
  { emoji: '🔢', label: 'Mathematics' },
  { emoji: '⚡', label: 'Physics' },
  { emoji: '🌊', label: 'Ocean' },
  { emoji: '🏛', label: 'History' },
  { emoji: '🌿', label: 'Ecology' },
  { emoji: '🧩', label: 'Philosophy' },
  { emoji: '💡', label: 'Invention' },
]

export default function Landing() {
  const { session, profile, signInWithGoogle } = useAuth()
  const canvasRef = useRef(null)

  // Sim boids canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const boids = Array.from({ length: 80 }, () => {
      const a = Math.random() * Math.PI * 2
      const s = 1 + Math.random() * 1.2
      return { x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: Math.cos(a) * s, vy: Math.sin(a) * s }
    })

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const b of boids) {
        let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, sn = 0, an = 0
        for (const o of boids) {
          if (o === b) continue
          const dx = o.x - b.x, dy = o.y - b.y, d = Math.sqrt(dx * dx + dy * dy)
          if (d < 26 && d > 0) { sx -= dx / d; sy -= dy / d; sn++ }
          if (d < 55) { ax += o.vx; ay += o.vy; an++; cx += o.x; cy += o.y }
        }
        if (sn) { b.vx += sx / sn * 0.09; b.vy += sy / sn * 0.09 }
        if (an) { b.vx += (ax / an - b.vx) * 0.04; b.vy += (ay / an - b.vy) * 0.04; b.vx += (cx / an - b.x) * 0.001; b.vy += (cy / an - b.y) * 0.001 }
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
        if (spd > 2.4) { b.vx = b.vx / spd * 2.4; b.vy = b.vy / spd * 2.4 }
        if (spd < 0.8 && spd > 0) { b.vx = b.vx / spd * 0.8; b.vy = b.vy / spd * 0.8 }
        b.x = (b.x + b.vx + canvas.width) % canvas.width
        b.y = (b.y + b.vy + canvas.height) % canvas.height

        const angle = Math.atan2(b.vy, b.vx)
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(angle)
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 2.5); ctx.lineTo(-3, 0); ctx.lineTo(-4, -2.5); ctx.closePath()
        ctx.fillStyle = 'rgba(242,237,227,0.5)'; ctx.fill(); ctx.restore()
      }
      raf = requestAnimationFrame(step)
    }
    step()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return (
    <div className="min-h-screen">

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-0 overflow-hidden">

        {/* Scattered icons — hidden on very small screens */}
        <Ammonite  className="scatter-icon text-ink w-16 sm:w-20 top-[12%] left-[4%] sm:left-[6%]" />
        <EyeIcon   className="scatter-icon text-ink w-20 sm:w-24 top-[8%] right-[4%] sm:right-[7%]" />
        <LeafIcon  className="scatter-icon text-ink w-12 sm:w-16 top-[38%] left-[2%] sm:left-[3%] hidden sm:block" />
        <AtomIcon  className="scatter-icon text-ink w-16 sm:w-20 top-[32%] right-[2%] sm:right-[4%]" />
        <SpiralIcon className="scatter-icon text-ink w-14 sm:w-18 bottom-[22%] right-[4%] sm:right-[5%] hidden sm:block" />

        <p className="label mb-5 rise">A place for the deeply curious</p>

        <h1 className="font-serif font-medium text-[44px] sm:text-[64px] md:text-[80px] lg:text-[96px] leading-[1.0] tracking-[-0.03em] max-w-[12ch] rise delay-200">
          The world is{' '}
          <em className="not-italic text-accent-gold">stranger</em>{' '}
          than you think
        </h1>

        <p className="mt-6 text-[15px] sm:text-[17px] text-ink-muted max-w-[42ch] leading-relaxed font-light rise delay-300">
          Pandorax is a daily feed of the most astonishing discoveries, simulations, and ideas — curated for people who can't stop wondering.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 rise delay-400">
          {session ? (
            <Link to="/feed" className="btn-primary w-full sm:w-auto justify-center">
              Go to your feed →
            </Link>
          ) : (
            <>
              <button onClick={signInWithGoogle} className="btn-primary w-full sm:w-auto justify-center gap-3">
                <GoogleIcon />
                Continue with Google
              </button>
              <Link to="/feed" className="btn-ghost text-[14px]">
                Browse without signing in ↓
              </Link>
            </>
          )}
        </div>

        {/* Ticker */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-ink/10 bg-ink/[0.03] py-3 overflow-hidden">
          <div className="flex whitespace-nowrap ticker-scroll">
            {[...TICKERS, ...TICKERS].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2.5 px-8 text-[12px] text-ink-muted">
                <span className="w-1 h-1 rounded-full bg-ink-faint flex-shrink-0" />
                <strong className="text-ink font-medium">{t}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WONDERS PREVIEW ────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="label mb-3">The Feed</p>
            <h2 className="font-serif font-medium text-[32px] sm:text-[44px] leading-[1.1] tracking-tight">
              Today's <em className="text-accent-coral">wonders</em>
            </h2>
          </div>
          <p className="text-[14px] text-ink-muted max-w-[38ch] sm:text-right leading-relaxed">
            The most surprising, beautiful, and mind-bending discoveries — updated constantly.
          </p>
        </div>

        {/* Grid — 1 col on mobile, 2 on sm, 3 on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border border-ink/10 divide-y sm:divide-y-0 divide-ink/10">
          {PREVIEW_WONDERS.map((w, i) => (
            <PreviewCard key={i} w={w} span={w.featured && 'sm:col-span-2'} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/feed" className="btn-outline">See all wonders →</Link>
        </div>
      </section>

      {/* ── SIMULATIONS ────────────────────────────────── */}
      <section className="bg-ink text-beige py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        {/* paper texture on dark bg */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '300px' }} />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="label text-beige/40 mb-4">Daily Simulations</p>
            <h2 className="font-serif font-medium text-[32px] sm:text-[44px] leading-[1.1] tracking-tight text-beige mb-5">
              Play with <em className="text-accent-gold">reality</em>
            </h2>
            <p className="text-[14px] sm:text-[15px] text-beige/55 leading-relaxed mb-8 max-w-[42ch]">
              Every day, one new hand-crafted interactive simulation drops. Explore a living ecosystem, a physics sandbox, a cellular automaton — then come back tomorrow.
            </p>

            {/* Calendar strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['Mon 14','Tue 15','Wed 16','Thu 17','Fri 18','Sat 19'].map((d, i) => (
                <button
                  key={d}
                  className={`flex-shrink-0 w-12 h-12 border rounded-px text-center transition-all ${
                    i === 3
                      ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                      : i > 3
                      ? 'border-beige/10 text-beige/20 cursor-not-allowed'
                      : 'border-beige/12 text-beige/40 hover:border-beige/30'
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-wider">{d.split(' ')[0]}</div>
                  <div className="text-[13px] font-medium">{d.split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sim canvas */}
          <div className="border border-beige/10 rounded-px overflow-hidden relative" style={{ aspectRatio: '16/10' }}>
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute bottom-0 left-0 right-0 px-5 py-4"
              style={{ background: 'linear-gradient(transparent, rgba(26,23,20,0.85))' }}>
              <div className="font-serif text-[15px] text-beige">Murmuration — Starling Flocking Behaviour</div>
              <div className="text-[11px] text-beige/40 mt-0.5">Today's simulation · Live preview</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORUMS PREVIEW ─────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="label mb-4">Forums</p>
            <h2 className="font-serif font-medium text-[32px] sm:text-[44px] leading-[1.1] tracking-tight mb-5">
              The rabbit hole{' '}
              <em className="text-accent-green">goes deeper</em>
            </h2>
            <p className="text-[14px] sm:text-[15px] text-ink-muted leading-relaxed mb-8 max-w-[42ch]">
              Start a thread, ask the impossible question, debate with people who find the same things wondrous that you do.
            </p>
            <Link to="/forums" className="btn-primary">Browse all threads →</Link>
          </div>

          <div className="flex flex-col border border-ink/10 divide-y divide-ink/10">
            {[
              { icon: '🌿', title: 'If trees communicate via fungal networks, do forests have a collective memory?', tag: 'Biology', replies: 143, likes: 892 },
              { icon: '🌌', title: 'What would a universe with different physical constants actually look like?', tag: 'Physics', replies: 89, likes: 654 },
              { icon: '🔺', title: 'The Voynich manuscript has never been decoded. My best theory after 3 years.', tag: 'History', replies: 211, likes: '1.4k' },
              { icon: '🧠', title: 'Why does music give some people chills but not others? The neuroscience.', tag: 'Psychology', replies: 67, likes: 445 },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4 hover:bg-beige-dark transition-colors cursor-pointer">
                <span className="text-[18px] mt-0.5 flex-shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-[14px] font-medium leading-snug text-ink">{t.title}</p>
                  <p className="text-[12px] text-ink-faint mt-1">{t.tag}</p>
                </div>
                <div className="flex-shrink-0 text-right text-[12px] text-ink-faint">
                  <div>{t.replies} replies</div>
                  <div>↑ {t.likes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY TAGS ──────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 border-t border-ink/8 bg-beige-mid">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-serif text-[22px] sm:text-[28px] font-medium tracking-tight mb-6">
            What draws you in?
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORY_TAGS.map(({ emoji, label }) => (
              <button key={label} className="tag-pill">
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────── */}
      <section className="py-20 sm:py-32 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="font-serif font-bold text-[18vw] text-transparent leading-none"
            style={{ WebkitTextStroke: '1px rgba(26,23,20,0.06)' }}>
            Pandorax
          </span>
        </div>

        <div className="relative">
          <h2 className="font-serif font-medium text-[36px] sm:text-[56px] md:text-[72px] leading-[1.0] tracking-[-0.03em] mb-6">
            The box is<br /><em className="text-accent-gold">already open</em>
          </h2>
          <p className="text-[15px] sm:text-[16px] text-ink-muted mb-10 max-w-[36ch] mx-auto leading-relaxed">
            Join the people who can't stop asking why. Free to use, forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {session ? (
              <Link to="/feed" className="btn-primary justify-center">
                Go to your feed →
              </Link>
            ) : (
              <>
                <button onClick={signInWithGoogle} className="btn-outline justify-center gap-3">
                  <GoogleIcon />
                  Sign up with Google
                </button>
                <Link to="/feed" className="btn-primary justify-center">
                  Browse as guest →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="border-t border-ink/10 px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-ink-faint">
        <span className="font-serif font-semibold text-[15px] text-ink">
          Pandora<span className="text-accent-gold">x</span>
        </span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-ink transition-colors">About</a>
          <a href="#" className="hover:text-ink transition-colors">Submit a Wonder</a>
          <a href="#" className="hover:text-ink transition-colors">Privacy</a>
        </div>
        <span className="font-serif italic">Stay curious.</span>
      </footer>
    </div>
  )
}

function PreviewCard({ w, span }) {
  return (
    <div className={`
      p-5 sm:p-6 border-r-0 sm:border-r border-ink/10 last:border-r-0 cursor-pointer
      transition-colors hover:bg-beige-dark relative overflow-hidden
      ${w.featured ? `bg-ink text-beige ${span}` : 'bg-beige'}
    `}>
      {/* tag */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: w.color }} />
        <span className="text-[10px] font-medium tracking-widest uppercase"
          style={{ color: w.featured ? 'rgba(242,237,227,0.55)' : w.color }}>
          {w.emoji} {w.tag}
        </span>
      </div>

      <h3 className={`font-serif font-medium leading-[1.3] tracking-tight mb-4 ${
        w.featured ? 'text-[20px] sm:text-[24px] text-beige' : 'text-[16px] text-ink'
      }`}>
        {w.headline}
      </h3>

      <div className="flex items-center justify-between mt-auto">
        <span className={`text-[11px] ${w.featured ? 'text-beige/40' : 'text-ink-faint'}`}>{w.ago}</span>
        <div className={`flex items-center gap-1 text-[11px] ${w.featured ? 'text-beige/40' : 'text-ink-faint'}`}>
          <span>♥</span> {w.likes}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}