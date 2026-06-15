import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import LeaderboardPage from './LeaderboardPage'

const mockEntries = [
  {
    id: 'uuid-1',
    user_name: '테스터',
    click_count: 3,
    elapsed_ms: 15000,
    start_article: '이순신',
    end_article: '세종대왕',
  },
]

vi.mock('../hooks/useLeaderboard', () => ({
  useLeaderboard: () => ({ entries: mockEntries, isLoading: false, error: null }),
}))

const mockNavigate = vi.fn()
let mockLocationState: unknown = null

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState, pathname: '/leaderboard', search: '', hash: '' }),
  }
})

const validState = {
  startArticle: '이순신',
  endArticle: '세종대왕',
  recordId: 'uuid-1',
}

describe('LeaderboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('location.state가 없으면 navigate("/")를 호출한다', () => {
    mockLocationState = null
    render(<LeaderboardPage />)
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('유효한 state로 접근하면 리더보드가 표시된다', () => {
    mockLocationState = validState
    render(<LeaderboardPage />)
    expect(screen.getByText('전체 순위')).toBeTruthy()
    expect(screen.getByText('테스터')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('현재 사용자 행에 "← 나" 표시가 붙는다', () => {
    mockLocationState = validState
    render(<LeaderboardPage />)
    expect(screen.getByText('← 나')).toBeTruthy()
  })
})
