import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Check, X, LogOut, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { Avatar } from '../components/Nav'
import toast from 'react-hot-toast'

const ALL_TAGS = [
  { emoji: '🌌', label: 'Space',          slug: 'Space' },
  { emoji: '🧬', label: 'Biology',         slug: 'Biology' },
  { emoji: '🧠', label: 'Psychology',      slug: 'Psychology' },
  { emoji: '🔢', label: 'Mathematics',     slug: 'Mathematics' },
  { emoji: '⚗️', label: 'Chemistry',       slug: 'Chemistry' },
  { emoji: '🏛',  label: 'History',        slug: 'History' },
  { emoji: '🌊', label: 'Ocean',           slug: 'Ocean' },
  { emoji: '🦠', label: 'Microbiology',    slug: 'Microbiology' },
  { emoji: '⚡', label: 'Physics',         slug: 'Physics' },
  { emoji: '🌿', label: 'Ecology',         slug: 'Ecology' },
  { emoji: '🎨', label: 'Art & Perception',slug: 'Art' },
  { emoji: '🧩', label: 'Philosophy',      slug: 'Philosophy' },
  { emoji: '🦕', label: 'Palaeontology',   slug: 'Palaeontology' },
  { emoji: '🌍', label: 'Geoscience',      slug: 'Geoscience' },
  { emoji: '💡', label: 'Invention',       slug: 'Invention' },
]

const AVATAR_COLORS = [
  '#C4922A', '#D4604A', '#4A7C59', '#4A5580',
  '#7B5EA7', '#2A7BAD', '#B85C38', '#1A1714',
]

export default function Settings() {
  const { session, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [displayName,   setDisplayName]  = useState('')
  const [username,      setUsername]     = useState('')
  const [bio,           setBio]          = useState('')
  const [tags,          setTags]         = useState([])
  const [avatarColor,   setAvatarColor]  = useState('#C4922A')
  const [avatarFile,    setAvatarFile]   = useState(null)
  const [avatarPreview, setAvatarPreview]= useState(null)
  const [saving,        setSaving]       = useState(false)
  const [usernameError, setUsernameError]= useState('')
  const fileRef = useRef(null)

  // Redirect if not signed in
  useEffect(() => {
    if (!session && !profile) navigate('/')
  }, [session])

  // Pre-fill form from profile
  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setUsername(profile.username ?? '')
    setBio(profile.bio ?? '')
    setTags(profile.curiosity_tags ?? [])
    setAvatarColor(profile.avatar_color ?? '#C4922A')
  }, [profile])

  function handleAvatarPick(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function toggleTag(slug) {
    setTags(prev =>
      prev.includes(slug) ? prev.filter(t => t !== slug) : [...prev, slug]
    )
  }

  async function checkUsername(val) {
    setUsername(val)
    setUsernameError('')
    if (val === profile?.username) return
    if (val.length < 3) { setUsernameError('At least 3 characters'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) { setUsernameError('Letters, numbers, underscores only'); return }
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', val)
      .single()
    if (data) setUsernameError('Username already taken')
  }

  async function save(e) {
    e.preventDefault()
    if (usernameError) return
    setSaving(true)

    try {
      let avatarUrl = profile?.avatar_url ?? null

      if (avatarFile) {
        const ext  = avatarFile.name.split('.').pop()
        const path = `${session.user.id}/avatar.${ext}`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, cacheControl: '3600' })
        if (upErr) throw upErr
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        // Bust cache with timestamp
        avatarUrl = data.publicUrl + '?t=' + Date.now()
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name:   displayName.trim() || null,
          username:       username.trim(),
          bio:            bio.trim() || null,
          curiosity_tags: tags,
          avatar_color:   avatarColor,
          avatar_url:     avatarUrl,
        })
        .eq('id', session.user.id)

      if (error) throw error

      await refreshProfile()
      toast('Profile saved ✦')
      navigate(`/u/${username.trim()}`)
    } catch (err) {
      toast.error(err.message ?? 'Save failed')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  if (!profile) return null

  // Live preview profile for the avatar preview card
  const previewProfile = {
    ...profile,
    display_name: displayName || profile.display_name,
    username:     username    || profile.username,
    avatar_url:   avatarPreview ?? profile.avatar_url,
    avatar_color: avatarColor,
  }

  return (
    <div className="min-h-screen pt-14" style={{ background: '#F2EDE3' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8">
          <p className="label mb-2">Account</p>
          <h1 className="font-serif font-medium text-[28px] sm:text-[36px] tracking-tight">
            Edit profile
          </h1>
        </div>

        <form onSubmit={save} className="flex flex-col gap-8">

          {/* ── Avatar ── */}
          <section className="flex flex-col gap-4">
            <h2 className="font-serif font-medium text-[16px] tracking-tight border-b pb-3" style={{ borderColor: 'rgba(26,23,20,0.1)' }}>
              Avatar
            </h2>

            <div className="flex items-center gap-6">
              {/* Preview */}
              <div className="relative flex-shrink-0">
                <Avatar profile={previewProfile} size={72} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity opacity-0 hover:opacity-100"
                  style={{ background: 'rgba(26,23,20,0.5)' }}
                  title="Upload photo"
                >
                  <Camera size={18} color="#F2EDE3" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-outline text-[13px] py-2 self-start"
                >
                  <Camera size={14} /> Upload photo
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                    className="btn-ghost text-[12px]"
                  >
                    <X size={12} /> Remove photo
                  </button>
                )}
                <p className="text-[11px]" style={{ color: '#B5ADA0' }}>PNG, JPG, WebP · max 3MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            </div>

            {/* Colour picker (used when no photo) */}
            {!avatarPreview && !profile.avatar_url && (
              <div>
                <p className="text-[12px] mb-2" style={{ color: '#7A7166' }}>Initials colour</p>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: c, outline: avatarColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                    >
                      {avatarColor === c && <Check size={14} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Basic info ── */}
          <section className="flex flex-col gap-4">
            <h2 className="font-serif font-medium text-[16px] tracking-tight border-b pb-3" style={{ borderColor: 'rgba(26,23,20,0.1)' }}>
              Basic info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5 block">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={50}
                  placeholder="Your full name"
                  className="input"
                />
              </div>
              <div>
                <label className="label mb-1.5 block">Username *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: '#B5ADA0' }}>@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => checkUsername(e.target.value)}
                    maxLength={30}
                    placeholder="username"
                    className="input pl-7"
                    required
                  />
                </div>
                {usernameError && (
                  <p className="text-[11px] mt-1" style={{ color: '#D4604A' }}>{usernameError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label mb-1.5 block">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="What makes you curious? (max 300 characters)"
                className="textarea"
              />
              <div className="text-[11px] mt-1 text-right" style={{ color: '#B5ADA0' }}>{bio.length}/300</div>
            </div>
          </section>

          {/* ── Curiosity tags ── */}
          <section className="flex flex-col gap-4">
            <div className="border-b pb-3" style={{ borderColor: 'rgba(26,23,20,0.1)' }}>
              <h2 className="font-serif font-medium text-[16px] tracking-tight">Curiosity tags</h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#7A7166' }}>Pick the topics that pull you in ({tags.length} selected)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map(({ emoji, label, slug }) => {
                const active = tags.includes(slug)
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleTag(slug)}
                    className={`tag-pill ${active ? 'tag-pill-active' : ''}`}
                  >
                    <span>{emoji}</span> {label}
                    {active && <Check size={11} className="ml-0.5" />}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Save ── */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !!usernameError}
              className="btn-primary justify-center w-full sm:w-auto disabled:opacity-40"
            >
              {saving ? 'Saving...' : <><Check size={14} /> Save changes</>}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/u/${profile.username}`)}
              className="btn-ghost text-[13px]"
            >
              Cancel
            </button>
          </div>

          {/* ── Danger zone ── */}
          <section className="flex flex-col gap-3 pt-4 border-t" style={{ borderColor: 'rgba(26,23,20,0.1)' }}>
            <h2 className="font-serif font-medium text-[14px] tracking-tight" style={{ color: '#B5ADA0' }}>Account</h2>
            <button
              type="button"
              onClick={handleSignOut}
              className="btn-ghost text-[13px] self-start"
            >
              <LogOut size={14} /> Sign out
            </button>
          </section>

        </form>
      </div>
    </div>
  )
}