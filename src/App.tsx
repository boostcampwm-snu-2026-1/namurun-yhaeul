import { Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'
import LeaderboardPage from './pages/LeaderboardPage'
import RenderDemoPage from './pages/RenderDemoPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/render-demo" element={<RenderDemoPage />} />
    </Routes>
  )
}

export default App
