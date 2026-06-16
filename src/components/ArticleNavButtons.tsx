interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
  hasToc: boolean
}

const BTN_CLASS =
  'bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant'

export function ArticleNavButtons({ containerRef, hasToc }: Props) {
  const scrollToToc = () => {
    containerRef.current?.querySelector('.opennamu_TOC')?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const scrollToBottom = () => {
    const el = containerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className="fixed right-4 bottom-4 z-30 flex flex-col gap-2 items-center">
      {hasToc && (
        <button className={BTN_CLASS} onClick={scrollToToc} aria-label="목차로 이동">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="1" y="6" width="8" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="1" y="10" width="10" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
      )}
      <button className={BTN_CLASS} onClick={scrollToTop} aria-label="맨 위로">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 8 L6 4 L10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button className={BTN_CLASS} onClick={scrollToBottom} aria-label="맨 아래로">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
