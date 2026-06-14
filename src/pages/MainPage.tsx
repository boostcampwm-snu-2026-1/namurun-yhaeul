import { useMainPage } from '../hooks/useMainPage'
import { NamurunLogo } from '../components/NamurunLogo'

function MainPage() {
  const { isLoading, error, dailyPrompt, startDaily, startRandom } = useMainPage()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-on-surface-variant font-mono text-sm">불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-error text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-10 p-6">
      <div className="flex flex-col items-center gap-4">
        <NamurunLogo size={72} />
        <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">나무런</h1>
        <p className="text-on-surface-variant text-sm text-center max-w-xs">
          나무위키 내부 링크만으로 목표 문서에 가장 빨리 도달하세요
        </p>
      </div>

      {dailyPrompt ? (
        <section className="flex flex-col items-center gap-5 p-6 border border-outline-variant rounded-lg bg-surface-container w-full max-w-sm">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-on-surface-variant font-mono uppercase tracking-widest">오늘의 문제</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-headline font-bold text-on-surface">{dailyPrompt.start_article}</span>
              <span className="text-primary font-mono">→</span>
              <span className="font-headline font-bold text-on-surface">{dailyPrompt.end_article}</span>
            </div>
          </div>
          <button
            onClick={startDaily}
            className="w-full py-2.5 bg-primary-container text-on-primary-container font-headline font-bold rounded hover:opacity-90 transition-opacity"
          >
            도전하기
          </button>
        </section>
      ) : (
        <p className="text-on-surface-variant text-sm">오늘의 문제가 없습니다</p>
      )}

      <button
        onClick={startRandom}
        className="px-8 py-2.5 border border-primary text-primary font-headline font-bold rounded hover:bg-primary hover:text-on-primary transition-colors"
      >
        랜덤 스피드런 시작
      </button>
    </div>
  )
}

export default MainPage
