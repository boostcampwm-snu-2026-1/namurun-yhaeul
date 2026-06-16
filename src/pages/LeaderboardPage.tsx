import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLeaderboard, type LeaderboardTab, type SortBy } from '../hooks/useLeaderboard'
import { AppHeader } from '../components/AppHeader'
import { Footer } from '../components/Footer'
import { formatTime } from '../lib/formatTime'
import { supabase } from '../lib/supabase'

interface LeaderboardState {
  tab: LeaderboardTab
  dailyDate?: string
  recordId: string | null
}

function isLeaderboardState(value: unknown): value is LeaderboardState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.tab === 'daily' || v.tab === 'random'
}

function getKstDateString(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

interface DailyPromptInfo {
  start_article: string
  end_article: string
}

function LeaderboardPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const initialState = isLeaderboardState(location.state) ? location.state : null

  const [activeTab, setActiveTab] = useState<LeaderboardTab>(initialState?.tab ?? 'daily')
  const [dailyDate, setDailyDate] = useState<string>(initialState?.dailyDate ?? getKstDateString())
  const [sortBy, setSortBy] = useState<SortBy>('elapsed_ms')
  const [recordId] = useState<string | null>(initialState?.recordId ?? null)

  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [dailyPromptInfo, setDailyPromptInfo] = useState<DailyPromptInfo | null>(null)
  const [promptLoading, setPromptLoading] = useState(false)

  const { entries, isLoading, error } = useLeaderboard(activeTab, dailyDate, sortBy)

  // fetch available daily dates for navigation
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('daily_prompts')
        .select('date')
        .order('date', { ascending: false })
        .limit(60)
      if (data) {
        setAvailableDates((data as { date: string }[]).map((r) => r.date))
      }
    }
    void fetch()
  }, [])

  // fetch daily prompt info (start/end article) for selected date
  useEffect(() => {
    if (activeTab !== 'daily') return
    setPromptLoading(true)
    const fetch = async () => {
      const { data } = await supabase
        .from('daily_prompts')
        .select('start_article, end_article')
        .eq('date', dailyDate)
        .maybeSingle()
      setDailyPromptInfo(data as DailyPromptInfo | null)
      setPromptLoading(false)
    }
    void fetch()
  }, [activeTab, dailyDate])

  const currentDateIndex = availableDates.indexOf(dailyDate)
  const hasPrevDate = currentDateIndex < availableDates.length - 1
  const hasNextDate = currentDateIndex > 0

  const goPrevDate = () => {
    if (hasPrevDate) setDailyDate(availableDates[currentDateIndex + 1])
  }
  const goNextDate = () => {
    if (hasNextDate) setDailyDate(availableDates[currentDateIndex - 1])
  }

  return (
    <div className="min-h-screen bg-background circuit-bg">
      <AppHeader />
      <div className="pt-16 flex flex-col items-center py-stack-lg px-gutter">
      <div className="w-full max-w-content-max-width flex flex-col gap-stack-lg">
        <div className="text-center">
          <p className="font-headline-md text-headline-md text-on-surface mb-1">리더보드</p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-outline-variant">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-3 font-label-mono text-label-mono uppercase tracking-wider transition-colors ${
              activeTab === 'daily'
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            날짜별 랭킹
          </button>
          <button
            onClick={() => setActiveTab('random')}
            className={`px-6 py-3 font-label-mono text-label-mono uppercase tracking-wider transition-colors ${
              activeTab === 'random'
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            랜덤도전 랭킹
          </button>
        </div>

        {/* Daily: date navigation + prompt info */}
        {activeTab === 'daily' && (
          <div className="flex flex-col gap-stack-sm">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={goPrevDate}
                disabled={!hasPrevDate}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="이전 날짜"
              >
                ←
              </button>
              <span className="font-label-mono text-label-mono text-on-surface min-w-[120px] text-center">
                {dailyDate}
              </span>
              <button
                onClick={goNextDate}
                disabled={!hasNextDate}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="다음 날짜"
              >
                →
              </button>
            </div>
            {!promptLoading && dailyPromptInfo && (
              <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
                <span className="text-on-surface font-semibold">{dailyPromptInfo.start_article}</span>
                <span className="mx-2 text-outline-variant">→</span>
                <span className="text-primary font-semibold">{dailyPromptInfo.end_article}</span>
              </p>
            )}
            {!promptLoading && !dailyPromptInfo && (
              <p className="text-center font-body-sm text-body-sm text-on-surface-variant">해당 날짜의 오늘의 문제가 없습니다.</p>
            )}
          </div>
        )}

        {/* Sort toggle */}
        <div className="flex items-center gap-2">
          <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">정렬:</span>
          <button
            onClick={() => setSortBy('elapsed_ms')}
            className={`px-3 py-1 rounded-lg font-label-mono text-label-mono transition-colors ${
              sortBy === 'elapsed_ms'
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            소요 시간
          </button>
          <button
            onClick={() => setSortBy('click_count')}
            className={`px-3 py-1 rounded-lg font-label-mono text-label-mono transition-colors ${
              sortBy === 'click_count'
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            이동 횟수
          </button>
        </div>

        {/* Leaderboard table */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          {error && (
            <div className="p-8 text-center text-error font-body-sm text-body-sm">
              순위를 불러올 수 없습니다.
            </div>
          )}

          {!error && (
            <table className="w-full font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-highest text-on-surface-variant font-label-mono text-label-mono uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-10">순위</th>
                  <th className="px-4 py-3 text-left">닉네임</th>
                  <th className="px-4 py-3 text-center">이동 횟수</th>
                  <th className="px-4 py-3 text-center">소요 시간</th>
                  {activeTab === 'random' && (
                    <>
                      <th className="px-4 py-3 text-left">시작 문서</th>
                      <th className="px-4 py-3 text-left">도착 문서</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, i) => {
                  const entry = entries[i]
                  const isCurrentUser = !!entry && entry.id === recordId
                  return (
                    <tr
                      key={entry?.id ?? `empty-${i}`}
                      className={`border-t border-outline-variant ${isCurrentUser ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}
                    >
                      <td className="px-4 py-3 text-center font-semibold">
                        {i === 0 ? (
                          <span className="text-tertiary-fixed-dim">1</span>
                        ) : i === 1 ? (
                          <span className="text-secondary-fixed-dim">2</span>
                        ) : i === 2 ? (
                          <span className="text-tertiary">3</span>
                        ) : (
                          <span className="text-on-surface-variant">{i + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isLoading ? (
                          <span className="text-on-surface-variant">—</span>
                        ) : entry ? (
                          <>
                            <span className={isCurrentUser ? 'font-bold text-primary' : 'text-on-surface'}>
                              {entry.user_name}
                            </span>
                            {isCurrentUser && (
                              <span className="ml-1 text-xs text-primary font-label-mono">← 나</span>
                            )}
                          </>
                        ) : (
                          <span className="text-outline-variant">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLoading || !entry ? (
                          <span className="text-outline-variant">—</span>
                        ) : (
                          <span className="text-on-surface">{entry.click_count}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLoading || !entry ? (
                          <span className="text-outline-variant">—</span>
                        ) : (
                          <span className="font-display-timer text-on-surface">{formatTime(entry.elapsed_ms)}</span>
                        )}
                      </td>
                      {activeTab === 'random' && (
                        <>
                          <td className="px-4 py-3 text-on-surface-variant truncate max-w-[120px]">
                            {!isLoading && entry ? entry.start_article : <span className="text-outline-variant">—</span>}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant truncate max-w-[120px]">
                            {!isLoading && entry ? entry.end_article : <span className="text-outline-variant">—</span>}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-primary text-on-primary font-body-sm font-semibold rounded-xl hover:brightness-110 transition-all"
        >
          메인으로
        </button>
      </div>
      </div>
      <Footer />
    </div>
  )
}

export default LeaderboardPage
