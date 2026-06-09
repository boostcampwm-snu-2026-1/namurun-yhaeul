import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLeaderboard } from './useLeaderboard'

const mockLimit = vi.fn()
const mockOrder2 = vi.fn(() => ({ limit: mockLimit }))
const mockOrder1 = vi.fn(() => ({ order: mockOrder2 }))
const mockNot = vi.fn(() => ({ order: mockOrder1 }))
const mockEqEnd = vi.fn(() => ({ not: mockNot }))
const mockEqStart = vi.fn(() => ({ eq: mockEqEnd }))
const mockSelect = vi.fn(() => ({ eq: mockEqStart }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: mockSelect }),
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
  mockLimit.mockReset()
})

describe('useLeaderboard', () => {
  it('쿼리 성공 시 entries가 설정된다', async () => {
    mockLimit.mockResolvedValue({ data: sampleEntries, error: null })

    const { result } = renderHook(() => useLeaderboard('이순신', '세종대왕'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].user_name).toBe('1등')
    expect(result.current.error).toBeNull()
  })

  it('쿼리 실패 시 error가 설정된다', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'query error' } })

    const { result } = renderHook(() => useLeaderboard('이순신', '세종대왕'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toBe('query error')
    expect(result.current.entries).toHaveLength(0)
  })
})
