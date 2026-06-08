interface Props {
  path: string[]
}

export function PathSidebar({ path }: Props) {
  return (
    <aside className="w-36 shrink-0 border-r bg-gray-50 flex flex-col p-3 gap-0.5 overflow-y-auto sticky top-0 h-[calc(100vh-3.5rem)]">
      {path.map((title, i) => (
        <div key={i}>
          <div
            className={`text-xs px-2 py-1 rounded truncate ${
              i === path.length - 1
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-400'
            }`}
            title={title}
          >
            {title}
          </div>
          {i < path.length - 1 && (
            <div className="text-gray-300 text-center text-xs leading-none">↓</div>
          )}
        </div>
      ))}
    </aside>
  )
}
