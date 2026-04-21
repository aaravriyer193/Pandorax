import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Sparkles, Cpu, MessageSquare, User, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const links = [
  { to: '/feed',   label: 'Wonders',     icon: Sparkles },
  { to: '/sims',   label: 'Simulations', icon: Cpu },
  { to: '/forums', label: 'Forums',      icon: MessageSquare },
]

export default function Nav() {
  const { session, profile, signInWithGoogle, signOut } = useAuth()
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location              = useLocation()
  const isLanding             = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setOpen(false) }, [location])

  const navBg = isLanding
    ? scrolled ? 'bg-beige/90 backdrop-blur-md border-b border-ink/8' : 'bg-transparent'
    : 'bg-beige/90 backdrop-blur-md border-b border-ink/8'

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="font-serif font-semibold text-[18px] tracking-tight flex-shrink-0">
            Pandora<span className="text-accent-gold">x</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-[13px] transition-colors duration-150 ${
                    isActive ? 'text-ink font-medium' : 'text-ink-muted hover:text-ink'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                {profile?.is_admin && (
                  <Link to="/admin" className="btn-ghost text-accent-gold">
                    <Shield size={13} /> Admin
                  </Link>
                )}
                <Link
                  to={`/u/${profile?.username}`}
                  className="flex items-center gap-2 text-[13px] text-ink-muted hover:text-ink transition-colors"
                >
                  <Avatar profile={profile} size={28} />
                  <span>{profile?.username}</span>
                </Link>
                <button onClick={signOut} className="btn-ghost">
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="btn-outline text-[13px] py-2 px-4">
                Sign in with Google →
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden p-1 text-ink-muted hover:text-ink transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`
        fixed inset-0 z-40 md:hidden transition-all duration-300
        ${open ? 'pointer-events-auto' : 'pointer-events-none'}
      `}>
        {/* Backdrop */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/20 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Drawer panel */}
        <div className={`
          absolute top-14 left-0 right-0 bg-beige border-b border-ink/10
          transition-all duration-300 overflow-hidden
          ${open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="px-4 py-4 flex flex-col gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-px text-[15px] transition-colors ${
                    isActive
                      ? 'bg-ink text-beige'
                      : 'text-ink-muted hover:text-ink hover:bg-beige-dark'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}

            <div className="divider my-2" />

            {session ? (
              <>
                <Link
                  to={`/u/${profile?.username}`}
                  className="flex items-center gap-3 px-3 py-3 text-[15px] text-ink-muted hover:text-ink"
                >
                  <Avatar profile={profile} size={24} />
                  <span>{profile?.username ?? 'Profile'}</span>
                </Link>
                {profile?.is_admin && (
                  <Link to="/admin" className="flex items-center gap-3 px-3 py-3 text-[15px] text-accent-gold">
                    <Shield size={16} /> Admin panel
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 px-3 py-3 text-[15px] text-ink-muted hover:text-ink"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-3 px-3 py-3 text-[15px] text-ink font-medium"
              >
                Sign in with Google →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Reusable avatar — used across the app
export function Avatar({ profile, size = 36 }) {
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : profile?.username?.[0]?.toUpperCase() ?? '?'

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={initials}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="avatar text-beige flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: profile?.avatar_color ?? '#C4922A',
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  )
}