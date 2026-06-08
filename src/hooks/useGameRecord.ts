import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface GameResult {
  startArticle: string
  endArticle: string
  path: string[]
  elapsedMs: number
  clickCount: number
}

export function useGameRecord(result: GameResult | null) {
  const [isSaved, setIsSaved] = useState(false)
  const [saveError, setSaveError] = useState<Error | null>(null)
  const hasInsertedRef = useRef(false)

  useEffect(() => {
    if (!result || hasInsertedRef.current) return
    hasInsertedRef.current = true

    const save = async () => {
      const { error } = await supabase.from('game_records').insert({
        start_article: result.startArticle,
        end_article: result.endArticle,
        click_count: result.clickCount,
        elapsed_ms: result.elapsedMs,
        path: result.path,
        user_name: null,
      })
      if (error) {
        setSaveError(new Error(error.message))
      } else {
        setIsSaved(true)
      }
    }

    void save()
  }, [result])

  return { isSaved, saveError }
}
