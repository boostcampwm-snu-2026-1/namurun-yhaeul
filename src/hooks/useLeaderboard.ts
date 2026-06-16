import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type LeaderboardTab = 'daily' | 'random'
export type SortBy = 'elapsed_ms' | 'click_count'

export interface LeaderboardEntry {
  id: string
  user_name: string
  click_count: number
  elapsed_ms: number
  start_article: string
  end_article: string
}

export function useLeaderboard(tab: LeaderboardTab, date: string, sortBy: SortBy) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    const fetch = async () => {
      let query = supabase
        .from('game_records')
        .select('id, user_name, click_count, elapsed_ms, start_article, end_article')
        .not('user_name', 'is', null)
        .order(sortBy, { ascending: true })
        .order(sortBy === 'elapsed_ms' ? 'click_count' : 'elapsed_ms', { ascending: true })
        .limit(10)

      if (tab === 'daily') {
        query = query.eq('challenge_type', 'daily').eq('daily_date', date)
      } else {
        query = query.eq('challenge_type', 'random')
      }

      const { data, error: queryError } = await query

      if (queryError) {
        setError(new Error(queryError.message))
      } else {
        setEntries((data ?? []) as LeaderboardEntry[])
      }
      setIsLoading(false)
    }

    void fetch()
  }, [tab, date, sortBy])

  return { entries, isLoading, error }
}
