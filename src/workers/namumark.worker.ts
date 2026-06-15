import { NamuMark } from 'namumark-clone-core'
import { preprocessIncludes, restoreIncludes } from './includeTemplates'

interface ParseRequest {
  id: number
  text: string
  title: string
}

interface ParseResponse {
  id: number
  html: string
}

// namumark 내부 replace()에서 $ 뒤에 숫자가 오면 capture group 참조로 해석됨.
// 예: 각주 내 "$1.30" → $1이 listRegex group 1(리스트 블록 전체)로 치환 → RangeError.
// 입력 텍스트의 $를 PUA 코드포인트로 에스케이프하고 HTML 출력 후 복원한다.
const DOLLAR_PUA = ''

self.onmessage = (e: MessageEvent<ParseRequest>) => {
  const { id, text, title } = e.data
  try {
    const safeText = text.split('$').join(DOLLAR_PUA)
    // <table bgcolor=...> → <tablebgcolor=...> 형태의 비표준 나무마크 테이블 속성 정규화
    const normalizedText = safeText.replace(/<table[\s\n]+([a-z])/gi, '<table$1')
    const { text: processedText, tokens } = preprocessIncludes(normalizedText, title)
    const database = { data: [{ data: processedText, title }] }
    const result = new NamuMark(processedText, { docName: title }, database).parse()
    let html = (result[0] as string).split(DOLLAR_PUA).join('$')
    html = restoreIncludes(html, tokens)
    self.postMessage({ id, html } satisfies ParseResponse)
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error('[namumark worker] parse failed title:', title)
    console.error('[namumark worker] error:', err instanceof Error ? err.stack : err)
    self.postMessage({ id, html: `<p>렌더링 실패: ${msg}</p>` } satisfies ParseResponse)
  }
}
