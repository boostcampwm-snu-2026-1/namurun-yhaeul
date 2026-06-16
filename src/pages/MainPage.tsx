import { useMainPage } from '../hooks/useMainPage'
import { AppHeader } from '../components/AppHeader'
import { Footer } from '../components/Footer'

function getKstDateLabel(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function MainPage() {
  const { isLoading, error, dailyPrompt, startDaily, startRandom } = useMainPage()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-on-surface-variant font-body-sm text-body-sm">불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-error font-body-sm text-body-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background circuit-bg">
      <AppHeader />

      <main className="pt-16 min-h-screen flex flex-col items-center justify-center px-gutter py-12">
        <div className="w-full max-w-[960px] flex flex-col gap-10">

          {/* Identity */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="나무런 로고" className="h-14 w-14 object-contain" />
              <h1 className="font-headline-lg text-headline-lg text-primary glow-text uppercase tracking-tight">
                나무런<span className="text-on-surface-variant font-headline-md text-headline-md normal-case tracking-normal">: 나무위키 스피드런</span>
              </h1>
            </div>
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest text-center">
              나무위키 링크만으로 목표 문서에 도달하는 스피드런 게임
            </p>
          </div>

          {/* Game mode cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Daily challenge */}
            <div className="md:col-span-7 relative overflow-hidden border border-primary/40 bg-surface-container-lowest flex flex-col p-8 min-h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="relative flex flex-col h-full gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono text-label-mono text-primary uppercase tracking-widest">
                    오늘의 도전
                  </span>
                  <span className="font-label-mono text-label-mono text-on-surface-variant">
                    {getKstDateLabel()}
                  </span>
                </div>

                {dailyPrompt ? (
                  <>
                    <div className="flex-1 flex flex-col justify-center gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-4 py-2 border border-outline-variant bg-surface-container font-headline-md text-headline-md text-on-surface">
                          {dailyPrompt.start_article}
                        </span>
                        <svg width="32" height="12" viewBox="0 0 32 12" fill="none" aria-hidden="true">
                          <path d="M0 6 H26 M22 2 L30 6 L22 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                        </svg>
                        <span className="px-4 py-2 border border-primary/40 bg-primary/10 font-headline-md text-headline-md text-primary">
                          {dailyPrompt.end_article}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        나무위키 내부 링크만을 클릭해 목표 문서에 가장 빠르게 도달하세요.
                      </p>
                    </div>
                    <button
                      onClick={startDaily}
                      className="self-start px-8 py-3 bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:brightness-110 transition-all glow-green"
                    >
                      미션 수행
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">오늘의 도전이 없습니다</p>
                  </div>
                )}
              </div>
            </div>

            {/* Random challenge */}
            <div className="md:col-span-5 border border-outline-variant bg-surface-container-lowest flex flex-col p-8 min-h-64">
              <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
                랜덤 도전
              </span>

              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
                <p className="font-display-timer text-display-timer text-on-surface-variant/20 select-none leading-none">
                  ? → ?
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                  무작위로 선택된 두 문서를 연결하세요
                </p>
              </div>

              <button
                onClick={startRandom}
                className="w-full py-3 border-2 border-primary-container text-primary font-body-sm text-body-sm font-semibold hover:bg-primary-container hover:text-on-primary-container transition-all"
              >
                새로운 랜덤 도전 시작
              </button>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default MainPage
