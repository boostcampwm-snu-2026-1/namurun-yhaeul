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

// LeaderboardPage now calls supabase directly for date list and daily prompt info
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }),
  },
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
  tab: 'random' as const,
  recordId: 'uuid-1',
}

describe('LeaderboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('location.state가 없어도 리더보드가 기본 탭으로 표시된다', () => {
    mockLocationState = null
    render(<LeaderboardPage />)
    expect(screen.getAllByText('리더보드').length).toBeGreaterThanOrEqual(1)
  })

  it('유효한 state로 접근하면 리더보드가 표시된다', () => {
    mockLocationState = validState
    render(<LeaderboardPage />)
    expect(screen.getAllByText('리더보드').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('테스터')).toBeTruthy()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  it('현재 사용자 행에 "← 나" 표시가 붙는다', () => {
    mockLocationState = validState
    render(<LeaderboardPage />)
    expect(screen.getByText('← 나')).toBeTruthy()
  })
})
