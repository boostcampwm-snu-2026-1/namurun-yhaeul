import { useState, useCallback } from 'react'
import { fetchArticle, type Article } from '../lib/r2'

interface UseArticleResult {
  article: Article | null
  isLoading: boolean
  error: Error | null
  loadArticle: (title: string) => Promise<void>
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

  return { article, isLoading, error, loadArticle }
}
