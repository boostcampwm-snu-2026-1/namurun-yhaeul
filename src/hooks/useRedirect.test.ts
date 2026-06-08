import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRedirect } from './useRedirect'

const mockMaybeSingle = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  },
}))

beforeEach(() => {
  mockMaybeSingle.mockReset()
})

describe('useRedirect', () => {
  it('리다이렉트가 있으면 target을 반환한다', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { target: '나스닥' }, error: null })

    const { result } = renderHook(() => useRedirect())
    const resolved = await result.current.resolveRedirect('NASDAQ')

    expect(resolved).toBe('나스닥')
  })

  it('리다이렉트가 없으면 입력 title을 그대로 반환한다', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useRedirect())
    const resolved = await result.current.resolveRedirect('이순신')

    expect(resolved).toBe('이순신')
  })

  it('Supabase 오류 시 입력 title을 그대로 반환한다', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const { result } = renderHook(() => useRedirect())
    const resolved = await result.current.resolveRedirect('이순신')

    expect(resolved).toBe('이순신')
  })
})
