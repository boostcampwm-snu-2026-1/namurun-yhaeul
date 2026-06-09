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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-1">리더보드</p>
          <p className="text-gray-500 text-sm">
            {state.startArticle} → {state.endArticle}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {isLoading && (
            <div className="p-8 text-center text-gray-400 text-sm">불러오는 중...</div>
          )}

          {!isLoading && error && (
            <div className="p-8 text-center text-red-400 text-sm">
              순위를 불러올 수 없습니다.
            </div>
          )}

          {!isLoading && !error && entries.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">아직 기록이 없습니다.</div>
          )}

          {!isLoading && !error && entries.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
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
                      className={`border-t ${isCurrentUser ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 text-center font-bold text-gray-500">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className={isCurrentUser ? 'font-bold text-yellow-700' : 'text-gray-700'}>
                          {entry.user_name}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-yellow-500">← 나</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{entry.click_count}번</td>
                      <td className="px-4 py-3 text-center font-mono text-gray-700">
                        {formatTime(entry.elapsed_ms)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[120px]">
                        {entry.start_article}
                      </td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[120px]">
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
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          다시 하기
        </button>
      </div>
    </div>
  )
}

export default LeaderboardPage
