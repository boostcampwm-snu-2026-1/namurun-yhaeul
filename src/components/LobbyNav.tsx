import { useEffect, useState, useCallback } from 'react'

const ALL_SECTIONS = [
  { id: 'game-start', label: '게임 시작' },
  { id: 'how-to-play', label: '게임 방법' },
  { id: 'related-video', label: '관련 영상' },
]

export function LobbyNav() {
  const [activeId, setActiveId] = useState('game-start')
  const [items, setItems] = useState<typeof ALL_SECTIONS>([])

  useEffect(() => {
    const visible = ALL_SECTIONS.filter(s => document.getElementById(s.id))
    setItems(visible)
    if (visible.length < 2) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )

    visible.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  if (items.length < 2) return null

  return (
    <nav className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-start z-10">
      {items.map((item, i) => (
        <div key={item.id} className="flex flex-col items-center">
          <button
            onClick={() => scrollTo(item.id)}
            className="flex items-center gap-3 py-1.5 group"
          >
            <div className={`w-1.5 h-1.5 rounded-full border transition-all duration-200 ${
              activeId === item.id
                ? 'bg-primary border-primary scale-125'
                : 'bg-transparent border-outline-variant group-hover:border-outline'
            }`} />
            <span className={`font-label-mono text-label-mono transition-colors duration-200 whitespace-nowrap ${
              activeId === item.id
                ? 'text-primary'
                : 'text-on-surface-variant group-hover:text-on-surface'
            }`}>
              {item.label}
            </span>
          </button>
          {i < items.length - 1 && (
            <div className="w-px h-3 bg-outline-variant/40 ml-[2.75px]" />
          )}
        </div>
      ))}
    </nav>
  )
}
