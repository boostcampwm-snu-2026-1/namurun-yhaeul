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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="bg-surface-container border border-outline-variant rounded-lg w-full max-w-lg p-8 flex flex-col gap-6">

        <div className="text-center flex flex-col gap-1">
          <p className="font-headline text-3xl font-extrabold text-primary">목표 도달!</p>
          <p className="text-on-surface-variant text-sm font-mono">
            {result.startArticle} → {result.endArticle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-high rounded p-4 text-center flex flex-col gap-1">
            <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest">소요 시간</p>
            <p className="text-2xl font-mono font-bold text-on-surface" style={{ textShadow: '0 0 8px var(--color-primary)' }}>
              {formatTime(result.elapsedMs)}
            </p>
          </div>
          <div className="bg-surface-container-high rounded p-4 text-center flex flex-col gap-1">
            <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest">클릭 수</p>
            <p className="text-2xl font-mono font-bold text-on-surface">{result.clickCount}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest mb-2">이동 경로</p>
          <ol className="flex flex-col gap-1">
            {result.path.map((title, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {i > 0 && <span className="text-outline text-xs">↓</span>}
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
          <p className="text-xs text-error text-center">기록 저장에 실패했습니다.</p>
        )}

        <div className="border-t border-outline-variant pt-4 flex flex-col gap-3">
          <p className="text-sm font-headline font-bold text-on-surface">닉네임을 입력하고 순위를 확인하세요</p>
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
              className="flex-1 px-3 py-2 bg-surface-container-highest border border-outline-variant rounded text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={!nickname.trim() || isSubmitting || !isSaved}
              className="px-4 py-2 bg-primary-container text-on-primary-container text-sm font-headline font-bold rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {isSubmitting ? '저장 중...' : '확인'}
            </button>
          </div>
          {submitError && <p className="text-xs text-error">{submitError}</p>}
          {!isSaved && !saveError && (
            <p className="text-xs text-on-surface-variant font-mono">기록 저장 중...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultPage
