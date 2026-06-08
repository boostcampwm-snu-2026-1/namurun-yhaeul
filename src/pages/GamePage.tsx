import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { useArticle } from '../hooks/useArticle'
import { useRedirect } from '../hooks/useRedirect'
import { ArticleViewer } from '../components/ArticleViewer'
import { GameHeader } from '../components/GameHeader'

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

  // Capture initial game params as stable strings (useState initial value runs once)
  const [gameStart] = useState<string>(() => locationState?.start ?? '')
  const [gameEnd] = useState<string>(() => locationState?.end ?? '')

  const { elapsedMs, clickCount, startGame, recordVisit } = useGame()
  const { article, isLoading, error: articleError, loadArticle } = useArticle()
  const { resolveRedirect } = useRedirect()

  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isNavigatingRef = useRef(false)

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

      e.preventDefault()

      const href = anchor.getAttribute('href') ?? ''
      // namumark 내부 링크는 /w/<encoded-title> 형식, 카테고리는 게임에서 차단
      if (!href.startsWith('/w/') || href.startsWith('/w/category:')) return

      if (isNavigatingRef.current) return
      isNavigatingRef.current = true

      try {
        const rawTitle = decodeURIComponent(href.slice(3).split('#')[0])
        const resolved = await resolveRedirect(rawTitle)
        await loadArticle(resolved)
        recordVisit(resolved)
      } catch {
        showToast('이동이 불가능합니다')
      } finally {
        isNavigatingRef.current = false
      }
    },
    [resolveRedirect, loadArticle, recordVisit, showToast],
  )

  if (!gameStart || !gameEnd) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">잘못된 접근입니다.</p>
      </div>
    )
  }

  if (!isLoading && !article && articleError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">문서를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <GameHeader targetTitle={gameEnd} elapsedMs={elapsedMs} clickCount={clickCount} />

      <div className="flex-1 relative">
        {isLoading && !article && (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">불러오는 중...</p>
          </div>
        )}

        {article && (
          <div className="relative" onClick={(e) => void handleClick(e)}>
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm">이동 중...</p>
              </div>
            )}
            <ArticleViewer article={article} />
          </div>
        )}
      </div>

      <div className="fixed bottom-4 left-4">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
        >
          게임 포기
        </button>
      </div>

      {toast !== null && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  )
}

export default GamePage
