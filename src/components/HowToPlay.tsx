// 침착맨 플레이 영상 URL을 여기에 입력 (비워두면 관련 영상 섹션이 표시되지 않음)
const CHIMCHAK_VIDEO_URL = 'https://youtu.be/EONlXsPEoJA?si=goPXX1kVcQJfLPib&t=529'

function getEmbedUrl(url: string): string | null {
  if (!url.trim()) return null
  if (url.includes('/embed/')) return url

  let videoId: string | null = null
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) videoId = short[1]

  if (!videoId) {
    const watch = url.match(/[?&]v=([^&]+)/)
    if (watch) videoId = watch[1]
  }

  if (!videoId) return null

  const time = url.match(/[?&]t=(\d+)/)
  return time
    ? `https://www.youtube.com/embed/${videoId}?start=${time[1]}`
    : `https://www.youtube.com/embed/${videoId}`
}

function FlagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4H4v7a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V4H7z" />
      <line x1="7" y1="4" x2="17" y2="4" />
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="11" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M14 6l6 6-6 6" />
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
    icon: <LinkIcon />,
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
    <section className="w-full bg-surface-container border-t border-outline-variant">
      <div className="w-full max-w-[960px] mx-auto px-gutter py-14 flex flex-col gap-10">

        {/* Section heading */}
        <div className="flex items-center gap-4">
          <span className="font-headline-md text-sm font-semibold text-primary uppercase tracking-wider shrink-0">
            게임 방법
          </span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Steps with arrow connectors */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_40px_1fr_40px_1fr] items-stretch gap-4 md:gap-0">
          {STEPS.flatMap((step, i) => [
            <div
              key={step.number}
              className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant p-6 flex flex-col gap-5 hover:border-primary/50 transition-colors"
            >
              {/* Left accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/40" />

              {/* Watermark number */}
              <div className="absolute bottom-0 right-0 pointer-events-none select-none overflow-hidden">
                <span className="font-label-mono text-[72px] leading-none text-on-surface/[0.04] block translate-x-2 translate-y-2">
                  {step.number}
                </span>
              </div>

              {/* Icon circle */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
                {step.icon}
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2 relative">
                <p className="font-headline-md text-headline-md text-on-surface">
                  {step.title}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {step.description}
                </p>
              </div>
            </div>,

            i < STEPS.length - 1
              ? (
                <div key={`arrow-${i}`} className="hidden md:flex items-center justify-center text-outline-variant">
                  <ArrowIcon />
                </div>
              )
              : null,
          ])}
        </div>

        {/* Related video */}
        {embedUrl && (
          <div className="flex flex-col gap-6 pt-6 border-t border-outline-variant">
            <div className="flex items-center gap-4">
              <span className="font-headline-md text-sm font-semibold text-primary uppercase tracking-wider shrink-0">
                관련 영상
              </span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
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
