interface Props {
  onConfirm: () => void
  onCancel: () => void
}

export function QuitConfirmModal({ onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-gutter backdrop-blur-sm">
      <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-sm flex flex-col overflow-hidden">
        <div className="h-[3px] bg-error/70 w-full" />
        <div className="p-stack-lg flex flex-col gap-stack-md">
          <div>
            <p className="font-label-mono text-label-mono text-error uppercase tracking-widest mb-2">게임 포기</p>
            <p className="font-headline-md text-headline-md text-on-surface mb-1">정말 포기하시겠습니까?</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">지금까지의 진행 상황이 사라집니다.</p>
          </div>
          <div className="flex gap-2 pt-stack-sm">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface font-body-sm text-body-sm hover:bg-surface-container transition-all"
            >
              계속하기
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-error text-on-error font-body-sm text-body-sm font-semibold hover:brightness-110 transition-all"
            >
              포기하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
