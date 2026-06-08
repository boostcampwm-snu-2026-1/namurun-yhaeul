import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import ResultPage from './ResultPage'

vi.mock('../hooks/useGameRecord', () => ({
  useGameRecord: () => ({ isSaved: false, saveError: null }),
}))

const mockNavigate = vi.fn()
let mockLocationState: unknown = null

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState, pathname: '/result', search: '', hash: '' }),
  }
})

const validState = {
  startArticle: '이순신',
  endArticle: '세종대왕',
  path: ['이순신', '조선', '세종대왕'],
  elapsedMs: 12345,
  clickCount: 2,
}

describe('ResultPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('location.state가 없으면 navigate("/")를 호출한다', () => {
    mockLocationState = null
    render(<ResultPage />)
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('유효한 state로 접근하면 결과를 표시한다', () => {
    mockLocationState = validState
    render(<ResultPage />)
    expect(screen.getByText('도착!')).toBeTruthy()
    expect(screen.getByText('00:12.3')).toBeTruthy()
    expect(screen.getByText('2번')).toBeTruthy()
  })

  it('이동 경로의 모든 문서명이 표시된다', () => {
    mockLocationState = validState
    render(<ResultPage />)
    expect(screen.getByText('이순신')).toBeTruthy()
    expect(screen.getByText('조선')).toBeTruthy()
    expect(screen.getByText('세종대왕')).toBeTruthy()
  })
})
