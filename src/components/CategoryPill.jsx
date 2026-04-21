const CATEGORY_COLORS = {
  space:        '#4A5580',
  biology:      '#4A7C59',
  psychology:   '#D4604A',
  mathematics:  '#4A5580',
  chemistry:    '#C4922A',
  history:      '#B85C38',
  ocean:        '#2A7BAD',
  microbiology: '#4A7C59',
  physics:      '#7B5EA7',
  ecology:      '#4A7C59',
  art:          '#D4604A',
  philosophy:   '#4A5580',
  palaeontology:'#B85C38',
  geoscience:   '#4A7C59',
  invention:    '#C4922A',
}

export default function CategoryPill({ slug, label, emoji, color, size = 'sm', onClick, active }) {
  const c = color ?? CATEGORY_COLORS[slug] ?? '#7A7166'

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5',
    md: 'text-[13px] px-3 py-1.5 gap-2',
  }[size] ?? 'text-[11px] px-2.5 py-1 gap-1.5'

  return (
    <button
      onClick={onClick}
      style={{ color: active ? '#F2EDE3' : c, backgroundColor: active ? c : `${c}18`, borderColor: `${c}40` }}
      className={`
        inline-flex items-center font-medium tracking-wide uppercase
        border rounded-full transition-all duration-150
        ${sizeClasses}
        ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
      `}
    >
      {emoji && <span style={{ fontSize: size === 'xs' ? 10 : 12 }}>{emoji}</span>}
      {label ?? slug}
    </button>
  )
}