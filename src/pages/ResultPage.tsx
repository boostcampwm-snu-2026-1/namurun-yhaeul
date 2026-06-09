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
  const [nickname, setNickname] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!result) navigate('/', { replace: true })
  }, [result, navigate])

  const { isSaved, saveError, recordId, updateUserName } = useGameRecord(result)

  const handleSubmit = async () => {
    if (!nickname.trim() || isSubmitting || !isSaved) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await updateUserName(nickname.trim())
      navigate('/leaderboard', {
        state: {
          startArticle: result!.startArticle,
          endArticle: result!.endArticle,
          recordId,
        },
      })
    } catch {
      setSubmitError('저장에 실패했습니다. 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

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

        <div className="border-t pt-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-700">닉네임을 입력하고 순위를 확인하세요</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSubmit()
              }}
              placeholder="닉네임 입력"
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={!nickname.trim() || isSubmitting || !isSaved}
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '저장 중...' : '확인'}
            </button>
          </div>
          {submitError && <p className="text-xs text-red-400">{submitError}</p>}
          {!isSaved && !saveError && (
            <p className="text-xs text-gray-400">기록 저장 중...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultPage
