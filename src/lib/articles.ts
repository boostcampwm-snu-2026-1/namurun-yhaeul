import { supabase } from './supabase'

export async function fetchRandomArticleTitle(): Promise<string | null> {
  const { count } = await supabase.from('articles').select('*', { count: 'estimated', head: true })
  const total = count ?? 100000
  const randomId = Math.floor(Math.random() * total)
  const { data } = await supabase.from('articles').select('title').gte('id', randomId).limit(1).single()
  if (!data) return null
  return (data as { title: string }).title
}
