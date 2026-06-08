import { useMainPage } from '../hooks/useMainPage'

function MainPage() {
  const { isLoading, error, dailyPrompt, startDaily, startRandom } = useMainPage()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <h1 className="text-3xl font-bold">나무런</h1>

      {dailyPrompt ? (
        <section className="flex flex-col items-center gap-4 p-6 border rounded-lg w-full max-w-md">
          <h2 className="text-xl font-semibold">오늘의 문제</h2>
          <div className="flex items-center gap-3 text-lg">
            <span className="font-medium">{dailyPrompt.start_article}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium">{dailyPrompt.end_article}</span>
          </div>
          <button
            onClick={startDaily}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            도전하기
          </button>
        </section>
      ) : (
        <p className="text-gray-500">오늘의 문제가 없습니다</p>
      )}

      <button
        onClick={startRandom}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        랜덤 스피드런 시작
      </button>
    </div>
  )
}

export default MainPage
