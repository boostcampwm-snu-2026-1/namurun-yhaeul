import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLeaderboard } from '../hooks/useLeaderboard'

interface LeaderboardState {
  startArticle: string
  endArticle: string
  recordId: string | null
}

function isLeaderboardState(value: unknown): value is LeaderboardState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.startArticle === 'string' && typeof v.endArticle === 'string'
}

function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSeconds = Math.floor(totalTenths / 10)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}

function LeaderboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [state] = useState<LeaderboardState | null>(() =>
    isLeaderboardState(location.state) ? location.state : null,
  )

  useEffect(() => {
    if (!state) navigate('/', { replace: true })
  }, [state, navigate])

  const { entries, isLoading, error } = useLeaderboard(
    state?.startArticle ?? '',
    state?.endArticle ?? '',
  )

  if (!state) return null

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        <div className="text-center flex flex-col gap-1">
          <p className="font-headline text-2xl font-extrabold text-on-surface">전체 순위</p>
          <p className="text-on-surface-variant text-sm font-mono">
            {state.startArticle} → {state.endArticle}
          </p>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
          {isLoading && (
            <div className="p-8 text-center text-on-surface-variant text-sm font-mono">불러오는 중...</div>
          )}

          {!isLoading && error && (
            <div className="p-8 text-center text-error text-sm font-mono">
              순위를 불러올 수 없습니다.
            </div>
          )}

          {!isLoading && !error && entries.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant text-sm font-mono">아직 기록이 없습니다.</div>
          )}

          {!isLoading && !error && entries.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-high text-on-surface-variant text-xs font-mono uppercase">
                  <th className="px-4 py-3 text-center w-10">순위</th>
                  <th className="px-4 py-3 text-left">닉네임</th>
                  <th className="px-4 py-3 text-center">클릭</th>
                  <th className="px-4 py-3 text-center">시간</th>
                  <th className="px-4 py-3 text-left">시작</th>
                  <th className="px-4 py-3 text-left">도착</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isCurrentUser = entry.id === state.recordId
                  return (
                    <tr
                      key={entry.id}
                      className={`border-t border-outline-variant ${
                        isCurrentUser
                          ? 'bg-primary-container/20'
                          : 'hover:bg-surface-container-high'
                      }`}
                    >
                      <td className="px-4 py-3 text-center font-mono font-bold text-on-surface-variant">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className={isCurrentUser ? 'font-bold text-primary' : 'text-on-surface'}>
                          {entry.user_name}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-primary font-mono">← 나</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-on-surface">{entry.click_count}</td>
                      <td className="px-4 py-3 text-center font-mono text-on-surface">
                        {formatTime(entry.elapsed_ms)}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant truncate max-w-[120px] font-mono text-xs">
                        {entry.start_article}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant truncate max-w-[120px] font-mono text-xs">
                        {entry.end_article}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 border border-primary text-primary font-headline font-bold rounded hover:bg-primary hover:text-on-primary transition-colors"
        >
          다시 하기
        </button>
      </div>
    </div>
  )
}

export default LeaderboardPage
