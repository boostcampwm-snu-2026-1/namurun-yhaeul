import { useState, type FormEvent } from 'react'
import { fetchArticle, type Article } from '../lib/r2'
import { supabase } from '../lib/supabase'
import { ArticleViewer } from '../components/ArticleViewer'

const RANDOM_GROUPS = 5 // 랜덤 위치 구간 수 (흩어진 표본을 위해 여러 곳에서 추출)
const PER_GROUP = 4 // 구간당 문서 수
const RANDOM_COUNT = RANDOM_GROUPS * PER_GROUP

// 개발용 데모 — 문서 제목을 검색하거나 랜덤 목록에서 골라 namumark 렌더링 결과를 확인한다.
function RenderDemoPage() {
  const [input, setInput] = useState('')
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [randomTitles, setRandomTitles] = useState<string[]>([])

  const loadArticle = async (title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return

    setInput(trimmed)
    setLoading(true)
    setError(null)
    try {
      setArticle(await fetchArticle(trimmed))
    } catch (err) {
      setArticle(null)
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    void loadArticle(input)
  }

  const loadRandomTitles = async () => {
    setError(null)
    const { count, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
    if (countError || !count) {
      setError(countError?.message ?? '문서 개수를 가져오지 못했습니다.')
      return
    }

    // 여러 랜덤 위치에서 조금씩 추출해 가나다순 인접 편중을 줄인다 (병렬 쿼리).
    const offsets = Array.from({ length: RANDOM_GROUPS }, () =>
      Math.floor(Math.random() * Math.max(1, count - PER_GROUP)),
    )
    const results = await Promise.all(
      offsets.map((offset) =>
        supabase
          .from('articles')
          .select('title')
          .range(offset, offset + PER_GROUP - 1),
      ),
    )

    const failed = results.find((r) => r.error)
    if (failed?.error) {
      setError(failed.error.message)
      return
    }

    const titles = results.flatMap((r) =>
      (r.data ?? []).map((row) => (row as { title: string }).title),
    )
    setRandomTitles(titles)
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="문서 제목 입력 (예: 이순신)"
          className="flex-1 border px-2 py-1"
        />
        <button type="submit" className="border bg-gray-100 px-4 py-1">
          검색
        </button>
      </form>

      <button
        type="button"
        onClick={() => void loadRandomTitles()}
        className="mb-3 border bg-gray-100 px-4 py-1"
      >
        랜덤 문서 {RANDOM_COUNT}개 보기
      </button>

      {randomTitles.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {randomTitles.map((title) => (
            <li key={title}>
              <button
                type="button"
                onClick={() => void loadArticle(title)}
                className="rounded border bg-blue-50 px-2 py-1 text-sm text-blue-700"
              >
                {title}
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading && <p>로딩 중...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {article && <ArticleViewer article={article} />}
    </div>
  )
}

export default RenderDemoPage
