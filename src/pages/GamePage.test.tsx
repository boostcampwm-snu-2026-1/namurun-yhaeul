import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GamePage from './GamePage'

vi.mock('../hooks/useGame', () => ({
  useGame: () => ({
    elapsedMs: 0,
    clickCount: 0,
    path: [],
    isRunning: false,
    startGame: vi.fn(),
    restoreGame: vi.fn(),
    recordVisit: vi.fn(),
    undoLastVisit: vi.fn(),
    stopGame: vi.fn(),
  }),
}))

vi.mock('../hooks/useArticle', () => ({
  useArticle: () => ({
    article: null,
    isLoading: false,
    error: null,
    loadArticle: vi.fn(),
  }),
}))

vi.mock('../hooks/useRedirect', () => ({
  useRedirect: () => ({
    resolveRedirect: vi.fn(),
  }),
}))

vi.mock('../components/ArticleViewer', () => ({
  ArticleViewer: () => <div data-testid="article-viewer">Article</div>,
}))

vi.mock('../lib/articles', () => ({
  fetchRandomArticleTitle: vi.fn().mockResolvedValue('랜덤문서'),
}))

vi.mock('../components/GameHeader', () => ({
  GameHeader: ({ targetTitle }: { targetTitle: string }) => (
    <div data-testid="game-header">{targetTitle}</div>
  ),
}))

const mockNavigate = vi.fn()
let mockLocationState: unknown = null

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState, pathname: '/game', search: '', hash: '' }),
  }
})

describe('GamePage', () => {
  it('location.state가 없으면 잘못된 접근 메시지를 표시한다', () => {
    mockLocationState = null
    render(<GamePage />)
    expect(screen.getByText('잘못된 접근입니다.')).toBeTruthy()
  })

  it('유효한 state로 접근하면 GameHeader가 목표 문서명과 함께 렌더링된다', () => {
    mockLocationState = { start: '이순신', end: '세종대왕' }
    render(<GamePage />)
    expect(screen.getByTestId('game-header')).toBeTruthy()
    expect(screen.getByText('세종대왕')).toBeTruthy()
  })
})
