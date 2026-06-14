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
    <div className="min-h-screen bg-background circuit-bg flex flex-col items-center justify-center p-gutter">
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant w-full max-w-lg p-stack-lg flex flex-col gap-stack-md">
        <div className="text-center">
          <p className="font-headline-md text-headline-md text-primary mb-1">도착!</p>
          <p className="text-on-surface-variant font-body-sm text-body-sm">
            {result.startArticle} → {result.endArticle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-stack-sm">
          <div className="bg-surface-container-low rounded-xl p-stack-md text-center">
            <p className="text-label-mono font-label-mono text-on-surface-variant mb-1 uppercase tracking-wider">소요 시간</p>
            <p className="font-display-timer text-display-timer text-on-surface glow-timer">
              {formatTime(result.elapsedMs)}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-stack-md text-center">
            <p className="text-label-mono font-label-mono text-on-surface-variant mb-1 uppercase tracking-wider">클릭 수</p>
            <p className="text-2xl font-semibold text-on-surface">{result.clickCount}번</p>
          </div>
        </div>

        <div>
          <p className="text-label-mono font-label-mono text-on-surface-variant mb-2 uppercase tracking-wider">이동 경로</p>
          <ol className="flex flex-col gap-1">
            {result.path.map((title, i) => (
              <li key={i} className="flex items-center gap-2 font-body-sm text-body-sm">
                {i > 0 && <span className="text-outline-variant text-xs">↓</span>}
                <span
                  className={
                    i === result.path.length - 1
                      ? 'font-semibold text-primary'
                      : 'text-on-surface-variant'
                  }
                >
                  {title}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {saveError && (
          <p className="text-xs text-error text-center font-body-sm">기록 저장에 실패했습니다.</p>
        )}

        <div className="border-t border-outline-variant pt-stack-md flex flex-col gap-stack-sm">
          <p className="font-body-sm text-body-sm font-semibold text-on-surface">닉네임을 입력하고 순위를 확인하세요</p>
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
              className="flex-1 px-3 py-2 border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={!nickname.trim() || isSubmitting || !isSaved}
              className="px-4 py-2 bg-primary-container text-on-primary-container font-body-sm text-body-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-green"
            >
              {isSubmitting ? '저장 중...' : '확인'}
            </button>
          </div>
          {submitError && <p className="text-xs text-error font-body-sm">{submitError}</p>}
          {!isSaved && !saveError && (
            <p className="text-xs text-on-surface-variant font-body-sm">기록 저장 중...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultPage
