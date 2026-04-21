import { useState, useEffect, useRef } from 'react'
import { Check, X, Upload, Eye, Clock, Flag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import CategoryPill from '../components/CategoryPill'
import toast from 'react-hot-toast'

const TABS = ['Pending Wonders', 'Upload Sim', 'Reports']

export default function Admin() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('Pending Wonders')

  return (
    <div className="min-h-screen pt-14 bg-beige">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="label mb-2">Admin Panel</p>
          <h1 className="font-serif font-medium text-[28px] sm:text-[36px] tracking-tight">
            Curator's desk
          </h1>
          <p className="text-[13px] text-ink-muted mt-1">Signed in as @{profile?.username}</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-ink/10 mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-all
                ${tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Pending Wonders' && <PendingWonders />}
        {tab === 'Upload Sim'      && <UploadSim />}
        {tab === 'Reports'         && <ReportsList />}
      </div>
    </div>
  )
}

// ── Pending Wonders ──────────────────────────────────────────
function PendingWonders() {
  const [wonders, setWonders] = useState([])
  const [loading, setLoad]    = useState(true)
  const [busy, setBusy]       = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoad(true)
    const { data } = await supabase
      .from('wonders')
      .select('*, profiles(username, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setWonders(data ?? [])
    setLoad(false)
  }

  async function decide(id, status) {
    setBusy(id)
    const { error } = await supabase
      .from('wonders')
      .update({ status })
      .eq('id', id)
    if (error) { toast.error('Failed'); setBusy(null); return }
    toast(status === 'published' ? 'Wonder published ✦' : 'Wonder rejected')
    setWonders(w => w.filter(x => x.id !== id))
    setBusy(null)
  }

  if (loading) return <p className="text-ink-muted text-[14px] animate-pulse">Loading pending wonders...</p>

  if (wonders.length === 0) return (
    <div className="text-center py-16">
      <p className="font-serif text-[20px] text-ink-muted italic">Queue is empty ✦</p>
      <p className="text-[13px] text-ink-faint mt-2">No wonders awaiting review.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-ink-muted mb-2">{wonders.length} pending</p>
      {wonders.map(w => (
        <div key={w.id} className="card p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {w.category_slug && (
                <div className="mb-2">
                  <CategoryPill slug={w.category_slug} size="xs" />
                </div>
              )}
              <h3 className="font-serif font-medium text-[16px] leading-snug">{w.headline}</h3>
              {w.body && <p className="text-[13px] text-ink-muted mt-1.5 leading-relaxed line-clamp-3">{w.body}</p>}
            </div>
            {w.image_url && (
              <img src={w.image_url} alt="" className="w-20 h-14 object-cover rounded-px border border-ink/10 flex-shrink-0" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[12px] text-ink-faint">
            <span>@{w.profiles?.username ?? 'unknown'}</span>
            {w.source_name && <><span>·</span><span>{w.source_name}</span></>}
            {w.external_url && (
              <a href={w.external_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent-indigo hover:underline">
                <Eye size={11} /> View source
              </a>
            )}
            <span className="text-[11px] ml-auto">{new Date(w.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => decide(w.id, 'published')}
              disabled={busy === w.id}
              className="btn-primary text-[13px] py-2 px-4 gap-1.5 disabled:opacity-50"
            >
              <Check size={13} /> Publish
            </button>
            <button
              onClick={() => decide(w.id, 'rejected')}
              disabled={busy === w.id}
              className="btn-outline text-[13px] py-2 px-4 gap-1.5 disabled:opacity-50 text-accent-coral border-accent-coral/20 hover:border-accent-coral/50"
            >
              <X size={13} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Upload Sim ───────────────────────────────────────────────
function UploadSim() {
  const [title,    setTitle]   = useState('')
  const [desc,     setDesc]    = useState('')
  const [date,     setDate]    = useState(new Date().toISOString().split('T')[0])
  const [category, setCat]     = useState('')
  const [htmlFile, setHtml]    = useState(null)
  const [thumbFile,setThumb]   = useState(null)
  const [thumbPrev,setTP]      = useState(null)
  const [busy,     setBusy]    = useState(false)
  const htmlRef  = useRef(null)
  const thumbRef = useRef(null)

  async function submit(e) {
    e.preventDefault()
    if (!title || !htmlFile) { toast.error('Title and HTML file required'); return }
    setBusy(true)
    try {
      // Upload HTML
      const htmlPath = `sims/${date}-${htmlFile.name}`
      const { error: hErr } = await supabase.storage
        .from('sim-files')
        .upload(htmlPath, htmlFile, { upsert: true, contentType: 'text/html' })
      if (hErr) throw hErr
      const { data: hUrl } = supabase.storage.from('sim-files').getPublicUrl(htmlPath)

      // Upload thumbnail
      let thumbUrl = null
      if (thumbFile) {
        const ext = thumbFile.name.split('.').pop()
        const tPath = `sim-thumbs/${date}.${ext}`
        await supabase.storage.from('wonder-images').upload(tPath, thumbFile, { upsert: true })
        const { data: tUrl } = supabase.storage.from('wonder-images').getPublicUrl(tPath)
        thumbUrl = tUrl.publicUrl
      }

      const { error } = await supabase.from('simulations').upsert({
        title,
        description:   desc || null,
        category_slug: category || null,
        html_url:      hUrl.publicUrl,
        thumbnail_url: thumbUrl,
        sim_date:      date,
      }, { onConflict: 'sim_date' })
      if (error) throw error

      toast('Simulation uploaded ✦')
      setTitle(''); setDesc(''); setHtml(null); setThumb(null); setTP(null)
      if (htmlRef.current)  htmlRef.current.value  = ''
      if (thumbRef.current) thumbRef.current.value = ''
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 max-w-lg">
      <div>
        <label className="label mb-1.5 block">Title *</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Murmuration — Starling Flocking" className="input" />
      </div>
      <div>
        <label className="label mb-1.5 block">Description</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
          placeholder="What is this simulation showing?" className="textarea" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1.5 block">Date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label mb-1.5 block">Category</label>
          <input value={category} onChange={e => setCat(e.target.value)}
            placeholder="biology, physics..." className="input" />
        </div>
      </div>

      {/* HTML file */}
      <div>
        <label className="label mb-1.5 block">HTML Simulation File *</label>
        <button type="button" onClick={() => htmlRef.current?.click()}
          className="w-full border border-dashed border-ink/20 rounded-px py-5 flex items-center justify-center gap-2 text-ink-faint hover:border-ink/40 hover:text-ink-muted transition-colors text-[13px]">
          <Upload size={16} />
          {htmlFile ? htmlFile.name : 'Click to upload .html file'}
        </button>
        <input ref={htmlRef} type="file" accept=".html,text/html" className="hidden"
          onChange={e => setHtml(e.target.files[0])} />
      </div>

      {/* Thumbnail */}
      <div>
        <label className="label mb-1.5 block">Thumbnail (optional)</label>
        {thumbPrev ? (
          <div className="relative">
            <img src={thumbPrev} alt="" className="w-full max-h-32 object-cover rounded-px border border-ink/10" />
            <button type="button" onClick={() => { setThumb(null); setTP(null) }}
              className="absolute top-2 right-2 w-6 h-6 bg-ink text-beige rounded-full flex items-center justify-center">
              <X size={11} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => thumbRef.current?.click()}
            className="w-full border border-dashed border-ink/20 rounded-px py-4 flex items-center justify-center gap-2 text-ink-faint hover:border-ink/40 hover:text-ink-muted transition-colors text-[13px]">
            <Upload size={15} /> Upload thumbnail image
          </button>
        )}
        <input ref={thumbRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files[0]; setThumb(f); setTP(URL.createObjectURL(f)) }} />
      </div>

      <button type="submit" disabled={busy || !title || !htmlFile}
        className="btn-primary justify-center disabled:opacity-40">
        {busy ? 'Uploading...' : <><Upload size={14} /> Upload simulation</>}
      </button>
    </form>
  )
}

// ── Reports ──────────────────────────────────────────────────
function ReportsList() {
  const [reports, setReports] = useState([])
  const [loading, setLoad]    = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reporter_id(username)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    setReports(data ?? [])
    setLoad(false)
  }

  async function resolve(id, status) {
    await supabase.from('reports').update({ status, resolved_at: new Date().toISOString() }).eq('id', id)
    toast(status === 'resolved' ? 'Resolved' : 'Dismissed')
    setReports(r => r.filter(x => x.id !== id))
  }

  if (loading) return <p className="text-ink-muted text-[14px] animate-pulse">Loading reports...</p>

  if (reports.length === 0) return (
    <div className="text-center py-16">
      <p className="font-serif text-[20px] text-ink-muted italic">No open reports ✦</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {reports.map(r => (
        <div key={r.id} className="card p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-accent-coral bg-accent-coral/10 px-2 py-0.5 rounded-full border border-accent-coral/20">
                  {r.reason}
                </span>
                <span className="text-[11px] text-ink-faint">{r.target_type}</span>
              </div>
              <p className="text-[13px] text-ink-muted">
                Reported by <strong className="text-ink">@{r.reporter?.username}</strong>
              </p>
              {r.notes && <p className="text-[13px] text-ink mt-1.5 leading-relaxed">"{r.notes}"</p>}
            </div>
            <span className="text-[11px] text-ink-faint flex-shrink-0">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => resolve(r.id, 'resolved')} className="btn-primary text-[12px] py-1.5 px-3 gap-1">
              <Check size={12} /> Resolve
            </button>
            <button onClick={() => resolve(r.id, 'dismissed')} className="btn-outline text-[12px] py-1.5 px-3 gap-1">
              <X size={12} /> Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}