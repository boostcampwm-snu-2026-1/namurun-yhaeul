export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant bg-surface-container-low px-gutter py-4 mt-auto">
      <p className="font-label-mono text-label-mono text-on-surface-variant text-center">
        이 서비스는{' '}
        <a
          href="https://namu.wiki"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-on-surface transition-colors"
        >
          나무위키
        </a>
        {' '}덤프 데이터(2021년 초 기준)를 기반으로 합니다.{' '}
        나무위키 콘텐츠는{' '}
        <a
          href="https://creativecommons.org/licenses/by-nc-sa/2.0/kr/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-on-surface transition-colors"
        >
          CC BY-NC-SA 2.0 KR
        </a>
        {' '}에 따라 이용할 수 있습니다.
      </p>
    </footer>
  )
}
