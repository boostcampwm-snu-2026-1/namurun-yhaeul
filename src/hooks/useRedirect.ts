import { supabase } from '../lib/supabase'

type RedirectRow = { target: string }

function isRedirectRow(value: unknown): value is RedirectRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    typeof (value as Record<string, unknown>).target === 'string'
  )
}

export function useRedirect() {
  const resolveRedirect = async (title: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('redirects')
        .select('target')
        .eq('title', title)
        .maybeSingle()

      if (error || !isRedirectRow(data)) return title
      return data.target
    } catch {
      return title
    }
  }

  return { resolveRedirect }
}
