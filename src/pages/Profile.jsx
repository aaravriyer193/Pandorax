import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, fetchProfile, toggleFollow } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/Nav'
import WonderCard from '../components/WonderCard'
import WonderModal from '../components/WonderModal'
import CategoryPill from '../components/CategoryPill'
import toast from 'react-hot-toast'

function fmtNum(n = 0) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n
}

const TABS = ['Wonders', 'Forum Posts']

export default function Profile() {
  const { username }              = useParams()
  const { session, profile: me }  = useAuth()
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [following, setFollowing] = useState(false)
  const [tab, setTab]             = useState('Wonders')
  const [wonders, setWonders]     = useState([])
  const [posts, setPosts]         = useState([])
  const [contentLoading, setCL]   = useState(true)
  const [activeWonder, setActive] = useState(null)
  const isOwnProfile              = me?.username === username

  useEffect(() => {
    load()
  }, [username])

  useEffect(() => {
    if (profile) loadContent()
  }, [profile, tab])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchProfile(username)
      setProfile(data)
      // Check if we follow this person
      if (session && data) {
        const { data: f } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', session.user.id)
          .eq('following_id', data.id)
          .single()
        setFollowing(!!f)
      }
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadContent() {
    setCL(true)
    if (tab === 'Wonders') {
      const { data } = await supabase
        .from('wonders_with_author')
        .select('*')
        .eq('author_id', profile.id)
        .order('published_at', { ascending: false })
        .limit(20)
      setWonders(data ?? [])
    } else {
      const { data } = await supabase
        .from('forum_posts_with_author')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setPosts(data ?? [])
    }
    setCL(false)
  }

  async function handleFollow() {
    if (!session) { toast('Sign in to follow people'); return }
    const wasFollowing = following
    setFollowing(!wasFollowing)
    setProfile(p => ({ ...p, follower_count: wasFollowing ? p.follower_count - 1 : p.follower_count + 1 }))
    try {
      await toggleFollow(session.user.id, profile.id)
    } catch {
      setFollowing(wasFollowing)
      toast.error('Something went wrong')
    }
  }

  if (loading) return <ProfileSkeleton />

  if (!profile) return (
    <div className="min-h-screen pt-14 flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-[22px] text-ink-muted italic">User not found.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── Profile header ── */}
        <div className="py-8 sm:py-12 border-b border-ink/10">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <Avatar profile={profile} size={72} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <div>
                  <h1 className="font-serif font-medium text-[24px] tracking-tight">
                    {profile.display_name ?? profile.username}
                  </h1>
                  <p className="text-[14px] text-ink-muted">@{profile.username}</p>
                </div>
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    className={`self-start sm:ml-auto flex-shrink-0 ${
                      following ? 'btn-outline text-[13px] py-2' : 'btn-primary text-[13px] py-2'
                    }`}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
                {isOwnProfile && (
                  <Link to="/settings" className="btn-outline text-[13px] py-2 sm:ml-auto self-start">
                    Edit profile
                  </Link>
                )}
              </div>

              {profile.bio && (
                <p className="text-[14px] text-ink-muted leading-relaxed mb-4 max-w-[52ch]">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-[13px]">
                <div>
                  <span className="font-medium text-ink">{fmtNum(profile.follower_count)}</span>
                  <span className="text-ink-faint ml-1">followers</span>
                </div>
                <div>
                  <span className="font-medium text-ink">{fmtNum(profile.following_count)}</span>
                  <span className="text-ink-faint ml-1">following</span>
                </div>
                <div>
                  <span className="font-medium text-ink">{fmtNum(profile.wonder_count)}</span>
                  <span className="text-ink-faint ml-1">wonders</span>
                </div>
              </div>

              {/* Curiosity tags */}
              {profile.curiosity_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {profile.curiosity_tags.map(tag => (
                    <span key={tag} className="tag-pill text-[11px] cursor-default">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content tabs ── */}
        <div className="flex items-center gap-1 border-b border-ink/10 mt-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-all
                ${tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Content grid ── */}
        <div className="py-6">
          {contentLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink/10 border border-ink/10">
              {Array.from({length:4}).map((_,i) => (
                <div key={i} className="bg-beige p-5 animate-pulse flex flex-col gap-3">
                  <div className="h-3 w-20 bg-ink/8 rounded-full" />
                  <div className="h-4 w-full bg-ink/8 rounded" />
                  <div className="h-4 w-2/3 bg-ink/6 rounded" />
                </div>
              ))}
            </div>
          ) : tab === 'Wonders' ? (
            wonders.length === 0 ? (
              <p className="text-center py-16 font-serif text-[18px] text-ink-muted italic">
                No wonders posted yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink/10 border border-ink/10">
                {wonders.map(w => (
                  <WonderCard key={w.id} wonder={w} onCommentClick={setActive} />
                ))}
              </div>
            )
          ) : (
            posts.length === 0 ? (
              <p className="text-center py-16 font-serif text-[18px] text-ink-muted italic">
                No forum posts yet.
              </p>
            ) : (
              <div className="flex flex-col border border-ink/10 divide-y divide-ink/8">
                {posts.map(p => (
                  <Link key={p.id} to={`/forums/${p.id}`}
                    className="px-4 sm:px-5 py-4 hover:bg-beige-dark transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      {p.category_slug && <CategoryPill slug={p.category_slug} label={p.category_label} size="xs" />}
                    </div>
                    <h3 className="font-serif font-medium text-[15px] leading-snug">{p.title}</h3>
                    <p className="text-[12px] text-ink-faint mt-1">{p.comment_count} replies · ↑ {fmtNum(p.like_count)}</p>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {activeWonder && <WonderModal wonder={activeWonder} onClose={() => setActive(null)} />}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-pulse">
        <div className="flex gap-5 mb-8">
          <div className="w-[72px] h-[72px] rounded-full bg-ink/8 flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            <div className="h-6 w-40 bg-ink/8 rounded" />
            <div className="h-4 w-24 bg-ink/6 rounded" />
            <div className="h-3 w-full bg-ink/5 rounded" />
            <div className="h-3 w-2/3 bg-ink/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}