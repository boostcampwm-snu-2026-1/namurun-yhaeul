import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArticleRow {
  summary: string | null
}

interface ArticlePayload {
  text: string
}

interface GeminiPart {
  text?: string
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[]
  }
}

interface GeminiResponse {
  candidates?: GeminiCandidate[]
}

const GEMINI_RETRYABLE_STATUSES = new Set([429, 500, 503])
const GEMINI_MAX_ATTEMPTS = 3

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const r2BaseUrl = Deno.env.get('R2_BASE_URL')
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite'

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

function buildPrompt(title: string, text: string): string {
  const excerpt = text.slice(0, 4_000)

  return [
    `문서 제목: ${title}`,
    '',
    '아래 문서를 1~2문장 분량의 짧은 요약으로 설명해 주세요.',
    '사용자가 나무위키 스피드런에서 목표 문서를 찾을 때 도움이 되도록,',
    '문서의 정체를 구분하는 데 유용한 핵심 정보와 맥락 위주로 설명해 주세요.',
    '경로 힌트, 링크 유도, 메타 설명은 쓰지 말고 사실 요약만 작성해 주세요.',
    '',
    excerpt,
  ].join('\n')
}

function normalizeSummary(summary: string): string {
  return summary.replace(/\s+/g, ' ').trim()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchCachedSummary(title: string): Promise<string | null> {
  const { data } = await supabase
    .from('articles')
    .select('summary')
    .eq('title', title)
    .maybeSingle<ArticleRow>()

  if (!data?.summary) return null
  return data.summary.trim() || null
}

async function saveSummary(title: string, summary: string): Promise<void> {
  await supabase
    .from('articles')
    .update({ summary })
    .eq('title', title)
}

async function fetchArticleText(title: string): Promise<string> {
  if (!r2BaseUrl) {
    throw new Error('R2_BASE_URL 환경변수가 필요합니다.')
  }

  const url = `${r2BaseUrl}/articles/${encodeURIComponent(title)}.json`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`R2 fetch failed: ${response.status}`)
  }

  const payload = await response.json() as ArticlePayload
  if (typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new Error('문서 본문이 비어 있습니다.')
  }

  return payload.text
}

async function generateSummary(title: string, text: string): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 필요합니다.')
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: buildPrompt(title, text) }],
      },
    ],
  })

  let lastStatus: number | null = null

  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      },
    )

    if (response.ok) {
      const payload = await response.json() as GeminiResponse
      const summary = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
      const normalized = normalizeSummary(summary)

      if (!normalized) {
        throw new Error('Gemini 응답에 요약이 없습니다.')
      }

      return normalized
    }

    lastStatus = response.status

    if (!GEMINI_RETRYABLE_STATUSES.has(response.status) || attempt === GEMINI_MAX_ATTEMPTS) {
      throw new Error(`Gemini request failed: ${response.status}`)
    }

    await sleep(500 * attempt)
  }

  throw new Error(`Gemini request failed: ${lastStatus ?? 'unknown'}`)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const payload = await request.json() as { title?: unknown }
    const title = typeof payload.title === 'string' ? payload.title.trim() : ''

    if (!title) {
      return jsonResponse({ error: 'title is required' }, { status: 400 })
    }

    const cachedSummary = await fetchCachedSummary(title)
    if (cachedSummary) {
      return jsonResponse({ summary: cachedSummary, source: 'cache' })
    }

    const text = await fetchArticleText(title)
    const generatedSummary = await generateSummary(title, text)

    await saveSummary(title, generatedSummary)

    return jsonResponse({ summary: generatedSummary, source: 'generated' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return jsonResponse({ error: message }, { status: 500 })
  }
})
