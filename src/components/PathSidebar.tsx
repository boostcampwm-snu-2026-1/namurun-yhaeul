interface Props {
  path: string[]
}

export function PathSidebar({ path }: Props) {
  return (
    <aside className="w-52 shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col p-3 gap-0.5 overflow-y-auto">
      <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest mb-2 px-2">경로</p>
      {path.map((title, i) => (
        <div key={i}>
          <div
            className={`text-xs px-2 py-1.5 rounded truncate ${
              i === path.length - 1
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-on-surface-variant'
            }`}
            title={title}
          >
            {title}
          </div>
          {i < path.length - 1 && (
            <div className="text-outline text-center text-xs leading-none py-0.5">↓</div>
          )}
        </div>
      ))}
    </aside>
  )
}
