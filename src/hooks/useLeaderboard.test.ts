import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLeaderboard } from './useLeaderboard'

const mockQuery = {
  select: vi.fn(),
  not: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  eq: vi.fn(),
}

// Each method returns the same mockQuery object to support chaining
Object.values(mockQuery).forEach((fn) => {
  ;(fn as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery)
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => mockQuery,
  },
}))

const sampleEntries = [
  {
    id: 'uuid-1',
    user_name: '1등',
    click_count: 2,
    elapsed_ms: 5000,
    start_article: '이순신',
    end_article: '세종대왕',
  },
]

beforeEach(() => {
  Object.values(mockQuery).forEach((fn) => {
    ;(fn as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery)
  })
})

describe('useLeaderboard', () => {
  it('쿼리 성공 시 entries가 설정된다', async () => {
    mockQuery.eq.mockResolvedValueOnce({ data: sampleEntries, error: null })

    const { result } = renderHook(() => useLeaderboard('random', '', 'elapsed_ms'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].user_name).toBe('1등')
    expect(result.current.error).toBeNull()
  })

  it('쿼리 실패 시 error가 설정된다', async () => {
    mockQuery.eq.mockResolvedValueOnce({ data: null, error: { message: 'query error' } })

    const { result } = renderHook(() => useLeaderboard('daily', '2026-06-16', 'click_count'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toBe('query error')
    expect(result.current.entries).toHaveLength(0)
  })
})
