import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useArticleSummary } from './useArticleSummary'

const { mockMaybeSingle, mockInvoke } = vi.hoisted(() => ({
  mockMaybeSingle: vi.fn(),
  mockInvoke: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  ARTICLE_SUMMARY_FUNCTION_NAME: 'article-summary',
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
    functions: {
      invoke: mockInvoke,
    },
  },
}))

describe('useArticleSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('캐시된 요약이 있으면 즉시 성공 상태를 반환한다', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { summary: '조선의 제4대 임금으로 한글 창제를 주도했다.' } })

    const { result } = renderHook(() => useArticleSummary('세종대왕'))

    await waitFor(() => expect(result.current.status).toBe('success'))

    expect(result.current.summary).toBe('조선의 제4대 임금으로 한글 창제를 주도했다.')
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('캐시가 없으면 Edge Function을 호출해 요약을 생성한다', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { summary: null } })
    mockInvoke.mockResolvedValue({
      data: { summary: '임진왜란 당시 활약한 조선의 장군으로 거북선과 한산도 대첩으로 유명하다.', source: 'generated' },
      error: null,
    })

    const { result } = renderHook(() => useArticleSummary('이순신'))

    await waitFor(() => expect(result.current.status).toBe('success'))

    expect(result.current.summary).toContain('임진왜란')
    expect(mockInvoke).toHaveBeenCalledWith('article-summary', {
      body: { title: '이순신' },
    })
  })

  it('요약 생성에 실패하면 error 상태를 반환한다', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { summary: null } })
    mockInvoke.mockResolvedValue({ data: null, error: new Error('invoke failed') })

    const { result } = renderHook(() => useArticleSummary('없는문서'))

    await waitFor(() => expect(result.current.status).toBe('error'))

    expect(result.current.summary).toBeNull()
  })
})
