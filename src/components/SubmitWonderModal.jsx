import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Send, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { slug: 'space',        label: 'Space',          emoji: '🌌' },
  { slug: 'biology',      label: 'Biology',         emoji: '🧬' },
  { slug: 'psychology',   label: 'Psychology',      emoji: '🧠' },
  { slug: 'mathematics',  label: 'Mathematics',     emoji: '🔢' },
  { slug: 'chemistry',    label: 'Chemistry',       emoji: '⚗️' },
  { slug: 'history',      label: 'History',         emoji: '🏛' },
  { slug: 'ocean',        label: 'Ocean',           emoji: '🌊' },
  { slug: 'physics',      label: 'Physics',         emoji: '⚡' },
  { slug: 'ecology',      label: 'Ecology',         emoji: '🌿' },
  { slug: 'philosophy',   label: 'Philosophy',      emoji: '🧩' },
  { slug: 'invention',    label: 'Invention',       emoji: '💡' },
  { slug: 'palaeontology',label: 'Palaeontology',   emoji: '🦕' },
]

export default function SubmitWonderModal({ onClose }) {
  const { session } = useAuth()
  const [headline,  setHeadline]  = useState('')
  const [body,      setBody]      = useState('')
  const [category,  setCategory]  = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceName,setSourceName]= useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imageCaption, setCaption]= useState('')
  const [preview,   setPreview]   = useState(null)
  const [submitting,setSubmitting]= useState(false)
  const fileRef = useRef(null)

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8MB'); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null); setPreview(null); setCaption('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e) {
    e.preventDefault()
    if (!headline.trim()) { toast.error('Headline is required'); return }
    if (!category)        { toast.error('Pick a category'); return }
    if (!session)         { toast('Sign in first'); return }
    setSubmitting(true)

    try {
      let imageUrl = null

      if (imageFile) {
        const ext  = imageFile.name.split('.').pop()
        const path = `${session.user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('wonder-images')
          .upload(path, imageFile, { cacheControl: '3600' })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('wonder-images').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('wonders').insert({
        author_id:     session.user.id,
        headline:      headline.trim(),
        body:          body.trim() || null,
        category_slug: category,
        external_url:  sourceUrl.trim() || null,
        source_name:   sourceName.trim() || null,
        image_url:     imageUrl,
        image_caption: imageCaption.trim() || null,
        status:        'pending',
        source:        'user',
      })
      if (error) throw error

      toast('Wonder submitted! It\'ll be reviewed before going live ✦')
      onClose()
    } catch (err) {
      toast.error('Submission failed — try again')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6">
        <div className="bg-beige w-full md:max-w-xl rounded-t-[12px] md:rounded-px max-h-[90vh] flex flex-col shadow-2xl">

          {/* Handle */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 bg-ink/15 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
            <div>
              <h3 className="font-serif font-medium text-[17px]">Submit a Wonder</h3>
              <p className="text-[11px] text-ink-faint mt-0.5">Reviewed before going live</p>
            </div>
            <button onClick={onClose} className="btn-ghost"><X size={18} /></button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-4">

            {/* Headline */}
            <div>
              <label className="label mb-1.5 block">Headline *</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                maxLength={200}
                placeholder="Scientists discover octopuses have dreams..."
                className="input"
              />
              <div className="text-[11px] text-ink-faint mt-1 text-right">{headline.length}/200</div>
            </div>

            {/* Body */}
            <div>
              <label className="label mb-1.5 block">The wonder (optional)</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={5000}
                rows={4}
                placeholder="What makes this mind-blowing? Give us the detail..."
                className="textarea"
              />
            </div>

            {/* Category */}
            <div>
              <label className="label mb-1.5 block">Category *</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input appearance-none pr-8"
                >
                  <option value="">Pick a category...</option>
                  {CATEGORIES.map(c => (
                    <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              </div>
            </div>

            {/* Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label mb-1.5 block">Source name</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                  placeholder="Nature, NASA, arxiv..."
                  className="input"
                />
              </div>
              <div>
                <label className="label mb-1.5 block">Source URL</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="input"
                />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="label mb-1.5 block">Image (optional)</label>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="" className="w-full max-h-48 object-cover rounded-px border border-ink/10" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 w-6 h-6 bg-ink text-beige rounded-full flex items-center justify-center"
                  >
                    <X size={11} />
                  </button>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Caption (optional)"
                    className="input mt-2 text-[13px]"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-ink/20 rounded-px py-6 flex flex-col items-center gap-2 text-ink-faint hover:border-ink/40 hover:text-ink-muted transition-colors"
                >
                  <ImageIcon size={20} />
                  <span className="text-[13px]">Click to add an image</span>
                  <span className="text-[11px]">PNG, JPG, WebP · max 8MB</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </div>

            <button
              type="submit"
              disabled={submitting || !headline.trim() || !category}
              className="btn-primary justify-center disabled:opacity-40 mt-2"
            >
              {submitting ? 'Submitting...' : <><Send size={14} /> Submit Wonder</>}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}