import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface DailyPrompt {
  start_article: string
  end_article: string
}

type DailyPromptRow = { start_article: string; end_article: string }

function isDailyPromptRow(value: unknown): value is DailyPromptRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).start_article === 'string' &&
    typeof (value as Record<string, unknown>).end_article === 'string'
  )
}

function getKstDateString(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

async function fetchRandomTitle(totalCount: number, excludeSlash: boolean): Promise<string> {
  let range = totalCount
  while (range >= 1) {
    const randomId = Math.floor(Math.random() * range)
    const query = supabase.from('articles').select('title').gte('id', randomId).limit(1)
    const finalQuery = excludeSlash ? query.not('title', 'like', '%/%') : query
    const { data } = await finalQuery.single()
    if (data) return (data as { title: string }).title
    range = Math.floor(range * 0.9)
  }
  throw new Error('랜덤 문서를 가져오지 못했습니다.')
}

export interface UseMainPageResult {
  isLoading: boolean
  error: string | null
  dailyPrompt: DailyPrompt | null
  startDaily: () => void
  startRandom: () => void
  goToLeaderboard: () => void
}

export function useMainPage(): UseMainPageResult {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyPrompt, setDailyPrompt] = useState<DailyPrompt | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const isRandomFetchingRef = useRef(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const kstDate = getKstDateString()
        const [promptResult, countResult] = await Promise.all([
          supabase
            .from('daily_prompts')
            .select('start_article, end_article')
            .eq('date', kstDate)
            .maybeSingle(),
          supabase.from('articles').select('*', { count: 'estimated', head: true }),
        ])

        if (isDailyPromptRow(promptResult.data)) {
          setDailyPrompt(promptResult.data)
        }

        if (countResult.error) {
          setError('문서 목록을 불러오지 못했습니다.')
        } else if (countResult.count !== null) {
          setTotalCount(countResult.count)
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
    const dailyDate = getKstDateString()
    navigate('/game', {
      state: { start: dailyPrompt.start_article, end: dailyPrompt.end_article, challengeType: 'daily', dailyDate },
    })
  }, [dailyPrompt, navigate])

  const startRandom = useCallback(async () => {
    if (totalCount === 0 || isRandomFetchingRef.current) return
    isRandomFetchingRef.current = true
    try {
      let start: string
      let end: string
      do {
        ;[start, end] = await Promise.all([
          fetchRandomTitle(totalCount, false),
          fetchRandomTitle(totalCount, true),
        ])
      } while (start === end)
      navigate('/game', { state: { start, end, challengeType: 'random' } })
    } catch {
      // 가져오기 실패 시 조용히 무시 — 버튼 재클릭으로 재시도 가능
    } finally {
      isRandomFetchingRef.current = false
    }
  }, [totalCount, navigate])

  const goToLeaderboard = useCallback(() => {
    navigate('/leaderboard')
  }, [navigate])

  return { isLoading, error, dailyPrompt, startDaily, startRandom, goToLeaderboard }
}
