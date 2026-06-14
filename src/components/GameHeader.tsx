interface Props {
  targetTitle: string
  elapsedMs: number
  clickCount: number
}

function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSeconds = Math.floor(totalTenths / 10)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}

export function GameHeader({ targetTitle, elapsedMs, clickCount }: Props) {
  return (
    <div className="flex items-center justify-between px-gutter py-3 border-b border-outline-variant bg-surface-container-low sticky top-0 z-10">
      <div className="font-body-sm text-body-sm">
        <span className="text-on-surface-variant">목표: </span>
        <span className="font-semibold text-on-surface">{targetTitle}</span>
      </div>
      <div className="font-display-timer text-display-timer text-primary glow-timer">
        {formatTime(elapsedMs)}
      </div>
      <div className="font-body-sm text-body-sm">
        <span className="text-on-surface-variant">클릭: </span>
        <span className="font-semibold text-on-surface">{clickCount}</span>
      </div>
    </div>
  )
}
