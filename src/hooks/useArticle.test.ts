import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useArticle } from './useArticle'

vi.mock('../lib/r2', () => ({
  fetchArticle: vi.fn(),
}))

import { fetchArticle } from '../lib/r2'
const mockFetchArticle = vi.mocked(fetchArticle)

beforeEach(() => {
  mockFetchArticle.mockReset()
})

describe('useArticle', () => {
  it('성공 시 article 상태가 업데이트된다', async () => {
    const article = { title: '이순신', text: '이순신은...' }
    mockFetchArticle.mockResolvedValue(article)

    const { result } = renderHook(() => useArticle())
    await act(async () => {
      await result.current.loadArticle('이순신')
    })

    expect(result.current.article).toEqual(article)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('실패 시 error 상태를 설정하고 throw한다', async () => {
    const err = new Error('네트워크 오류')
    mockFetchArticle.mockRejectedValue(err)

    const { result } = renderHook(() => useArticle())

    let thrown: Error | undefined
    await act(async () => {
      try {
        await result.current.loadArticle('없는문서')
      } catch (e) {
        thrown = e instanceof Error ? e : new Error(String(e))
      }
    })

    expect(thrown?.message).toBe('네트워크 오류')
    expect(result.current.article).toBeNull()
    expect(result.current.error).toEqual(err)
    expect(result.current.isLoading).toBe(false)
  })
})
