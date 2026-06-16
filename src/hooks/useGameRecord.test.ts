import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useGameRecord } from './useGameRecord'

const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockUpdate = vi.fn(() => ({ eq: mockEq }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: mockInsert,
      update: mockUpdate,
    }),
  },
}))

const testResult = {
  startArticle: '이순신',
  endArticle: '세종대왕',
  path: ['이순신', '조선', '세종대왕'],
  elapsedMs: 12345,
  clickCount: 2,
  challengeType: 'random' as const,
}

beforeEach(() => {
  mockSingle.mockReset()
  mockEq.mockReset()
})

describe('useGameRecord', () => {
  it('result가 null이면 INSERT를 호출하지 않는다', () => {
    renderHook(() => useGameRecord(null))
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('INSERT 성공 시 isSaved=true, recordId가 설정된다', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'test-uuid-1234' }, error: null })

    const { result } = renderHook(() => useGameRecord(testResult))

    await waitFor(() => expect(result.current.isSaved).toBe(true))
    expect(result.current.recordId).toBe('test-uuid-1234')
    expect(result.current.saveError).toBeNull()
  })

  it('INSERT 실패 시 saveError가 설정된다', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const { result } = renderHook(() => useGameRecord(testResult))

    await waitFor(() => expect(result.current.saveError).not.toBeNull())
    expect(result.current.saveError?.message).toBe('DB error')
    expect(result.current.isSaved).toBe(false)
  })

  it('updateUserName은 recordId로 UPDATE를 호출한다', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'test-uuid-1234' }, error: null })
    mockEq.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useGameRecord(testResult))
    await waitFor(() => expect(result.current.recordId).toBe('test-uuid-1234'))

    await result.current.updateUserName('테스터')

    expect(mockEq).toHaveBeenCalledWith('id', 'test-uuid-1234')
  })

  it('updateUserName은 recordId가 없으면 에러를 던진다', async () => {
    const { result } = renderHook(() => useGameRecord(null))

    await expect(result.current.updateUserName('테스터')).rejects.toThrow()
  })
})
