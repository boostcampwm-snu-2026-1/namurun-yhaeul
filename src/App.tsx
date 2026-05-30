import { Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  )
}

export default App
