import { useState, useEffect, useRef } from 'react'
import type { Article } from '../lib/r2'

declare global {
  interface Window {
    opennamu_heading_folding?: (data: string, element?: HTMLElement) => void
  }
}

// 접기 버튼 SVG 아이콘 — 나무위키 스타일 셰브론
const SVG_EXPANDED = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 12 12" style="display:inline-block;vertical-align:middle"><path d="M2 4.5 L6 8.5 L10 4.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const SVG_COLLAPSED = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 12 12" style="display:inline-block;vertical-align:middle"><path d="M4.5 2 L8.5 6 L4.5 10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`

// namumark가 heading에 박는 인라인 onclick이 호출하는 섹션 접기 함수.
// 원본(media/render.js)을 그대로 옮김 — 서버 API 의존 없는 순수 DOM 토글.
window.opennamu_heading_folding = (data, element) => {
  const fol = document.getElementById(data)
  if (!fol) return
  const sub = document.getElementById(data + '_sub')
  if (['', 'inline-block', 'block'].includes(fol.style.display)) {
    fol.style.display = 'none'
    if (sub) sub.style.opacity = '0.5'
    if (element) element.innerHTML = SVG_COLLAPSED
  } else {
    fol.style.display = 'block'
    if (sub) sub.style.opacity = '1'
    if (element) element.innerHTML = SVG_EXPANDED
  }
}

interface Props {
  article: Article
}

// 모듈 수준 카운터 — 여러 인스턴스가 있어도 요청 ID가 전역적으로 유일함
let requestCounter = 0

export function ArticleViewer({ article }: Props) {
  const [html, setHtml] = useState('')
  const workerRef = useRef<Worker | null>(null)
  const latestIdRef = useRef(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/namumark.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<{ id: number; html: string }>) => {
      // 가장 최근 요청의 응답만 반영 — 빠른 연속 클릭 시 이전 결과 무시
      if (e.data.id === latestIdRef.current) {
        setHtml(e.data.html)
      }
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!workerRef.current) return
    const id = ++requestCounter
    latestIdRef.current = id
    workerRef.current.postMessage({ id, text: article.text, title: article.title })
  }, [article.title, article.text])

  // HTML 주입 후 목차 접기 토글 연결
  useEffect(() => {
    // 초기 ⊖/⊕ → SVG 셰브론으로 교체 (namumark HTML에 하드코딩된 문자)
    contentRef.current?.querySelectorAll<HTMLElement>('[onclick*="opennamu_heading_folding"]').forEach((btn) => {
      if (btn.innerHTML.trim() === '⊖') btn.innerHTML = SVG_EXPANDED
      else if (btn.innerHTML.trim() === '⊕') btn.innerHTML = SVG_COLLAPSED
    })

    const toc = contentRef.current?.querySelector<HTMLElement>('.opennamu_TOC')
    const title = toc?.querySelector<HTMLElement>('.opennamu_TOC_title')
    if (!toc || !title) return

    // 제목 이후 모든 노드를 div.toc-content로 감싸 toggle 대상을 단일화
    const wrapper = document.createElement('div')
    wrapper.className = 'toc-content'
    Array.from(toc.childNodes).forEach((child) => {
      if (child !== title) wrapper.appendChild(child)
    })
    toc.appendChild(wrapper)

    const toggle = () => {
      if (!toc.classList.contains('toc-collapsed')) {
        // 접기 직전 너비 고정 — 내용이 사라져도 가로 길이 유지
        toc.style.minWidth = `${toc.offsetWidth}px`
      } else {
        toc.style.minWidth = ''
      }
      toc.classList.toggle('toc-collapsed')
    }

    title.addEventListener('click', toggle)
    return () => title.removeEventListener('click', toggle)
  }, [html])

  // namumark 렌더링 결과를 삽입하는 유일한 지점 — 라이브러리 출력만 허용 (XSS 정책)
  return (
    <div className="article-viewer">
      <h1 className="article-doc-title">{article.title}</h1>
      <div ref={contentRef} className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
