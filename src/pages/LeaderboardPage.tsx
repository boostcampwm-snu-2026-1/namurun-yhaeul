import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { AppHeader } from '../components/AppHeader'

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
    <div className="min-h-screen bg-background circuit-bg">
      <AppHeader />
      <div className="pt-16 flex flex-col items-center py-stack-lg px-gutter">
      <div className="w-full max-w-content-max-width flex flex-col gap-stack-lg">
        <div className="text-center">
          <p className="font-headline-md text-headline-md text-on-surface mb-1">전체 순위</p>
          <p className="text-on-surface-variant font-body-sm text-body-sm">
            {state.startArticle} → {state.endArticle}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          {isLoading && (
            <div className="p-8 text-center text-on-surface-variant font-body-sm text-body-sm">불러오는 중...</div>
          )}

          {!isLoading && error && (
            <div className="p-8 text-center text-error font-body-sm text-body-sm">
              순위를 불러올 수 없습니다.
            </div>
          )}

          {!isLoading && !error && entries.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant font-body-sm text-body-sm">아직 기록이 없습니다.</div>
          )}

          {!isLoading && !error && entries.length > 0 && (
            <table className="w-full font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-highest text-on-surface-variant font-label-mono text-label-mono uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-10">순위</th>
                  <th className="px-4 py-3 text-left">닉네임</th>
                  <th className="px-4 py-3 text-center">클릭 수</th>
                  <th className="px-4 py-3 text-center">소요 시간</th>
                  <th className="px-4 py-3 text-left">시작 문서</th>
                  <th className="px-4 py-3 text-left">도착 문서</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isCurrentUser = entry.id === state.recordId
                  return (
                    <tr
                      key={entry.id}
                      className={`border-t border-outline-variant ${isCurrentUser ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}
                    >
                      <td className="px-4 py-3 text-center font-semibold">
                        {i === 0 ? (
                          <span className="text-tertiary-fixed-dim">1</span>
                        ) : i === 1 ? (
                          <span className="text-secondary-fixed-dim">2</span>
                        ) : i === 2 ? (
                          <span className="text-tertiary">3</span>
                        ) : (
                          <span className="text-on-surface-variant">{i + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={isCurrentUser ? 'font-bold text-primary' : 'text-on-surface'}>
                          {entry.user_name}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-primary font-label-mono">← 나</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-on-surface">{entry.click_count}</td>
                      <td className="px-4 py-3 text-center font-display-timer text-on-surface">
                        {formatTime(entry.elapsed_ms)}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant truncate max-w-[120px]">
                        {entry.start_article}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant truncate max-w-[120px]">
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
          className="w-full py-3 bg-primary text-on-primary font-body-sm font-semibold rounded-xl hover:brightness-110 transition-all"
        >
          다시 하기
        </button>
      </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
