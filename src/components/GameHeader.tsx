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
    <div className="flex items-center justify-between p-3 border-b bg-white sticky top-0 z-10">
      <div className="text-sm">
        <span className="text-gray-500">목표: </span>
        <span className="font-semibold">{targetTitle}</span>
      </div>
      <div className="text-lg font-mono font-bold">{formatTime(elapsedMs)}</div>
      <div className="text-sm">
        <span className="text-gray-500">클릭: </span>
        <span className="font-semibold">{clickCount}</span>
      </div>
    </div>
  )
}
