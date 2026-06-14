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
    <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant bg-surface-container sticky top-0 z-10">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-on-surface-variant font-mono uppercase tracking-widest">목표</span>
        <span className="font-headline font-bold text-on-surface text-sm leading-tight">{targetTitle}</span>
      </div>

      <div
        className="font-mono text-4xl font-bold text-primary tracking-tight"
        style={{ textShadow: '0 0 12px var(--color-primary)' }}
      >
        {formatTime(elapsedMs)}
      </div>

      <div className="flex flex-col gap-0.5 items-end">
        <span className="text-xs text-on-surface-variant font-mono uppercase tracking-widest">클릭</span>
        <span className="font-mono font-bold text-on-surface text-sm">{clickCount}</span>
      </div>
    </div>
  )
}
