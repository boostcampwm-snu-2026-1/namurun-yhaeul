import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMainPage } from './useMainPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockMaybySingle = vi.fn()
const mockLimit = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'daily_prompts') {
        return { select: () => ({ eq: () => ({ maybeSingle: mockMaybySingle }) }) }
      }
      return { select: () => ({ order: () => ({ limit: mockLimit }) }) }
    },
  },
}))

const TOP_100 = Array.from({ length: 100 }, (_, i) => ({ title: `문서${i}` }))

describe('useMainPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('일일 문제가 있으면 dailyPrompt를 세팅한다', async () => {
    mockMaybySingle.mockResolvedValue({
      data: { start_article: '이순신', end_article: '세종대왕' },
      error: null,
    })
    mockLimit.mockResolvedValue({ data: TOP_100, error: null })

    const { result } = renderHook(() => useMainPage())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.dailyPrompt).toEqual({
      start_article: '이순신',
      end_article: '세종대왕',
    })
    expect(result.current.error).toBeNull()
  })

  it('daily_prompts가 null이면 dailyPrompt는 null이다', async () => {
    mockMaybySingle.mockResolvedValue({ data: null, error: null })
    mockLimit.mockResolvedValue({ data: TOP_100, error: null })

    const { result } = renderHook(() => useMainPage())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.dailyPrompt).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('articles 조회 실패 시 error를 세팅한다', async () => {
    mockMaybySingle.mockResolvedValue({ data: null, error: null })
    mockLimit.mockResolvedValue({ data: null, error: new Error('DB error') })

    const { result } = renderHook(() => useMainPage())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).not.toBeNull()
  })

  it('startRandom이 /game으로 navigate하며 start와 end를 전달한다', async () => {
    mockMaybySingle.mockResolvedValue({ data: null, error: null })
    mockLimit.mockResolvedValue({ data: TOP_100, error: null })

    const { result } = renderHook(() => useMainPage())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.startRandom()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/game', {
      state: expect.objectContaining({
        start: expect.any(String),
        end: expect.any(String),
      }),
    })
  })

  it('startDaily가 dailyPrompt의 start/end로 /game에 navigate한다', async () => {
    mockMaybySingle.mockResolvedValue({
      data: { start_article: '이순신', end_article: '세종대왕' },
      error: null,
    })
    mockLimit.mockResolvedValue({ data: TOP_100, error: null })

    const { result } = renderHook(() => useMainPage())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.startDaily()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/game', {
      state: { start: '이순신', end: '세종대왕' },
    })
  })
})
