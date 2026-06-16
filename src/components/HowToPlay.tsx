// CHIMCHAK_VIDEO_URL: 침착맨 플레이 영상 URL을 여기에 입력 (비워두면 관련 영상 섹션이 표시되지 않음)
const CHIMCHAK_VIDEO_URL = ''

function getEmbedUrl(url: string): string | null {
  if (!url.trim()) return null
  if (url.includes('/embed/')) return url
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return `https://www.youtube.com/embed/${short[1]}`
  const watch = url.match(/[?&]v=([^&]+)/)
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`
  return null
}

function FlagIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function CursorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3l14 9-7 1-4 7-3-17z" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4H4v7a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V4H7z" />
      <line x1="7" y1="4" x2="17" y2="4" />
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="11" />
    </svg>
  )
}

const STEPS = [
  {
    number: '01',
    title: '도전 선택',
    description: '오늘의 도전 또는 랜덤 도전을 고릅니다. 시작 문서와 목표 문서가 주어집니다.',
    icon: <FlagIcon />,
  },
  {
    number: '02',
    title: '링크 클릭으로 이동',
    description: '나무위키 내부 링크만 클릭해 목표 문서를 향해 이동합니다. 외부 링크는 막혀 있습니다.',
    icon: <CursorIcon />,
  },
  {
    number: '03',
    title: '목표 문서 도달',
    description: '목표 문서에 도달하면 완료! 최단 시간·최소 클릭 수로 리더보드 상위권을 노려보세요.',
    icon: <TrophyIcon />,
  },
]

export function HowToPlay() {
  const embedUrl = getEmbedUrl(CHIMCHAK_VIDEO_URL)

  return (
    <section className="w-full border-t border-outline-variant bg-surface-container-lowest px-gutter py-16">
      <div className="w-full max-w-[960px] mx-auto flex flex-col gap-12">

        {/* 게임 방법 */}
        <div className="flex flex-col gap-8">
          <span className="font-label-mono text-label-mono text-primary uppercase tracking-widest">
            게임 방법
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="relative overflow-hidden border border-outline-variant bg-surface-container-lowest flex flex-col gap-4 p-6"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="flex items-start justify-between">
                  <span className="font-label-mono text-label-mono text-primary uppercase tracking-widest">
                    {step.number}
                  </span>
                  <span className="text-primary">
                    {step.icon}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-headline-md text-headline-md text-on-surface">
                    {step.title}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 관련 영상 */}
        {embedUrl && (
          <div className="flex flex-col gap-6">
            <span className="font-label-mono text-label-mono text-primary uppercase tracking-widest">
              관련 영상
            </span>
            <div className="w-full aspect-video">
              <iframe
                src={embedUrl}
                title="나무런 플레이 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border border-outline-variant"
              />
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
