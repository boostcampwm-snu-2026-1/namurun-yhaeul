import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [recordId, setRecordId] = useState<string | null>(null)
  const hasInsertedRef = useRef(false)

  useEffect(() => {
    if (!result || hasInsertedRef.current) return
    hasInsertedRef.current = true

    const save = async () => {
      const { data, error } = await supabase
        .from('game_records')
        .insert({
          start_article: result.startArticle,
          end_article: result.endArticle,
          click_count: result.clickCount,
          elapsed_ms: result.elapsedMs,
          path: result.path,
          user_name: null,
        })
        .select('id')
        .single()

      if (error) {
        setSaveError(new Error(error.message))
      } else if (data && typeof (data as Record<string, unknown>).id === 'string') {
        setRecordId((data as Record<string, unknown>).id as string)
        setIsSaved(true)
      }
    }

    void save()
  }, [result])

  const updateUserName = useCallback(
    async (name: string): Promise<void> => {
      if (!recordId) throw new Error('기록이 아직 저장되지 않았습니다')
      const { error } = await supabase
        .from('game_records')
        .update({ user_name: name })
        .eq('id', recordId)
      if (error) throw new Error(error.message)
    },
    [recordId],
  )

  return { isSaved, saveError, recordId, updateUserName }
}
