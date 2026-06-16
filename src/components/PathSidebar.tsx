import { useEffect, useRef } from 'react'

interface Props {
  path: string[]
}

export function PathSidebar({ path }: Props) {
  const asideRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!asideRef.current) return
    asideRef.current.scrollTo?.({ top: asideRef.current.scrollHeight, behavior: 'smooth' })
  }, [path])

  return (
    <aside ref={asideRef} className="w-40 shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col overflow-y-auto">
      <div className="px-3 py-2 border-b border-outline-variant shrink-0">
        <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          이동 경로
        </span>
      </div>

      <div className="flex flex-col p-2 pb-10 gap-0.5">
        {path.map((title, i) => {
          const isCurrent = i === path.length - 1
          return (
            <div key={i}>
              <div className="flex items-start gap-1.5">
                <span className="font-label-mono text-[10px] text-on-surface-variant/40 shrink-0 w-4 text-right leading-5">
                  {i + 1}
                </span>
                <div
                  className={`flex-1 min-w-0 text-xs px-2 py-1 truncate ${
                    isCurrent
                      ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
                      : 'text-on-surface-variant'
                  }`}
                  title={title}
                >
                  {title}
                </div>
              </div>
              {i < path.length - 1 && (
                <div className="text-outline-variant text-center text-xs leading-none pl-5">↓</div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
