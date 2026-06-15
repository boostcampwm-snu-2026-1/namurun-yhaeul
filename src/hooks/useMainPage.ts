import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface DailyPrompt {
  start_article: string
  end_article: string
}

type DailyPromptRow = { start_article: string; end_article: string }
type ArticleRow = { title: string }

function isDailyPromptRow(value: unknown): value is DailyPromptRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).start_article === 'string' &&
    typeof (value as Record<string, unknown>).end_article === 'string'
  )
}

function isArticleRowArray(value: unknown): value is ArticleRow[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).title === 'string',
    )
  )
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function getKstDateString(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export interface UseMainPageResult {
  isLoading: boolean
  error: string | null
  dailyPrompt: DailyPrompt | null
  startDaily: () => void
  startRandom: () => void
}

export function useMainPage(): UseMainPageResult {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyPrompt, setDailyPrompt] = useState<DailyPrompt | null>(null)
  const [topArticles, setTopArticles] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const kstDate = getKstDateString()
        const [promptResult, articlesResult] = await Promise.all([
          supabase
            .from('daily_prompts')
            .select('start_article, end_article')
            .eq('date', kstDate)
            .maybeSingle(),
          supabase.from('articles').select('title').order('byte_size', { ascending: false }).limit(100),
        ])

        if (isDailyPromptRow(promptResult.data)) {
          setDailyPrompt(promptResult.data)
        }

        if (isArticleRowArray(articlesResult.data)) {
          setTopArticles(articlesResult.data.map((r) => r.title))
        } else if (articlesResult.error) {
          setError('문서 목록을 불러오지 못했습니다.')
        }
      } catch {
        setError('데이터를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const startDaily = useCallback(() => {
    if (!dailyPrompt) return
    navigate('/game', { state: { start: dailyPrompt.start_article, end: dailyPrompt.end_article } })
  }, [dailyPrompt, navigate])

  const startRandom = useCallback(() => {
    if (topArticles.length < 2) return
    const shuffled = shuffle(topArticles)
    navigate('/game', { state: { start: shuffled[0], end: shuffled[1] } })
  }, [topArticles, navigate])

  return { isLoading, error, dailyPrompt, startDaily, startRandom }
}
