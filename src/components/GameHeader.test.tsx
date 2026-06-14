import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameHeader } from './GameHeader'

describe('GameHeader', () => {
  it('목표 문서명, 타이머, 클릭 수를 표시한다', () => {
    render(<GameHeader targetTitle="세종대왕" elapsedMs={12300} clickCount={5} onQuit={vi.fn()} />)

    expect(screen.getByText(/세종대왕/)).toBeTruthy()
    expect(screen.getByText('00:12.3')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('60초 이상 시 분 단위로 표시한다', () => {
    render(<GameHeader targetTitle="이순신" elapsedMs={61000} clickCount={0} onQuit={vi.fn()} />)

    expect(screen.getByText('01:01.0')).toBeTruthy()
  })
})
