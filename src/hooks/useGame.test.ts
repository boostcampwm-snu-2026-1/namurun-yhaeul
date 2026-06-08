import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGame } from './useGame'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useGame', () => {
  describe('startGame', () => {
    it('초기 상태로 리셋하고 path에 시작 문서를 추가한다', () => {
      const { result } = renderHook(() => useGame())

      act(() => {
        result.current.startGame('이순신')
      })

      expect(result.current.path).toEqual(['이순신'])
      expect(result.current.clickCount).toBe(0)
      expect(result.current.isRunning).toBe(true)
    })

    it('타이머가 경과 시간을 밀리초로 추적한다', () => {
      const { result } = renderHook(() => useGame())

      act(() => {
        result.current.startGame('이순신')
      })

      act(() => {
        vi.advanceTimersByTime(1500)
      })

      expect(result.current.elapsedMs).toBeGreaterThanOrEqual(1500)
    })

    it('재시작 시 이전 상태를 초기화한다', () => {
      const { result } = renderHook(() => useGame())

      act(() => { result.current.startGame('이순신') })
      act(() => { result.current.recordVisit('조선') })
      act(() => { result.current.startGame('세종대왕') })

      expect(result.current.path).toEqual(['세종대왕'])
      expect(result.current.clickCount).toBe(0)
    })
  })

  describe('recordVisit', () => {
    it('path에 문서를 추가하고 clickCount를 1 증가시킨다', () => {
      const { result } = renderHook(() => useGame())

      act(() => { result.current.startGame('이순신') })
      act(() => { result.current.recordVisit('조선') })
      act(() => { result.current.recordVisit('한국') })

      expect(result.current.path).toEqual(['이순신', '조선', '한국'])
      expect(result.current.clickCount).toBe(2)
    })
  })

  describe('stopGame', () => {
    it('isRunning을 false로 바꾸고 타이머를 정지한다', () => {
      const { result } = renderHook(() => useGame())

      act(() => { result.current.startGame('이순신') })
      act(() => { vi.advanceTimersByTime(1000) })
      act(() => { result.current.stopGame() })

      const elapsedAtStop = result.current.elapsedMs
      expect(result.current.isRunning).toBe(false)

      act(() => { vi.advanceTimersByTime(1000) })
      expect(result.current.elapsedMs).toBe(elapsedAtStop)
    })
  })
})
