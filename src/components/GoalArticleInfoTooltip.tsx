import { useId, useState } from 'react'

type SummaryStatus = 'idle' | 'loading' | 'success' | 'error'

interface Props {
  summary: string | null
  status: SummaryStatus
}

function getTooltipMessage(status: SummaryStatus, summary: string | null): string {
  if (status === 'error') return '설명을 불러올 수 없습니다'
  if (status === 'success' && summary) return summary
  return '설명을 불러오는 중...'
}

export function GoalArticleInfoTooltip({ summary, status }: Props) {
  const tooltipId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const message = getTooltipMessage(status, summary)

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label="목표 문서 설명 보기"
        aria-describedby={isOpen ? tooltipId : undefined}
        className="w-6 h-6 flex items-center justify-center rounded-full border border-primary/40 bg-surface-container-lowest text-primary font-label-mono text-label-mono hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        i
      </button>

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute top-full left-1/2 z-50 mt-3 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface shadow-lg"
        >
          {message}
        </div>
      )}
    </div>
  )
}
