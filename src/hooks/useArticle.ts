import { useState, useCallback } from 'react'
import { fetchArticle, type Article } from '../lib/r2'

interface UseArticleResult {
  article: Article | null
  isLoading: boolean
  error: Error | null
  loadArticle: (title: string) => Promise<void>
  loadArticleOptimistic: (
    rawTitle: string,
    resolveRedirectFn: (title: string) => Promise<string>,
  ) => Promise<string>
}

export function useArticle(): UseArticleResult {
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadArticle = useCallback(async (title: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchArticle(title)
      setArticle(result)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  // redirect 조회와 R2 fetch를 병렬로 실행해 Supabase RTT를 체감 지연에서 제거한다.
  // redirect 문서는 R2에 없으므로 rawTitle fetch가 404면 resolved title로 재fetch한다.
  const loadArticleOptimistic = useCallback(
    async (
      rawTitle: string,
      resolveRedirectFn: (title: string) => Promise<string>,
    ): Promise<string> => {
      setIsLoading(true)
      setError(null)
      try {
        const [resolved, optimistic] = await Promise.all([
          resolveRedirectFn(rawTitle),
          fetchArticle(rawTitle).then(
            (a): { ok: true; article: Article } => ({ ok: true, article: a }),
            (): { ok: false } => ({ ok: false }),
          ),
        ])

        if (resolved === rawTitle && optimistic.ok) {
          setArticle(optimistic.article)
        } else {
          const result = await fetchArticle(resolved)
          setArticle(result)
        }

        return resolved
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        throw e
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return { article, isLoading, error, loadArticle, loadArticleOptimistic }
}
