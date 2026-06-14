interface Props {
  targetTitle: string
  elapsedMs: number
  clickCount: number
  onQuit: () => void
}

function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSeconds = Math.floor(totalTenths / 10)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}

export function GameHeader({ targetTitle, elapsedMs, clickCount, onQuit }: Props) {
  return (
    <header className="bg-surface-container-low border-b border-outline-variant shadow-[0_0_12px_rgba(0,164,149,0.1)] flex justify-between items-center w-full h-20 px-gutter sticky top-0 z-50">
      {/* Left: mission status */}
      <div className="flex flex-col">
        <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          미션 상태
        </span>
        <span className="font-body-sm text-body-sm font-bold text-primary">
          목표: {targetTitle}
        </span>
      </div>

      {/* Center: timer + click count */}
      <div className="flex items-center gap-stack-lg">
        <div className="flex flex-col items-center">
          <span className="font-label-mono text-label-mono text-on-surface-variant">경과 시간</span>
          <span className="font-display-timer text-display-timer text-primary glow-timer">
            {formatTime(elapsedMs)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-label-mono text-label-mono text-on-surface-variant">클릭 횟수</span>
          <span className="font-display-timer text-display-timer text-primary">
            {clickCount}
          </span>
        </div>
      </div>

      {/* Right: quit button */}
      <button
        onClick={onQuit}
        className="px-6 py-2 border-2 border-error text-error font-label-mono text-label-mono uppercase tracking-tighter hover:bg-error hover:text-on-error transition-all active:scale-95"
      >
        포기하기
      </button>
    </header>
  )
}
