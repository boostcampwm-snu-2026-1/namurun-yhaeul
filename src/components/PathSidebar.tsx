interface Props {
  path: string[]
}

export function PathSidebar({ path }: Props) {
  return (
    <aside className="w-36 shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col p-3 gap-0.5 overflow-y-auto">
      {path.map((title, i) => (
        <div key={i}>
          <div
            className={`text-xs px-2 py-1 rounded truncate ${
              i === path.length - 1
                ? 'bg-surface-container-highest text-primary font-semibold border-l-2 border-primary'
                : 'text-on-surface-variant'
            }`}
            title={title}
          >
            {title}
          </div>
          {i < path.length - 1 && (
            <div className="text-outline-variant text-center text-xs leading-none">↓</div>
          )}
        </div>
      ))}
    </aside>
  )
}
