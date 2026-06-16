import { useState, useRef, useEffect, useCallback } from 'react'

interface GameState {
  elapsedMs: number
  clickCount: number
  path: string[]
  isRunning: boolean
}

const INITIAL_STATE: GameState = {
  elapsedMs: 0,
  clickCount: 0,
  path: [],
  isRunning: false,
}

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE)
  const startTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [])

  const startGame = useCallback((startArticle: string) => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)

    const startTime = Date.now()
    startTimeRef.current = startTime

    setState({
      elapsedMs: 0,
      clickCount: 0,
      path: [startArticle],
      isRunning: true,
    })

    intervalRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        elapsedMs: Date.now() - startTime,
      }))
    }, 100)
  }, [])

  const recordVisit = useCallback((title: string) => {
    setState((prev) => ({
      ...prev,
      path: [...prev.path, title],
      clickCount: prev.clickCount + 1,
    }))
  }, [])

  const undoLastVisit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      path: prev.path.slice(0, -1),
      clickCount: Math.max(0, prev.clickCount - 1),
    }))
  }, [])

  const stopGame = useCallback((): number => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    const finalElapsed = startTimeRef.current !== null ? Date.now() - startTimeRef.current : 0
    setState((prev) => ({
      ...prev,
      elapsedMs: finalElapsed,
      isRunning: false,
    }))
    return finalElapsed
  }, [])

  return { ...state, startGame, recordVisit, undoLastVisit, stopGame }
}
