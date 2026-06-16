import { useMainPage } from '../hooks/useMainPage'
import { AppHeader } from '../components/AppHeader'

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

      <main className="pt-16 px-gutter pb-stack-lg">
        <div className="max-w-[1000px] mx-auto">
          {/* Hero section */}
          <section className="mb-stack-lg flex flex-col items-center justify-center text-center py-stack-lg">
            <div className="relative mb-stack-md">
              <div className="absolute -inset-4 border border-primary/20 animate-pulse" />
              <img src="/logo.png" alt="나무런 로고" className="h-32 w-32 object-contain relative z-10" />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary glow-text mb-4 uppercase tracking-tight">
              나무런
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[600px] mb-stack-lg">
              나무위키 내부 링크만으로 목표 문서에 가장 빨리 도달하는 스피드런
            </p>
            <div className="group relative inline-block">
              <div className="absolute -inset-1 bg-primary blur opacity-25 group-hover:opacity-50 transition duration-200" />
              <button
                onClick={startRandom}
                className="relative px-12 py-4 bg-surface-container border-2 border-primary-container text-primary font-headline-md text-[18px] font-bold hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 glow-green"
              >
                새로운 도전 시작
              </button>
            </div>
          </section>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md">
            {/* Daily challenge card */}
            {dailyPrompt ? (
              <div className="md:col-span-8 bg-surface-container border border-outline-variant p-gutter relative overflow-hidden">
                <div className="flex flex-col h-full">
                  <p className="font-label-mono text-label-mono text-primary mb-2 uppercase tracking-widest">
                    오늘의 도전
                  </p>
                  <div className="flex items-center gap-3 mb-stack-md">
                    <span className="font-headline-md text-headline-md text-on-surface">
                      {dailyPrompt.start_article}
                    </span>
                    <span className="text-on-surface-variant text-xl">→</span>
                    <span className="font-headline-md text-headline-md text-primary">
                      {dailyPrompt.end_article}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-gutter">
                    <span className="text-primary font-bold">{dailyPrompt.start_article}</span>에서 시작하여{' '}
                    <span className="text-primary font-bold">{dailyPrompt.end_article}</span>까지 도달하세요.
                  </p>
                  <button
                    onClick={startDaily}
                    className="mt-auto self-start px-6 py-2 border border-primary text-primary hover:bg-primary hover:text-on-primary transition-all font-body-sm text-body-sm"
                  >
                    미션 수행
                  </button>
                </div>
              </div>
            ) : (
              <div className="md:col-span-8 bg-surface-container border border-outline-variant p-gutter flex items-center justify-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant">오늘의 도전이 없습니다</p>
              </div>
            )}

            {/* Random speedrun card */}
            <div className="md:col-span-4 bg-surface-container border border-outline-variant p-gutter flex flex-col gap-stack-sm">
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
                랜덤 도전
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">
                무작위로 선택된 두 문서를 연결하세요.
              </p>
              <button
                onClick={startRandom}
                className="px-6 py-2 bg-primary text-on-primary hover:brightness-110 transition-all font-body-sm text-body-sm font-semibold"
              >
                랜덤 스피드런
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default MainPage
