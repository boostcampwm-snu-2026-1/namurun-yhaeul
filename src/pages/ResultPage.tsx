import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameRecord } from '../hooks/useGameRecord'

interface ResultState {
  startArticle: string
  endArticle: string
  path: string[]
  elapsedMs: number
  clickCount: number
}

function isResultState(value: unknown): value is ResultState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.startArticle === 'string' &&
    typeof v.endArticle === 'string' &&
    Array.isArray(v.path) &&
    typeof v.elapsedMs === 'number' &&
    typeof v.clickCount === 'number'
  )
}

function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSeconds = Math.floor(totalTenths / 10)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}

function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [result] = useState<ResultState | null>(() =>
    isResultState(location.state) ? location.state : null,
  )

  useEffect(() => {
    if (!result) navigate('/', { replace: true })
  }, [result, navigate])

  const { saveError } = useGameRecord(result)

  if (!result) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8 flex flex-col gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-green-600 mb-1">도착!</p>
          <p className="text-gray-500 text-sm">
            {result.startArticle} → {result.endArticle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">소요 시간</p>
            <p className="text-2xl font-mono font-semibold text-gray-800">
              {formatTime(result.elapsedMs)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">클릭 수</p>
            <p className="text-2xl font-semibold text-gray-800">{result.clickCount}번</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">이동 경로</p>
          <ol className="flex flex-col gap-1">
            {result.path.map((title, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {i > 0 && <span className="text-gray-300 text-xs">↓</span>}
                <span
                  className={
                    i === result.path.length - 1
                      ? 'font-semibold text-green-700'
                      : 'text-gray-600'
                  }
                >
                  {title}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {saveError && (
          <p className="text-xs text-red-400 text-center">기록 저장에 실패했습니다.</p>
        )}

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

export default ResultPage
