import { formatTime } from '../lib/formatTime'
import { GoalArticleInfoTooltip } from './GoalArticleInfoTooltip'

interface Props {
  targetTitle: string
  targetSummary: string | null
  summaryStatus: 'idle' | 'loading' | 'success' | 'error'
  elapsedMs: number
  clickCount: number
  onQuit: () => void
}

export function GameHeader({
  targetTitle,
  targetSummary,
  summaryStatus,
  elapsedMs,
  clickCount,
  onQuit,
}: Props) {
  return (
    <header className="bg-surface-container-low border-b border-outline-variant shadow-[0_0_12px_rgba(0,164,149,0.1)] flex items-center w-full h-20 px-gutter sticky top-0 z-50">
      {/* Left: target */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          목표 문서
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary font-bold shrink-0">→</span>
          <span className="font-headline-md text-headline-md text-primary glow-text truncate leading-tight bg-primary/10 border border-primary/30 px-3 py-0.5">
            {targetTitle}
          </span>
          <GoalArticleInfoTooltip summary={targetSummary} status={summaryStatus} />
        </div>
      </div>

      {/* Center: timer + clicks */}
      <div className="flex items-stretch divide-x divide-outline-variant shrink-0">
        <div className="flex flex-col items-center justify-center px-stack-lg">
          <span className="font-label-mono text-label-mono text-on-surface-variant">경과 시간</span>
          <span className="font-display-timer text-display-timer text-primary glow-timer leading-none">
            {formatTime(elapsedMs)}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center px-stack-lg">
          <span className="font-label-mono text-label-mono text-on-surface-variant">이동 횟수</span>
          <span className="font-display-timer text-display-timer text-on-surface leading-none">
            {clickCount}
          </span>
        </div>
      </div>

      {/* Right: quit */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={onQuit}
          className="px-5 py-2 border border-error/60 text-error font-label-mono text-label-mono uppercase tracking-wider hover:bg-error hover:text-on-error transition-all active:scale-95"
        >
          포기
        </button>
      </div>
    </header>
  )
}
