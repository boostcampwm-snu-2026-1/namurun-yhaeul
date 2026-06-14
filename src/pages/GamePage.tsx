import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { useArticle } from '../hooks/useArticle'
import { useRedirect } from '../hooks/useRedirect'
import { ArticleViewer } from '../components/ArticleViewer'
import { GameHeader } from '../components/GameHeader'
import { PathSidebar } from '../components/PathSidebar'

interface LocationState {
  start: string
  end: string
}

function isLocationState(value: unknown): value is LocationState {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).start === 'string' &&
    typeof (value as Record<string, unknown>).end === 'string'
  )
}

function GamePage() {
  const location = useLocation()
  const navigate = useNavigate()

  const locationState = isLocationState(location.state) ? location.state : null

  const [gameStart] = useState<string>(() => locationState?.start ?? '')
  const [gameEnd] = useState<string>(() => locationState?.end ?? '')

  const { elapsedMs, clickCount, path, startGame, recordVisit, stopGame } = useGame()
  const { article, isLoading, error: articleError, loadArticle } = useArticle()
  const { resolveRedirect } = useRedirect()

  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isNavigatingRef = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gameStart) return
    startGame(gameStart)
    void loadArticle(gameStart)
  }, [gameStart, startGame, loadArticle])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href') ?? ''

      if (href.startsWith('#')) return
      if (!href.startsWith('/w/')) {
        e.preventDefault()
        return
      }
      if (href.startsWith('/w/category:')) {
        e.preventDefault()
        return
      }

      e.preventDefault()

      if (isNavigatingRef.current) return
      isNavigatingRef.current = true

      try {
        const rawTitle = decodeURIComponent(href.slice(3).split('#')[0])
        const resolved = await resolveRedirect(rawTitle)
        await loadArticle(resolved)
        recordVisit(resolved)
        if (contentRef.current) contentRef.current.scrollTop = 0

        if (resolved === gameEnd) {
          const finalElapsed = stopGame()
          navigate('/result', {
            state: {
              startArticle: gameStart,
              endArticle: gameEnd,
              path: [...path, resolved],
              elapsedMs: finalElapsed,
              clickCount: clickCount + 1,
            },
          })
        }
      } catch {
        showToast('이동이 불가능합니다')
      } finally {
        isNavigatingRef.current = false
      }
    },
    [resolveRedirect, loadArticle, recordVisit, showToast, gameEnd, gameStart, path, clickCount, stopGame, navigate],
  )

  if (!gameStart || !gameEnd) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-on-surface-variant">잘못된 접근입니다.</p>
      </div>
    )
  }

  if (!isLoading && !article && articleError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-error">문서를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <GameHeader targetTitle={gameEnd} elapsedMs={elapsedMs} clickCount={clickCount} />

      <div className="flex flex-1 overflow-hidden">
        <PathSidebar path={path} />

        <div className="flex-1 overflow-y-auto relative bg-surface-container-lowest" ref={contentRef}>
          {isLoading && !article && (
            <div className="flex items-center justify-center p-8">
              <p className="text-on-surface-variant font-mono text-sm">불러오는 중...</p>
            </div>
          )}

          {article && (
            <div className="relative" onClick={(e) => void handleClick(e)}>
              {isLoading && (
                <div className="absolute inset-0 bg-surface/60 z-10 flex items-center justify-center pointer-events-none">
                  <p className="text-on-surface-variant text-sm font-mono">이동 중...</p>
                </div>
              )}
              <ArticleViewer article={article} />
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 left-4">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded hover:border-error hover:text-error transition-colors text-sm font-mono"
        >
          게임 포기
        </button>
      </div>

      {toast !== null && (
        <div className="fixed bottom-4 right-4 bg-error-container text-on-error-container px-4 py-2 rounded shadow-lg text-sm font-mono">
          {toast}
        </div>
      )}
    </div>
  )
}

export default GamePage
