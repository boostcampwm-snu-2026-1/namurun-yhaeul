import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { useArticle } from '../hooks/useArticle'
import { useRedirect } from '../hooks/useRedirect'
import { ArticleViewer } from '../components/ArticleViewer'
import { GameHeader } from '../components/GameHeader'
import { PathSidebar } from '../components/PathSidebar'
import { QuitConfirmModal } from '../components/QuitConfirmModal'

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

  const { elapsedMs, clickCount, path, startGame, recordVisit, stopGame } = useGame()
  const { article, isLoading, error: articleError, loadArticle, loadArticleOptimistic } = useArticle()
  const { resolveRedirect } = useRedirect()

  const [toast, setToast] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false)
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

  // Worker 파싱 완료 후 잠금 해제 — article 상태 변경(R2 fetch 완료) 시점이 아닌
  // namumark HTML이 실제로 DOM에 커밋된 이후 클릭을 허용해야 연타 문제가 해결됨
  const handleArticleReady = useCallback(() => {
    isNavigatingRef.current = false
    setIsRendering(false)
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

      // 섹션 앵커(#s-1.1, #fn-1 등): 브라우저 기본 스크롤에 맡김
      if (href.startsWith('#')) return

      // 외부 링크 — 토스트 후 차단
      if (anchor.classList.contains('opennamu_link_out')) {
        e.preventDefault()
        showToast('외부 링크입니다!')
        return
      }

      // 그 외 비내부 링크 차단 (/edit_section/, /upload 등)
      if (!href.startsWith('/w/')) {
        e.preventDefault()
        return
      }

      // 카테고리 링크 차단
      if (href.startsWith('/w/category:')) {
        e.preventDefault()
        return
      }

      // 내부 wiki 문서 링크: 게임 이동 처리
      e.preventDefault()

      if (isNavigatingRef.current) return
      isNavigatingRef.current = true
      setIsRendering(true)

      try {
        const rawTitle = decodeURIComponent(href.slice(3).split('#')[0])
        const resolved = await loadArticleOptimistic(rawTitle, resolveRedirect)
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
        isNavigatingRef.current = false
        setIsRendering(false)
      }
    },
    [resolveRedirect, loadArticleOptimistic, recordVisit, showToast, gameEnd, gameStart, path, clickCount, stopGame, navigate],
  )

  if (!gameStart || !gameEnd) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-on-surface-variant font-body-sm text-body-sm">잘못된 접근입니다.</p>
      </div>
    )
  }

  if (!isLoading && !article && articleError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-error font-body-sm text-body-sm">문서를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <GameHeader targetTitle={gameEnd} elapsedMs={elapsedMs} clickCount={clickCount} onQuit={() => setIsQuitModalOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <PathSidebar path={path} />

        <div className="flex-1 overflow-y-auto relative" ref={contentRef}>
          {isLoading && !article && (
            <div className="flex items-center justify-center p-8">
              <p className="text-on-surface-variant font-body-sm text-body-sm">불러오는 중...</p>
            </div>
          )}

          {article && (
            <div className="relative" onClick={(e) => void handleClick(e)}>
              {isRendering && (
                <div className="absolute inset-0 bg-surface/60 z-10 flex items-center justify-center pointer-events-none">
                  <p className="text-on-surface-variant font-body-sm text-body-sm">이동 중...</p>
                </div>
              )}
              <ArticleViewer article={article} onReady={handleArticleReady} />
            </div>
          )}
        </div>
      </div>

      {toast !== null && (
        <div className="fixed bottom-4 right-4 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-lg shadow-lg font-body-sm text-body-sm">
          {toast}
        </div>
      )}

      {isQuitModalOpen && (
        <QuitConfirmModal
          onConfirm={() => navigate('/')}
          onCancel={() => setIsQuitModalOpen(false)}
        />
      )}
    </div>
  )
}

export default GamePage
