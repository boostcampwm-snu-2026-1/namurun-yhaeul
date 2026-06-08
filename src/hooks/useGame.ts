import { useState, useRef, useEffect } from 'react'

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

  const startGame = (startArticle: string) => {
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
  }

  const recordVisit = (title: string) => {
    setState((prev) => ({
      ...prev,
      path: [...prev.path, title],
      clickCount: prev.clickCount + 1,
    }))
  }

  const stopGame = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setState((prev) => ({
      ...prev,
      elapsedMs: startTimeRef.current !== null ? Date.now() - startTimeRef.current : prev.elapsedMs,
      isRunning: false,
    }))
  }

  return { ...state, startGame, recordVisit, stopGame }
}
