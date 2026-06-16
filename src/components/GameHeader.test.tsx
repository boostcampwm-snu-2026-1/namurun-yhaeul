import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GameHeader } from './GameHeader'

afterEach(() => {
  cleanup()
})

describe('GameHeader', () => {
  it('목표 문서명, 타이머, 클릭 수를 표시한다', () => {
    render(
      <GameHeader
        targetTitle="세종대왕"
        targetSummary="조선의 제4대 임금으로 한글 창제를 주도했다."
        summaryStatus="success"
        elapsedMs={12300}
        clickCount={5}
        onQuit={vi.fn()}
      />,
    )

    expect(screen.getByText(/세종대왕/)).toBeTruthy()
    expect(screen.getByText('00:12.3')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('60초 이상 시 분 단위로 표시한다', () => {
    render(
      <GameHeader
        targetTitle="이순신"
        targetSummary="임진왜란 당시 활약한 조선의 장군이다."
        summaryStatus="success"
        elapsedMs={61000}
        clickCount={0}
        onQuit={vi.fn()}
      />,
    )

    expect(screen.getByText('01:01.0')).toBeTruthy()
  })

  it('정보 아이콘 hover 시 AI 생성 설명 툴팁을 표시한다', () => {
    render(
      <GameHeader
        targetTitle="세종대왕"
        targetSummary="조선의 제4대 임금으로 한글 창제를 주도했다."
        summaryStatus="success"
        elapsedMs={0}
        clickCount={0}
        onQuit={vi.fn()}
      />,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: '목표 문서 설명 보기' }))

    expect(screen.getByRole('tooltip')).toBeTruthy()
    expect(screen.getByText('AI가 문서를 읽고 생성한 설명')).toBeTruthy()
    expect(screen.getByText('조선의 제4대 임금으로 한글 창제를 주도했다.')).toBeTruthy()
  })

  it('로딩 중에는 AI가 설명 생성 중이라는 문구를 표시한다', () => {
    render(
      <GameHeader
        targetTitle="세종대왕"
        targetSummary={null}
        summaryStatus="loading"
        elapsedMs={0}
        clickCount={0}
        onQuit={vi.fn()}
      />,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: '목표 문서 설명 보기' }))

    expect(screen.getByText('AI 요약')).toBeTruthy()
    expect(screen.getByText('AI가 문서를 읽고 설명을 생성하는 중입니다...')).toBeTruthy()
  })

  it('요약 실패 시 fallback 문구를 표시한다', () => {
    render(
      <GameHeader
        targetTitle="세종대왕"
        targetSummary={null}
        summaryStatus="error"
        elapsedMs={0}
        clickCount={0}
        onQuit={vi.fn()}
      />,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: '목표 문서 설명 보기' }))

    expect(screen.getByText('AI 요약')).toBeTruthy()
    expect(screen.getByText('설명을 불러올 수 없습니다')).toBeTruthy()
  })
})
