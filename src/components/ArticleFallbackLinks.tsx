interface Props {
  hasPrev: boolean
  onPrev: () => void
  onRandom: () => void
}

export function ArticleFallbackLinks({ hasPrev, onPrev, onRandom }: Props) {
  return (
    <div className="border-t border-outline-variant mt-8 pt-4 px-4 pb-4 flex flex-col gap-2">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        이 문서는 렌더링할 수 없습니다. 이동할 문서를 선택하세요.
      </p>
      <div className="flex gap-4">
        {hasPrev && (
          <button
            onClick={onPrev}
            className="font-body-sm text-body-sm text-primary underline underline-offset-2 hover:brightness-110"
          >
            ← 이전 문서
          </button>
        )}
        <button
          onClick={onRandom}
          className="font-body-sm text-body-sm text-primary underline underline-offset-2 hover:brightness-110"
        >
          랜덤 문서로 이동
        </button>
      </div>
    </div>
  )
}
