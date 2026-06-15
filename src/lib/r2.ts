const r2BaseUrl = import.meta.env.VITE_R2_BASE_URL

if (!r2BaseUrl) {
  throw new Error('VITE_R2_BASE_URL 환경변수가 필요합니다.')
}

export class ArticleNotFoundError extends Error {
  constructor(title: string) {
    super(`문서를 찾을 수 없습니다: ${title}`)
    this.name = 'ArticleNotFoundError'
  }
}

export class ArticleFetchError extends Error {
  constructor(
    title: string,
    public readonly status: number,
  ) {
    super(`문서 fetch 실패 (${status}): ${title}`)
    this.name = 'ArticleFetchError'
  }
}

export class ArticleNetworkError extends Error {
  constructor(title: string) {
    super(`네트워크 오류로 문서를 불러올 수 없습니다: ${title}`)
    this.name = 'ArticleNetworkError'
  }
}

export class ArticleParseError extends Error {
  constructor(title: string) {
    super(`문서 파싱 실패: ${title}`)
    this.name = 'ArticleParseError'
  }
}

export interface Article {
  title: string
  text: string
}

export async function fetchArticle(title: string): Promise<Article> {
  const url = `${r2BaseUrl}/articles/${encodeURIComponent(title)}.json`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new ArticleNetworkError(title)
  }

  if (response.status === 404) {
    throw new ArticleNotFoundError(title)
  }

  if (!response.ok) {
    throw new ArticleFetchError(title, response.status)
  }

  try {
    return await (response.json() as Promise<Article>)
  } catch {
    throw new ArticleParseError(title)
  }
}
