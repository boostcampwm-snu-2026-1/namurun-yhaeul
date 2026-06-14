import { useMainPage } from '../hooks/useMainPage'

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
    <div className="flex flex-col items-center justify-center min-h-screen gap-stack-lg p-gutter bg-background circuit-bg">
      <h1 className="font-headline-lg text-headline-lg text-primary glow-text">나무런</h1>

      {dailyPrompt ? (
        <section className="flex flex-col items-center gap-stack-md p-stack-lg border border-outline-variant rounded-xl bg-surface-container-low w-full max-w-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">오늘의 문제</h2>
          <div className="flex items-center gap-3 font-body-sm text-body-sm">
            <span className="font-semibold text-on-surface">{dailyPrompt.start_article}</span>
            <span className="text-on-surface-variant">→</span>
            <span className="font-semibold text-on-surface">{dailyPrompt.end_article}</span>
          </div>
          <button
            onClick={startDaily}
            className="px-6 py-2 bg-primary-container text-on-primary-container rounded-xl font-body-sm font-semibold hover:brightness-110 transition-all glow-green"
          >
            도전하기
          </button>
        </section>
      ) : (
        <p className="text-on-surface-variant font-body-sm text-body-sm">오늘의 문제가 없습니다</p>
      )}

      <button
        onClick={startRandom}
        className="px-6 py-2 bg-primary text-on-primary rounded-xl font-body-sm font-semibold hover:brightness-110 transition-all"
      >
        랜덤 스피드런 시작
      </button>
    </div>
  )
}

export default MainPage
