import { NamuMark } from 'namumark-clone-core'

interface ParseRequest {
  id: number
  text: string
  title: string
}

interface ParseResponse {
  id: number
  html: string
}

self.onmessage = (e: MessageEvent<ParseRequest>) => {
  const { id, text, title } = e.data
  try {
    const database = { data: [{ data: text, title }] }
    const result = new NamuMark(text, { docName: title }, database).parse()
    self.postMessage({ id, html: result[0] as string } satisfies ParseResponse)
  } catch {
    self.postMessage({ id, html: '<p>렌더링 실패</p>' } satisfies ParseResponse)
  }
}
