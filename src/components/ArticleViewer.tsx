import { useMemo } from 'react'
import { NamuMark } from 'namumark-clone-core'
import type { Article } from '../lib/r2'

declare global {
  interface Window {
    opennamu_heading_folding?: (data: string, element?: HTMLElement) => void
  }
}

// namumark가 heading에 박는 인라인 onclick이 호출하는 섹션 접기 함수.
// 원본(media/render.js)을 그대로 옮김 — 서버 API 의존 없는 순수 DOM 토글.
window.opennamu_heading_folding = (data, element) => {
  const fol = document.getElementById(data)
  if (!fol) return
  const sub = document.getElementById(data + '_sub')
  if (['', 'inline-block', 'block'].includes(fol.style.display)) {
    fol.style.display = 'none'
    if (sub) sub.style.opacity = '0.5'
  } else {
    fol.style.display = 'block'
    if (sub) sub.style.opacity = '1'
  }
  if (element) {
    element.innerHTML = element.innerHTML !== '⊖' ? '⊖' : '⊕'
  }
}

interface Props {
  article: Article
}

export function ArticleViewer({ article }: Props) {
  const html = useMemo(() => {
    const database = { data: [{ data: article.text, title: article.title }] }
    try {
      const result = new NamuMark(article.text, { docName: article.title }, database).parse()
      return result[0]
    } catch {
      return '<p>렌더링 실패</p>'
    }
  }, [article.title, article.text])

  // namumark 렌더링 결과를 삽입하는 유일한 지점 — 라이브러리 출력만 허용 (XSS 정책)
  return <div className="article-viewer" dangerouslySetInnerHTML={{ __html: html }} />
}
