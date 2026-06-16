function smoothScroll(el: HTMLElement, target: number, duration = 350) {
  const start = el.scrollTop
  const distance = target - start
  if (distance === 0) return
  const startTime = performance.now()

  function step(now: number) {
    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    el.scrollTop = start + distance * ease
    if (t < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
  hasToc: boolean
}

const BTN_CLASS =
  'bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant'

export function ArticleNavButtons({ containerRef, hasToc }: Props) {
  const scrollToToc = () => {
    const toc = containerRef.current?.querySelector('.opennamu_TOC')
    if (!toc || !containerRef.current) return
    const offset = (toc as HTMLElement).offsetTop - (containerRef.current as HTMLElement).offsetTop
    smoothScroll(containerRef.current, offset)
  }
  const scrollToTop = () => {
    if (containerRef.current) smoothScroll(containerRef.current, 0)
  }
  const scrollToBottom = () => {
    const el = containerRef.current
    if (el) smoothScroll(el, el.scrollHeight - el.clientHeight)
  }

  return (
    <div className="fixed right-4 bottom-4 z-30 flex flex-col gap-2 items-center">
      {hasToc && (
        <button className={BTN_CLASS} onClick={scrollToToc} aria-label="목차로 이동">
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="1" y="6" width="8" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="1" y="10" width="10" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
      )}
      <button className={BTN_CLASS} onClick={scrollToTop} aria-label="맨 위로">
        <svg width="15" height="15" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 8 L6 4 L10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button className={BTN_CLASS} onClick={scrollToBottom} aria-label="맨 아래로">
        <svg width="15" height="15" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
