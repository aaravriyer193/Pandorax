import { useState, useEffect, useRef  } from 'react'
import { Link } from 'react-router-dom'
import { Plus, TrendingUp, Clock, MessageCircle, Heart, Image as ImageIcon, X, ChevronDown, Send } from 'lucide-react'
import { supabase, fetchForumPosts } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/Nav'
import CategoryPill from '../components/CategoryPill'
import toast from 'react-hot-toast'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n
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
]

const FORUM_CATEGORIES = [
  { slug: 'space', label: 'Space', emoji: '🌌' },
  { slug: 'biology', label: 'Biology', emoji: '🧬' },
  { slug: 'psychology', label: 'Psychology', emoji: '🧠' },
  { slug: 'mathematics', label: 'Mathematics', emoji: '🔢' },
  { slug: 'chemistry', label: 'Chemistry', emoji: '⚗️' },
  { slug: 'history', label: 'History', emoji: '🏛' },
  { slug: 'ocean', label: 'Ocean', emoji: '🌊' },
  { slug: 'physics', label: 'Physics', emoji: '⚡' },
  { slug: 'ecology', label: 'Ecology', emoji: '🌿' },
  { slug: 'philosophy', label: 'Philosophy', emoji: '🧩' },
  { slug: 'invention', label: 'Invention', emoji: '💡' },
]

export default function Forums() {
  const { session }               = useAuth()
  const [posts, setPosts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState(null)
  const [sort, setSort]           = useState('latest')
  const [showNew, setShowNew]     = useState(false)

  useEffect(() => { load() }, [category, sort])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchForumPosts({ category, sort })
      setPosts(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="label mb-2">Forums</p>
            <h1 className="font-serif font-medium text-[32px] sm:text-[42px] leading-tight tracking-tight">
              The rabbit hole <em className="text-accent-green">goes deeper</em>
            </h1>
          </div>
          {session && (
            <button onClick={() => setShowNew(true)} className="btn-primary self-start sm:self-auto">
              <Plus size={15} /> New thread
            </button>
          )}
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 border-b border-ink/10 mb-4">
          {[{ key:'latest', label:'Latest', icon: Clock }, { key:'top', label:'Top', icon: TrendingUp }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setSort(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-all
                ${sort === key ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {CATEGORIES.map(cat => (
            <button key={cat.slug ?? 'all'} onClick={() => setCategory(cat.slug)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all
                ${category === cat.slug
                  ? 'bg-ink text-beige border-ink'
                  : 'border-ink/15 text-ink-muted hover:border-ink/35 hover:text-ink'}`}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Thread list */}
        {loading ? (
          <div className="flex flex-col border border-ink/10 divide-y divide-ink/8">
            {Array.from({length:6}).map((_,i) => <ThreadSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-[22px] text-ink-muted italic mb-3">Nothing yet.</p>
            <p className="text-[14px] text-ink-faint">Start the first thread.</p>
          </div>
        ) : (
          <div className="flex flex-col border border-ink/10 divide-y divide-ink/8">
            {posts.map(p => <ThreadRow key={p.id} post={p} />)}
          </div>
        )}
      </div>

      {showNew && <NewThreadModal onClose={() => { setShowNew(false); load() }} categories={FORUM_CATEGORIES} />}
    </div>
  )
}

function ThreadRow({ post }) {
  return (
    <Link to={`/forums/${post.id}`} className="flex items-start gap-4 px-4 sm:px-5 py-4 hover:bg-beige-dark transition-colors group">
      {/* Avatar */}
      <Avatar
        profile={{ username: post.username, display_name: post.display_name, avatar_url: post.avatar_url, avatar_color: post.avatar_color }}
        size={36}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {post.category_slug && (
            <CategoryPill slug={post.category_slug} label={post.category_label} emoji={post.category_emoji} color={post.category_color} size="xs" />
          )}
          {post.is_pinned && (
            <span className="text-[10px] font-medium text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full">Pinned</span>
          )}
        </div>
        <h3 className="font-serif font-medium text-[15px] sm:text-[16px] leading-snug tracking-tight group-hover:text-accent-indigo transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center gap-3 mt-2 text-[12px] text-ink-faint">
          <span>@{post.username}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
          {post.tags?.length > 0 && (
            <>
              <span>·</span>
              <span className="text-ink-faint">{post.tags.slice(0,2).join(', ')}</span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5 text-[12px] text-ink-faint">
        <div className="flex items-center gap-1"><MessageCircle size={12} /> {fmtNum(post.comment_count)}</div>
        <div className="flex items-center gap-1"><Heart size={12} /> {fmtNum(post.like_count)}</div>
      </div>
    </Link>
  )
}

function ThreadSkeleton() {
  return (
    <div className="flex gap-4 px-5 py-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-ink/8 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-20 bg-ink/8 rounded-full" />
        <div className="h-4 w-full bg-ink/8 rounded" />
        <div className="h-4 w-4/5 bg-ink/6 rounded" />
        <div className="h-3 w-32 bg-ink/5 rounded" />
      </div>
    </div>
  )
}

function NewThreadModal({ onClose, categories }) {
  const { session } = useAuth()
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')
  const [category, setCategory] = useState('')
  const [tags,     setTags]     = useState('')
  const [imageFile,setImg]      = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [busy,     setBusy]     = useState(false)
  const fileRef = useRef(null)

  function handleImage(e) {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 8*1024*1024) { toast.error('Image under 8MB please'); return }
    setImg(f); setPreview(URL.createObjectURL(f))
  }

  async function submit(e) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { toast.error('Title and body required'); return }
    setBusy(true)
    try {
      let imageUrl = null
      if (imageFile) {
        const ext  = imageFile.name.split('.').pop()
        const path = `forum/${session.user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('wonder-images').upload(path, imageFile)
        if (upErr) throw upErr
        const { data: u } = supabase.storage.from('wonder-images').getPublicUrl(path)
        imageUrl = u.publicUrl
      }
      const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean)
      const { error } = await supabase.from('forum_posts').insert({
        author_id:     session.user.id,
        title:         title.trim(),
        body:          body.trim(),
        category_slug: category || null,
        tags:          tagArr,
        image_url:     imageUrl,
      })
      if (error) throw error
      toast('Thread posted ✦')
      onClose()
    } catch { toast.error('Failed to post') }
    finally { setBusy(false) }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6">
        <div className="bg-beige w-full md:max-w-xl rounded-t-[12px] md:rounded-px max-h-[90vh] flex flex-col shadow-2xl">
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 bg-ink/15 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
            <h3 className="font-serif font-medium text-[17px]">New Thread</h3>
            <button onClick={onClose} className="btn-ghost"><X size={18} /></button>
          </div>
          <form onSubmit={submit} className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-4">
            <div>
              <label className="label mb-1.5 block">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
                placeholder="Ask the impossible question..." className="input" />
            </div>
            <div>
              <label className="label mb-1.5 block">Body *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} maxLength={10000}
                placeholder="What made you think of this? Share your thinking..." className="textarea" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label mb-1.5 block">Category</label>
                <div className="relative">
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input appearance-none pr-8">
                    <option value="">None</option>
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Tags (comma-separated)</label>
                <input value={tags} onChange={e => setTags(e.target.value)}
                  placeholder="fungi, memory, time" className="input" />
              </div>
            </div>
            <div>
              <label className="label mb-1.5 block">Cover image (optional)</label>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="" className="w-full max-h-40 object-cover rounded-px border border-ink/10" />
                  <button type="button" onClick={() => { setImg(null); setPreview(null) }}
                    className="absolute top-2 right-2 w-6 h-6 bg-ink text-beige rounded-full flex items-center justify-center">
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-ink/20 rounded-px py-5 flex items-center justify-center gap-2 text-ink-faint hover:border-ink/40 hover:text-ink-muted transition-colors text-[13px]">
                  <ImageIcon size={16} /> Add an image
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </div>
            <button type="submit" disabled={busy || !title.trim() || !body.trim()}
              className="btn-primary justify-center disabled:opacity-40 mt-1">
              {busy ? 'Posting...' : <><Send size={14} /> Post thread</>}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}