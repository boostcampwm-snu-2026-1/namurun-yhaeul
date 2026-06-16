import { useState, useEffect, useRef } from 'react'
import type { Article } from '../lib/r2'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'

declare global {
  interface Window {
    opennamu_heading_folding?: (data: string, element?: HTMLElement) => void
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg'

// SVG 네임스페이스로 직접 생성 — innerHTML 방식은 브라우저 파싱 컨텍스트 따라 렌더링 실패 가능
function makeFoldIcon(direction: 'down' | 'right'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', '12')
  svg.setAttribute('height', '12')
  svg.setAttribute('viewBox', '0 0 12 12')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute(
    'd',
    direction === 'down'
      ? 'M2 4 L6 8 L10 4'   // ∨ 펼침
      : 'M4 2 L8 6 L4 10',  // > 접힘
  )
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '2')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(path)
  return svg
}

function setFoldIcon(el: HTMLElement, direction: 'down' | 'right') {
  el.innerHTML = ''
  el.appendChild(makeFoldIcon(direction))
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
    if (element) setFoldIcon(element, 'right')
  } else {
    fol.style.display = 'block'
    if (sub) sub.style.opacity = '1'
    if (element) setFoldIcon(element, 'down')
  }
}

interface Props {
  article: Article
  onReady?: () => void
}

// 모듈 수준 카운터 — 여러 인스턴스가 있어도 요청 ID가 전역적으로 유일함
let requestCounter = 0

export function ArticleViewer({ article, onReady }: Props) {
  const [html, setHtml] = useState('')
  const [displayedTitle, setDisplayedTitle] = useState(article.title)
  const workerRef = useRef<Worker | null>(null)
  const latestIdRef = useRef(0)
  const pendingTitleRef = useRef(article.title)
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
        setDisplayedTitle(pendingTitleRef.current)
      }
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!workerRef.current) return
    pendingTitleRef.current = article.title
    const id = ++requestCounter
    latestIdRef.current = id
    workerRef.current.postMessage({ id, text: article.text, title: article.title })
  }, [article.title, article.text])

  // html이 DOM에 커밋된 직후 호출 — 네비게이션 잠금 해제 신호
  useEffect(() => {
    if (html) onReady?.()
  }, [html, onReady])

  // HTML 주입 후 목차 접기 토글 연결
  useEffect(() => {
    // 초기 ⊖/⊕ → SVG 아이콘으로 교체 + 숫자 왼쪽으로 이동
    // 구조: <span id="_sub"> 텍스트 <sub> ✎(숨김) 접기버튼 </sub> </span>
    // 접기 버튼을 span의 firstChild 앞으로 옮겨 텍스트 왼쪽에 배치
    contentRef.current?.querySelectorAll<HTMLElement>('pre code[class]').forEach((el) => {
      hljs.highlightElement(el)
    })

    // ul 다음에 오는 인라인 노드(텍스트·링크·br 등)를 블록 요소 직전까지 묶어 들여쓰기 적용
    const BLOCK_TAGS = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'PRE', 'HR'])
    contentRef.current?.querySelectorAll('ul').forEach((ul) => {
      const lastLi = ul.querySelector<HTMLElement>('li:last-child')
      const liMarginLeft = lastLi ? parseInt(lastLi.style.marginLeft || '0', 10) : 0

      const inlineNodes: ChildNode[] = []
      let consecutiveBrs = 0
      let node: ChildNode | null = ul.nextSibling
      while (node && !BLOCK_TAGS.has((node as Element).nodeName)) {
        if ((node as Element).nodeName === 'BR') {
          consecutiveBrs++
          if (consecutiveBrs >= 2) break  // <br><br> = 새 문단, 수집 중단
        } else {
          consecutiveBrs = 0
        }
        inlineNodes.push(node)
        node = node.nextSibling
      }

      const hasText = inlineNodes.some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim(),
      )
      if (!hasText) return

      // 첫 번째 의미 있는 노드가 <br>이면 새 문단 — 들여쓰기 적용 안 함
      const firstMeaningful = inlineNodes.find(
        (n) => !(n.nodeType === Node.TEXT_NODE && !(n.textContent ?? '').trim()),
      )
      if (!firstMeaningful || (firstMeaningful as Element).nodeName === 'BR') return

      const wrapper = document.createElement('div')
      wrapper.style.paddingLeft = `calc(1.5rem + ${liMarginLeft}px)`
      ul.parentNode?.insertBefore(wrapper, inlineNodes[0])
      inlineNodes.forEach((n) => wrapper.appendChild(n))
    })

    // namumark가 [math(LaTeX)] 를 <span id="opennamu_math_N">JS_escaped_LaTeX</span> 으로 변환하고
    // katex.render 호출은 renderDataJS(JS 코드)에만 담아 반환 — 워커에서 버리므로 수동 렌더링 필요.
    // textContent는 getToolJSSafe 이스케이프 적용 상태 → JSON.parse로 역변환 후 KaTeX 렌더링.
    contentRef.current?.querySelectorAll<HTMLElement>('span[id*="opennamu_math_"]').forEach((span) => {
      const escaped = span.textContent ?? ''
      if (!escaped) return
      try {
        // getToolJSSafe: \n→\\n, \→\\, '→\', "→\" — JSON.parse는 \'를 지원하지 않으므로 먼저 처리
        const jsonSafe = escaped.split("\\'").join("'")
        const latex = JSON.parse('"' + jsonSafe + '"') as string
        katex.render(latex, span, { throwOnError: false })
      } catch {
        // 파싱 실패 시 원문 그대로 유지
      }
    })

    // namumark는 주석(footnote)을 renderData 끝에 추가한 뒤 heading을 처리하므로
    // 마지막 소제목 content div 안에 주석이 갇힘 → 접기 시 주석까지 사라지는 버그.
    // 소제목 div 안에 있는 footnote를 article-content 직계 자식으로 이동해 해결.
    contentRef.current?.querySelectorAll<HTMLElement>('.opennamu_footnote').forEach((footnoteEl) => {
      const parent = footnoteEl.parentElement
      if (parent && /opennamu_heading_/.test(parent.id)) {
        contentRef.current?.appendChild(footnoteEl)
      }
    })

    contentRef.current?.querySelectorAll<HTMLElement>('[onclick*="opennamu_heading_folding"]').forEach((btn) => {
      const isCollapsed = btn.textContent?.trim() === '⊕'
      setFoldIcon(btn, isCollapsed ? 'right' : 'down')

      const span = btn.parentElement?.parentElement // sub → span[id*="_sub"]
      if (span?.id.endsWith('_sub') && span.firstChild) {
        span.insertBefore(btn, span.firstChild)
      }
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
      <h1 className="article-doc-title">{displayedTitle}</h1>
      <div ref={contentRef} className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
