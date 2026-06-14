import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { ArticleViewer } from './ArticleViewer'

interface PostedMessage {
  id: number
  text: string
  title: string
}

class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  posted: PostedMessage[] = []

  postMessage(data: PostedMessage) {
    MockWorker.lastInstance = this
    this.posted.push(data)
  }

  terminate() {}

  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent)
    }
  }

  static lastInstance: MockWorker | null = null
}

vi.stubGlobal('Worker', MockWorker)

beforeEach(() => {
  MockWorker.lastInstance = null
})

describe('ArticleViewer', () => {
  it('Worker에서 받은 HTML을 렌더링한다', async () => {
    const article = { title: '이순신', text: '이순신은...' }
    const { container } = render(<ArticleViewer article={article} />)

    const worker = MockWorker.lastInstance!
    const { id } = worker.posted[0]

    await act(async () => {
      worker.simulateMessage({ id, html: '<p>이순신은 장군이다</p>' })
    })

    expect(container.querySelector('.article-viewer')?.innerHTML).toBe('<p>이순신은 장군이다</p>')
  })

  it('오래된 요청 결과는 무시하고 최신 결과만 반영한다', async () => {
    const article1 = { title: '이순신', text: '이순신은...' }
    const article2 = { title: '세종대왕', text: '세종대왕은...' }

    const { container, rerender } = render(<ArticleViewer article={article1} />)
    const worker = MockWorker.lastInstance!
    const oldId = worker.posted[0].id

    rerender(<ArticleViewer article={article2} />)
    const newId = worker.posted[1].id

    await act(async () => {
      // 이전 요청(이순신)의 늦은 응답 — 무시되어야 함
      worker.simulateMessage({ id: oldId, html: '<p>이순신</p>' })
      // 최신 요청(세종대왕)의 응답 — 반영되어야 함
      worker.simulateMessage({ id: newId, html: '<p>세종대왕</p>' })
    })

    expect(container.querySelector('.article-viewer')?.innerHTML).toBe('<p>세종대왕</p>')
  })
})
