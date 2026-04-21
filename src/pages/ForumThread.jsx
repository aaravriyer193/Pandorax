import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Share2, Bookmark } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLike } from '../hooks/useLike'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/Nav'
import CategoryPill from '../components/CategoryPill'
import CommentSection from '../components/CommentSection'
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

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n
}

export default function ForumThread() {
  const { id }              = useParams()
  const { session }         = useAuth()
  const [post, setPost]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const { liked, count, toggle } = useLike(post?.id, 'forum_post', post?.like_count)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('forum_posts_with_author')
        .select('*')
        .eq('id', id)
        .single()
      if (!error) {
        setPost(data)
        supabase.rpc('increment_view', { p_id: id, p_type: 'forum_post' })
      }
      setLoad(false)
    }
    load()
  }, [id])

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    toast('Link copied ✦')
  }

  async function handleBookmark() {
    if (!session) { toast('Sign in to bookmark'); return }
    const { error } = await supabase.from('bookmarks').insert({
      user_id: session.user.id, target_id: id, target_type: 'forum_post',
    })
    if (error?.code === '23505') toast('Already bookmarked')
    else toast('Bookmarked ✦')
  }

  if (loading) return <ThreadSkeleton />

  if (!post) return (
    <div className="min-h-screen pt-14 flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-[22px] text-ink-muted italic mb-3">Thread not found.</p>
        <Link to="/forums" className="btn-ghost text-[14px]"><ArrowLeft size={14} /> Back to Forums</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <Link to="/forums" className="btn-ghost text-[13px] mb-6 inline-flex">
          <ArrowLeft size={14} /> Forums
        </Link>

        {/* Thread post */}
        <article className="mb-8">
          {/* Category + tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.category_slug && (
              <CategoryPill
                slug={post.category_slug}
                label={post.category_label}
                emoji={post.category_emoji}
                color={post.category_color}
                size="sm"
              />
            )}
            {post.is_pinned && (
              <span className="text-[10px] font-medium text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full border border-accent-gold/20">
                Pinned
              </span>
            )}
            {post.tags?.map(tag => (
              <span key={tag} className="text-[11px] text-ink-faint border border-ink/10 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-serif font-medium text-[24px] sm:text-[32px] leading-[1.2] tracking-tight mb-5">
            {post.title}
          </h1>

          {/* Cover image */}
          {post.image_url && (
            <div className="mb-6 overflow-hidden rounded-px border border-ink/10">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full object-cover max-h-80"
              />
            </div>
          )}

          {/* Body */}
          <div className="prose prose-sm max-w-none mb-6"
            style={{ fontFamily: 'inherit', color: 'var(--tw-prose-body, #3D3830)', lineHeight: 1.75, fontSize: '15px' }}>
            {post.body.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4 text-[15px] text-ink leading-[1.75]">{para}</p>
            ))}
          </div>

          {/* Author + meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 border-y border-ink/10">
            <Link to={`/u/${post.username}`} className="flex items-center gap-2 group">
              <Avatar profile={{ username: post.username, display_name: post.display_name, avatar_url: post.avatar_url, avatar_color: post.avatar_color }} size={28} />
              <div>
                <span className="text-[13px] font-medium text-ink group-hover:text-accent-indigo transition-colors">
                  {post.display_name ?? post.username}
                </span>
                <span className="text-[12px] text-ink-faint ml-1.5">@{post.username}</span>
              </div>
            </Link>

            <span className="text-[12px] text-ink-faint">{timeAgo(post.created_at)}</span>
            <span className="text-[12px] text-ink-faint">{post.view_count?.toLocaleString() ?? 0} views</span>

            <div className="ml-auto flex items-center gap-3">
              <button onClick={handleShare} className="btn-ghost text-[12px]"><Share2 size={13} /></button>
              <button onClick={handleBookmark} className="btn-ghost text-[12px]"><Bookmark size={13} /></button>
              <button
                onClick={toggle}
                className={`btn-ghost text-[12px] ${liked ? 'text-accent-coral' : ''}`}
              >
                <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                <span>{fmtNum(count)}</span>
              </button>
            </div>
          </div>
        </article>

        {/* Comments */}
        <CommentSection
          targetId={post.id}
          targetType="forum_post"
          initialCount={post.comment_count}
        />
      </div>
    </div>
  )
}

function ThreadSkeleton() {
  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="h-4 w-20 bg-ink/8 rounded mb-6" />
        <div className="h-5 w-32 bg-ink/8 rounded mb-4" />
        <div className="h-8 w-full bg-ink/8 rounded mb-2" />
        <div className="h-8 w-3/4 bg-ink/7 rounded mb-6" />
        <div className="flex flex-col gap-2">
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="h-4 bg-ink/6 rounded" style={{ width: `${70 + Math.random()*30}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}