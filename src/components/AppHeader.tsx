import { useNavigate, useLocation } from 'react-router-dom'
import { NamurunLogo } from './NamurunLogo'

export function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="bg-surface-container-low border-b border-outline-variant shadow-[0_0_12px_rgba(0,164,149,0.1)] flex justify-between items-center w-full h-16 px-gutter fixed top-0 z-50">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <NamurunLogo size={40} />
        <span className="font-headline-lg text-[24px] tracking-tighter text-primary">나무런</span>
      </div>
      <nav className="hidden md:flex items-center h-full">
        <button
          onClick={() => navigate('/')}
          className={`h-full flex items-center px-4 font-body-sm text-body-sm transition-colors duration-75 ${
            location.pathname === '/'
              ? 'text-primary font-bold border-b-2 border-primary'
              : 'text-on-surface-variant font-medium hover:bg-primary hover:text-on-primary'
          }`}
        >
          메인 로비
        </button>
      </nav>
    </header>
  )
}
