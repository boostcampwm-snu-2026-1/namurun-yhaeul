import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface LeaderboardEntry {
  id: string
  user_name: string
  click_count: number
  elapsed_ms: number
  start_article: string
  end_article: string
}

export function useLeaderboard(startArticle: string, endArticle: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!startArticle || !endArticle) return
    setIsLoading(true)
    setError(null)

    const fetch = async () => {
      const { data, error: queryError } = await supabase
        .from('game_records')
        .select('id, user_name, click_count, elapsed_ms, start_article, end_article')
        .eq('start_article', startArticle)
        .eq('end_article', endArticle)
        .not('user_name', 'is', null)
        .order('click_count', { ascending: true })
        .order('elapsed_ms', { ascending: true })
        .limit(10)

      if (queryError) {
        setError(new Error(queryError.message))
      } else {
        setEntries((data ?? []) as LeaderboardEntry[])
      }
      setIsLoading(false)
    }

    void fetch()
  }, [startArticle, endArticle])

  return { entries, isLoading, error }
}
