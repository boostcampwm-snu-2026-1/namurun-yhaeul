import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchRandomArticleTitle } from '../lib/articles'
import { useGame } from '../hooks/useGame'
import { useArticle } from '../hooks/useArticle'
import { useRedirect } from '../hooks/useRedirect'
import { ArticleViewer } from '../components/ArticleViewer'
import { ArticleFallbackLinks } from '../components/ArticleFallbackLinks'
import { ArticleNavButtons } from '../components/ArticleNavButtons'
import { GameHeader } from '../components/GameHeader'
import { PathSidebar } from '../components/PathSidebar'
import { QuitConfirmModal } from '../components/QuitConfirmModal'

interface LocationState {
  start: string
  end: string
}

interface GameSession {
  gameStart: string
  gameEnd: string
  path: string[]
  clickCount: number
  startTime: number
  currentArticle: string
}

const GAME_SESSION_KEY = 'namurun_game_session'

function readGameSession(): GameSession | null {
  try {
    const raw = sessionStorage.getItem(GAME_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed !== 'object' || parsed === null ||
      typeof (parsed as Record<string, unknown>).gameStart !== 'string' ||
      typeof (parsed as Record<string, unknown>).gameEnd !== 'string' ||
      !Array.isArray((parsed as Record<string, unknown>).path) ||
      typeof (parsed as Record<string, unknown>).clickCount !== 'number' ||
      typeof (parsed as Record<string, unknown>).startTime !== 'number' ||
      typeof (parsed as Record<string, unknown>).currentArticle !== 'string'
    ) return null
    return parsed as GameSession
  } catch {
    return null
  }
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

  // Restore session from sessionStorage if location.state is absent (e.g., on page refresh)
  const [savedSession] = useState<GameSession | null>(() => {
    if (locationState) return null
    return readGameSession()
  })

  // Capture initial game params as stable strings (useState initial value runs once)
  const [gameStart] = useState<string>(() => locationState?.start ?? savedSession?.gameStart ?? '')
  const [gameEnd] = useState<string>(() => locationState?.end ?? savedSession?.gameEnd ?? '')
  // On restore, load the last visited article; on fresh start, load gameStart
  const [initialArticle] = useState<string>(() => savedSession?.currentArticle ?? locationState?.start ?? '')

  const { elapsedMs, clickCount, path, startGame, restoreGame, recordVisit, undoLastVisit, stopGame } = useGame()
  const { article, isLoading, error: articleError, loadArticle, loadArticleOptimistic } = useArticle()
  const { resolveRedirect } = useRedirect()

  const [toast, setToast] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false)
  const [hasRenderError, setHasRenderError] = useState(false)
  const [hasGameStarted, setHasGameStarted] = useState(false)
  const [hasToc, setHasToc] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isNavigatingRef = useRef(false)
  const hasStartedRef = useRef(false)
  const gameStartTimeRef = useRef<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!initialArticle) return
    void loadArticle(initialArticle)
  }, [initialArticle, loadArticle])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const saveSession = useCallback((currentPath: string[], currentClickCount: number, currentArticle: string) => {
    sessionStorage.setItem(GAME_SESSION_KEY, JSON.stringify({
      gameStart,
      gameEnd,
      path: currentPath,
      clickCount: currentClickCount,
      startTime: gameStartTimeRef.current,
      currentArticle,
    } satisfies GameSession))
  }, [gameStart, gameEnd])

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(GAME_SESSION_KEY)
  }, [])

  // Worker 파싱 완료 후 잠금 해제 — article 상태 변경(R2 fetch 완료) 시점이 아닌
  // namumark HTML이 실제로 DOM에 커밋된 이후 클릭을 허용해야 연타 문제가 해결됨
  const handleArticleReady = useCallback(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      if (savedSession !== null) {
        // 새로고침 복원: 저장된 타임스탬프로 타이머 재개
        gameStartTimeRef.current = savedSession.startTime
        restoreGame(savedSession.path, savedSession.clickCount, savedSession.startTime)
      } else {
        // 최초 시작: 타이머 시작 + 세션 저장
        const startTime = Date.now()
        gameStartTimeRef.current = startTime
        startGame(gameStart)
        saveSession([gameStart], 0, gameStart)
      }
      setHasGameStarted(true)
    } else {
      isNavigatingRef.current = false
      setIsRendering(false)
    }
    setHasToc(!!contentRef.current?.querySelector('.opennamu_TOC'))
  }, [startGame, restoreGame, gameStart, savedSession, saveSession])

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const handleRenderError = useCallback(() => {
    undoLastVisit()
    setHasRenderError(true)
    isNavigatingRef.current = false
    setIsRendering(false)
  }, [undoLastVisit])

  const handleFallbackPrev = useCallback(async () => {
    if (isNavigatingRef.current) return
    const prevTitle = path[path.length - 1]
    if (!prevTitle) return
    isNavigatingRef.current = true
    setIsRendering(true)
    await loadArticle(prevTitle)
    setHasRenderError(false)
    // isRendering/isNavigatingRef reset은 handleArticleReady에서 처리
  }, [path, loadArticle])

  const handleFallbackRandom = useCallback(async () => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setIsRendering(true)
    try {
      const title = await fetchRandomArticleTitle()
      if (!title) {
        isNavigatingRef.current = false
        setIsRendering(false)
        return
      }
      const resolved = await loadArticleOptimistic(title, resolveRedirect)
      recordVisit(resolved)
      setHasRenderError(false)
      // isRendering/isNavigatingRef reset은 handleArticleReady에서 처리
    } catch {
      isNavigatingRef.current = false
      setIsRendering(false)
      showToast('이동이 불가능합니다')
    }
  }, [loadArticleOptimistic, resolveRedirect, recordVisit, showToast])

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
        const newPath = [...path, resolved]
        const newClickCount = clickCount + 1
        recordVisit(resolved)
        saveSession(newPath, newClickCount, resolved)
        if (contentRef.current) contentRef.current.scrollTop = 0

        if (resolved === gameEnd) {
          clearSession()
          const finalElapsed = stopGame()
          navigate('/result', {
            state: {
              startArticle: gameStart,
              endArticle: gameEnd,
              path: newPath,
              elapsedMs: finalElapsed,
              clickCount: newClickCount,
            },
          })
        }
      } catch {
        showToast('이동이 불가능합니다')
        isNavigatingRef.current = false
        setIsRendering(false)
      }
    },
    [resolveRedirect, loadArticleOptimistic, recordVisit, saveSession, clearSession, showToast, gameEnd, gameStart, path, clickCount, stopGame, navigate],
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

        <div className="flex-1 overflow-y-auto" ref={contentRef}>
          {!hasGameStarted && (
            <div className="flex items-center justify-center p-8">
              <p className="text-on-surface-variant font-body-sm text-body-sm">불러오는 중...</p>
            </div>
          )}

          {article && (
            <div className={hasGameStarted ? 'flex' : 'hidden'}>
              <div className="flex-1 min-w-0 relative" onClick={(e) => void handleClick(e)}>
                {isRendering && (
                  <div className="absolute inset-0 bg-surface/60 z-10 flex items-center justify-center pointer-events-none">
                    <p className="text-on-surface-variant font-body-sm text-body-sm">이동 중...</p>
                  </div>
                )}
                <ArticleViewer article={article} onReady={handleArticleReady} onRenderError={handleRenderError} />
                {hasRenderError && (
                  <ArticleFallbackLinks
                    hasPrev={path.length >= 1}
                    disabled={isRendering}
                    onPrev={() => void handleFallbackPrev()}
                    onRandom={() => void handleFallbackRandom()}
                  />
                )}
              </div>
              <div className="w-10 shrink-0 relative">
                <ArticleNavButtons containerRef={contentRef} hasToc={hasToc} />
              </div>
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
          onConfirm={() => { clearSession(); navigate('/') }}
          onCancel={() => setIsQuitModalOpen(false)}
        />
      )}
    </div>
  )
}

export default GamePage
