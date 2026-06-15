// PUA 마커 — DOLLAR_PUA()와 겹치지 않는 코드포인트 사용
const TOKEN_START = ''
const TOKEN_END   = ''

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function docLink(title: string): string {
  return `<a href="/w/${encodeURIComponent(title)}">${esc(title)}</a>`
}

function box(variant: string, icon: string, body: string): string {
  return `<div class="namu-include namu-include--${variant}"><span class="namu-include__icon">${icon}</span><span class="namu-include__body">${body}</span></div>`
}

const ICON_DETAIL = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5.5" cy="5.5" r="3.5"/><line x1="8.5" y1="8.5" x2="13" y2="13"/></svg>`
const ICON_UP     = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L7 4.5L11 9.5"/></svg>`
const ICON_DOWN   = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5L7 9.5L11 4.5"/></svg>`
const ICON_RELATE = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5H9L7 3M12 9H5L7 11"/></svg>`
const ICON_ALT    = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7H10M7 4L10 7L7 10"/></svg>`

// [include( 이후 내용의 끝 위치()] 다음)을 반환. 실패 시 -1.
function findIncludeEnd(text: string, start: number): number {
  let depth = 1
  let i = start
  while (i < text.length) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') {
      if (--depth === 0) break
    }
    i++
  }
  return text[i] === ')' && text[i + 1] === ']' ? i + 2 : -1
}

// ", key=value, key2=value2" — \, 이스케이프 처리
function parseParams(src: string): Record<string, string> {
  const params: Record<string, string> = {}
  let key = ''
  let val = ''
  let inVal = false

  const flush = () => {
    const k = key.trim()
    if (k) params[k] = val.trim()
    key = ''
    val = ''
    inVal = false
  }

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === '\\' && src[i + 1] === ',') {
      if (inVal) val += ','
      else key += ','
      i++
      continue
    }
    if (ch === ',') { flush(); continue }
    if (ch === '=' && !inVal) { inVal = true; continue }
    if (inVal) val += ch
    else key += ch
  }
  flush()
  return params
}

function collectDocs(p: Record<string, string>, max = 10): string[] {
  const docs: string[] = []
  for (let i = 1; i <= max; i++) {
    const d = p[`문서명${i}`]
    if (d) docs.push(d)
    else break
  }
  return docs
}

// ── 렌더러 ──────────────────────────────────────────────────────────────────

function renderDetail(p: Record<string, string>): string {
  const doc = p['문서명']
  if (!doc) return ''
  const prefix = p['설명'] ? `${esc(p['설명'])} 자세한 내용은 ` : '자세한 내용은 '
  const suffix = p['문단']
    ? ` 문서의 ${esc(p['문단'])}번 문단을 참고하십시오.`
    : p['앵커']
    ? ` 문서의 ${esc(p['앵커'])} 부분을 참고하십시오.`
    : ' 문서를 참고하십시오.'
  return box('detail', ICON_DETAIL, `${prefix}${docLink(doc)}${suffix}`)
}

function renderUpperDoc(p: Record<string, string>, docTitle: string): string {
  let docs = collectDocs(p)
  if (docs.length === 0) {
    const slash = docTitle.lastIndexOf('/')
    if (slash > 0) docs = [docTitle.slice(0, slash)]
  }
  if (docs.length === 0) return ''
  return box('nav', ICON_UP, `상위 문서: ${docs.map(docLink).join(', ')}`)
}

function renderLowerDoc(p: Record<string, string>): string {
  const docs = collectDocs(p)
  if (docs.length === 0) return ''
  return box('nav', ICON_DOWN, `하위 문서: ${docs.map(docLink).join(', ')}`)
}

function renderRelated(p: Record<string, string>): string {
  const docs = collectDocs(p)
  if (docs.length === 0) return ''
  return box('nav', ICON_RELATE, `관련 문서: ${docs.map(docLink).join(', ')}`)
}

function sanitizeCSSValue(val: string): string {
  const c = val.trim()
  // ; < > " ' 등 탈출 문자 제외, CSS 값에 등장하는 문자만 허용
  if (/^[a-zA-Z0-9#().,% ]+$/.test(c)) return c
  return ''
}

function sanitizeColor(val: string): string {
  const c = val.trim()
  if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(c)) return `#${c}`
  if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(c)) return c
  if (/^[a-zA-Z]+$/.test(c)) return c
  return ''
}

function renderBgText(p: Record<string, string>, bold: boolean, rounded: boolean): string {
  const content = p['내용']
  if (!content) return ''

  const styles: string[] = []
  const bgColor = sanitizeColor(p['배경색'] ?? '')
  const textColor = sanitizeColor(p['글자색'] ?? '')

  if (bgColor) styles.push(`background-color: ${bgColor}`)
  if (textColor) styles.push(`color: ${textColor}`)
  if (bold) styles.push('font-weight: bold')

  if (rounded) {
    const padding = sanitizeCSSValue(p['여백'] ?? '')
    const radius = sanitizeCSSValue(p['곡률'] ?? '')
    const size = sanitizeCSSValue(p['사이즈'] ?? '')
    if (padding) styles.push(`padding: ${padding}`)
    if (radius) styles.push(`border-radius: ${radius}`)
    if (size) styles.push(`font-size: ${size}`)
  }

  const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : ''
  return `<span class="namu-bg"${styleAttr}>${esc(content)}</span>`
}

function renderBoxTemplate(p: Record<string, string>): string {
  const content = p['내용']
  if (!content) return ''
  return `<span class="namu-box">${esc(content)}</span>`
}

function renderBoxTemplateB(p: Record<string, string>): string {
  const content = p['내용']
  if (!content) return ''

  const styles: string[] = []
  const rawSize = p['선크기']
  const borderColor = sanitizeColor(p['선색'] ?? '')
  const bgColor = sanitizeColor(p['배경색'] ?? '')
  const textColor = sanitizeColor(p['글색'] ?? '')

  const borderSize = rawSize !== undefined ? parseFloat(rawSize) : NaN
  const bSize = !isNaN(borderSize) && borderSize > 0 ? `${borderSize}px` : '1px'
  if (borderColor) styles.push(`border: ${bSize} solid ${borderColor}`)
  if (bgColor) styles.push(`background-color: ${bgColor}`)
  if (textColor) styles.push(`color: ${textColor}`)

  const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : ''
  return `<span class="namu-box"${styleAttr}>${esc(content)}</span>`
}

function renderDateNav(p: Record<string, string>): string {
  const back = p['back']
  const next = p['next']
  const back2 = p['back2']
  const next2 = p['next2']
  const today = p['today'] ?? ''
  if (!back && !next && !back2 && !next2) return ''

  const a = (title: string | undefined, text: string) =>
    title ? `<a href="/w/${encodeURIComponent(title)}">${esc(text)}</a>` : esc(text)

  // Row 1: [back] [전날 / ←] [today rowspan=2] [다음날 / →] [next]
  // Row 2: [back2] [전달]    (spanned)          [다음달]     [next2]
  const r1 = `<tr>
    <td class="namu-date-nav__side namu-date-nav__side--prev">${a(back, back ?? '')}</td>
    <td class="namu-date-nav__label"><small>전날</small><br>${a(back, '←')}</td>
    <td class="namu-date-nav__today" rowspan="2">${esc(today)}</td>
    <td class="namu-date-nav__label"><small>다음날</small><br>${a(next, '→')}</td>
    <td class="namu-date-nav__side namu-date-nav__side--next">${a(next, next ?? '')}</td>
  </tr>`
  const r2 = `<tr>
    <td class="namu-date-nav__side namu-date-nav__side--prev">${a(back2, back2 ?? '')}</td>
    <td class="namu-date-nav__label"><small>전달</small></td>
    <td class="namu-date-nav__label"><small>다음달</small></td>
    <td class="namu-date-nav__side namu-date-nav__side--next">${a(next2, next2 ?? '')}</td>
  </tr>`

  return `<table class="namu-date-nav"><thead><tr><th colspan="5">날짜 이동란</th></tr></thead><tbody>${r1}${r2}</tbody></table>`
}

function renderOtherMeaning(p: Record<string, string>): string {
  // 설명만 있는 단순 모드
  if (p['설명'] && !p['설명1'] && !p['other1']) {
    return box('other-meaning', ICON_ALT, esc(p['설명']))
  }

  const 넘어옴 = p['넘어옴1'] ? `${esc(p['넘어옴1'])}은(는) 여기로 연결됩니다. ` : ''
  const entries: string[] = []

  for (let i = 1; i <= 10; i++) {
    // 틀:다른 뜻: 설명N / 문서명N  |  틀:다른 뜻1: otherN / rdN
    const 설명 = p[`설명${i}`] ?? p[`other${i}`]
    const doc  = p[`문서명${i}`] ?? p[`rd${i}`]
    if (!설명 && !doc) break
    const 문단 = p[`문단${i}`]
    const 앵커 = p[`앵커${i}`]

    let entry = 설명 ? `${esc(설명)}에 대한 내용은 ` : '다른 뜻에 대한 내용은 '
    if (doc) {
      entry += docLink(doc)
      entry += 문단 ? ` 문서의 ${esc(문단)}번 문단` : 앵커 ? ` 문서의 ${esc(앵커)} 부분` : ' 문서'
    }
    entries.push(entry)
  }

  // 파라미터 없음 — 헤더만 표시
  if (entries.length === 0) {
    return box('other-meaning', ICON_ALT, `${넘어옴}다른 뜻에 대한 내용은 아래 문서를 참고하십시오.`)
  }

  const body = 넘어옴 + (
    entries.length === 1
      ? `${entries[0]}를 참고하십시오.`
      : `${entries.join('를, ')}를 참고하십시오.`
  )
  return box('other-meaning', ICON_ALT, body)
}

// ── 디스패처 ─────────────────────────────────────────────────────────────────

type Renderer = (p: Record<string, string>, docTitle: string) => string

const RENDERERS: Record<string, Renderer> = {
  '틀:상세 내용':  (p)    => renderDetail(p),
  '틀: 상세 내용': (p)    => renderDetail(p),
  '틀:상위 문서':  (p, t) => renderUpperDoc(p, t),
  '틀: 상위 문서': (p, t) => renderUpperDoc(p, t),
  '틀:하위 문서':  (p)    => renderLowerDoc(p),
  '틀:관련 문서':  (p)    => renderRelated(p),
  '틀:다른 뜻':   (p)    => renderOtherMeaning(p),
  '틀:다른 뜻1':  (p)    => renderOtherMeaning(p),
  '틀: 다른 뜻':  (p)    => renderOtherMeaning(p),
  '틀:네모틀':    (p)    => renderBoxTemplate(p),
  '틀:네모틀b':   (p)    => renderBoxTemplateB(p),
  '틀:글배경':    (p)    => renderBgText(p, false, false),
  '틀:글배경b':   (p)    => renderBgText(p, true, false),
  '틀:글배경r':   (p)    => renderBgText(p, false, true),
  '틀:글배경br':  (p)    => renderBgText(p, true, true),
  '틀:날짜 이동': (p)    => renderDateNav(p),
}

// ── public API ───────────────────────────────────────────────────────────────

export function preprocessIncludes(
  text: string,
  docTitle: string,
): { text: string; tokens: Map<string, string> } {
  const INCLUDE_PREFIX = '[include('
  const HTML_PREFIX = '{{{#!html '
  const HTML_SUFFIX = '}}}'
  const tokens = new Map<string, string>()
  let idx = 0
  let result = ''
  let i = 0

  while (i < text.length) {
    const pi = text.indexOf(INCLUDE_PREFIX, i)
    const hi = text.indexOf(HTML_PREFIX, i)

    if (pi === -1 && hi === -1) { result += text.slice(i); break }

    // {{{#!html}}} 가 먼저 나오면 처리
    if (hi !== -1 && (pi === -1 || hi < pi)) {
      result += text.slice(i, hi)
      const contentStart = hi + HTML_PREFIX.length
      const closeIdx = text.indexOf(HTML_SUFFIX, contentStart)
      if (closeIdx === -1) { result += text[hi]; i = hi + 1; continue }
      const rawHtml = text.slice(contentStart, closeIdx)
      if (rawHtml.trim()) {
        const token = `${TOKEN_START}${idx++}${TOKEN_END}`
        tokens.set(token, rawHtml)
        result += token
      }
      i = closeIdx + HTML_SUFFIX.length
      continue
    }

    // [include(...)] 처리
    result += text.slice(i, pi)

    const bodyStart = pi + INCLUDE_PREFIX.length
    const end = findIncludeEnd(text, bodyStart)
    if (end === -1) { result += text[pi]; i = pi + 1; continue }

    const inner = text.slice(bodyStart, end - 2) // ')' ']' 제거
    const ci = inner.indexOf(',')
    const name = (ci === -1 ? inner : inner.slice(0, ci)).trim()
    const paramStr = ci === -1 ? '' : inner.slice(ci + 1)

    const renderer = RENDERERS[name]
    if (!renderer) {
      result += text.slice(pi, end)
      i = end
      continue
    }

    const html = renderer(parseParams(paramStr), docTitle)
    if (html) {
      const token = `${TOKEN_START}${idx++}${TOKEN_END}`
      tokens.set(token, html)
      result += token
    }
    // html이 빈 문자열이면 해당 include 제거 (숨김)
    i = end
  }

  return { text: result, tokens }
}

export function restoreIncludes(html: string, tokens: Map<string, string>): string {
  let result = html
  for (const [token, replacement] of tokens) {
    result = result.split(token).join(replacement)
  }
  return result
}
