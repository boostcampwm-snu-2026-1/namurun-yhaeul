interface Props {
  onConfirm: () => void
  onCancel: () => void
}

export function QuitConfirmModal({ onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-gutter">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg flex flex-col gap-stack-md w-full max-w-sm">
        <div>
          <p className="font-headline-md text-headline-md text-on-surface mb-1">게임을 포기하시겠습니까?</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">지금까지의 진행 상황이 사라집니다.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-outline text-on-surface font-body-sm text-body-sm rounded-lg hover:bg-surface-container transition-all"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-error text-on-error font-body-sm text-body-sm rounded-lg hover:brightness-110 transition-all"
          >
            포기하기
          </button>
        </div>
      </div>
    </div>
  )
}
