import { useEffect, useState } from 'react'
import { ARTICLE_SUMMARY_FUNCTION_NAME, type ArticleSummaryFunctionResponse, supabase } from '../lib/supabase'

type SummaryStatus = 'idle' | 'loading' | 'success' | 'error'

interface ArticleSummaryRow {
  summary: string | null
}

export interface UseArticleSummaryResult {
  summary: string | null
  status: SummaryStatus
}

export function useArticleSummary(title: string): UseArticleSummaryResult {
  const [summary, setSummary] = useState<string | null>(null)
  const [status, setStatus] = useState<SummaryStatus>('idle')

  useEffect(() => {
    const normalizedTitle = title.trim()
    let ignore = false

    if (!normalizedTitle) {
      setSummary(null)
      setStatus('idle')
      return
    }

    async function loadSummary() {
      setSummary(null)
      setStatus('loading')

      const { data } = await supabase
        .from('articles')
        .select('summary')
        .eq('title', normalizedTitle)
        .maybeSingle<ArticleSummaryRow>()

      if (ignore) return

      const cachedSummary = data?.summary?.trim()
      if (cachedSummary) {
        setSummary(cachedSummary)
        setStatus('success')
        return
      }

      const { data: summaryData, error } = await supabase.functions.invoke<ArticleSummaryFunctionResponse>(
        ARTICLE_SUMMARY_FUNCTION_NAME,
        { body: { title: normalizedTitle } },
      )

      if (ignore) return

      if (error || !summaryData?.summary?.trim()) {
        setSummary(null)
        setStatus('error')
        return
      }

      setSummary(summaryData.summary.trim())
      setStatus('success')
    }

    void loadSummary()

    return () => {
      ignore = true
    }
  }, [title])

  return { summary, status }
}
