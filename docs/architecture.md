# 아키텍처

## 데이터 흐름

```
사용자 링크 클릭
  → namumark 렌더링 결과의 href 형식으로 내부/외부 링크 구분
    (내부: /w/<title>, 외부: http:// 또는 opennamu_link_out 클래스)
  → Supabase redirects 테이블 확인 (NASDAQ → 나스닥 등 리다이렉트 처리)
  → 프론트엔드가 R2에서 "articles/{title}.json" fetch (CDN 캐시)
  → namumark-clone-core로 HTML 렌더링
  → 목표 문서 도달 시 game_records에 기록
```

## 저장소 분리 이유

| 데이터 | 저장 위치 | 이유 |
|--------|-----------|------|
| 문서 본문 (나무마크 원문) | Cloudflare R2 | 문서당 수십KB — Supabase에 넣으면 매 클릭마다 느려짐. R2는 Key-Value 구조라 `articles/이순신.json`으로 즉시 접근 + CDN 캐싱 |
| 메타데이터 (제목, 링크 목록) | Supabase `articles` | 링크 유효성 검증, 랜덤 문제 추출에 쿼리 필요 |
| 리다이렉트 매핑 | Supabase `redirects` | 링크 클릭 시 실시간 조회 필요 |
| 게임 기록 | Supabase `game_records` | 리더보드 집계 쿼리 필요 |
| 일일 문제 | Supabase `daily_prompts` | 날짜 기준 단건 조회 |

## 화면 구성 및 흐름

```
[메인 화면]
  ├─ 오늘의 문제 — daily_prompts에서 오늘 날짜로 조회
  └─ 랜덤 스피드런 시작 — byte_size 상위 문서 중 무작위 2개 선택

      ↓

[게임 화면]
  ├─ 상단 헤더: 목표 문서명 | 경과 시간 타이머 | 클릭 수 카운터
  ├─ 좌측 사이드바: 이동 경로 (시작 문서부터 현재 문서까지 순서대로 표시)
  ├─ 문서 영역: R2 fetch → namumark-clone-core 렌더링
  ├─ 링크 클릭 → href 형식 판별 → redirects 확인 → R2 fetch → 이동
  ├─ 외부 링크(`opennamu_link_out`): 클릭 차단 + 토스트 "외부 링크입니다!"
  ├─ R2 fetch 실패 시: 우측 하단 토스트 "이동이 불가능합니다", 현재 문서 유지
  │    ArticleNetworkError  — 연결 실패 (오프라인, CORS 등)
  │    ArticleNotFoundError — 404, R2에 파일 없음
  │    ArticleFetchError    — 기타 HTTP 오류
  │    ArticleParseError    — 200 응답이지만 JSON 파싱 실패
  └─ 막힌 경우: "게임 포기" 버튼 → navigate('/')

      ↓ (목표 문서 도달)

[결과 화면]
  ├─ 소요 시간(MM:SS.s), 총 클릭 수, 거쳐온 경로 표시
  ├─ 마운트 시 game_records INSERT (user_name=null) → recordId 확보
  ├─ 닉네임 입력 (필수, 직전 제출값을 localStorage `namurun_nickname`에서 자동 prefill) → game_records UPDATE (user_name)
  └─ 제출 완료 → 닉네임 localStorage 저장 → navigate('/leaderboard', { state: { tab, dailyDate, recordId } })
       tab은 게임의 challenge_type('daily' | 'random'), dailyDate는 daily일 때만 사용

[리더보드 화면 /leaderboard]
  ├─ 탭: `오늘의 문제`(challenge_type='daily') / `랜덤 도전`(challenge_type='random')
  │    결과 화면에서 진입 시 직전 게임의 challenge_type을 location.state.tab으로 전달해 자동 선택
  ├─ 날짜 네비게이터 (daily 탭 전용)
  │    daily_prompts에서 최근 60일치 날짜 목록을 조회 → 이전/다음 날짜로 이동
  │    기본값은 KST 기준 오늘 (`new Date(Date.now() + 9h).toISOString().slice(0,10)`)
  │    선택한 날짜의 시작/도착 문서를 daily_prompts에서 조회해 헤더에 표시
  ├─ 정렬 기준 선택: 소요 시간(elapsed_ms) / 클릭 수(click_count)
  │    선택한 기준 ASC → 나머지 기준 ASC 보조 정렬
  ├─ 필터: `user_name IS NOT NULL` — 닉네임 미제출 행 제외
  ├─ 상위 10개, 컬럼: 순위, 닉네임, 클릭 수, 소요 시간
  │    랜덤 도전 탭에서는 문제별로 시작/도착 문서가 다르므로 해당 컬럼 추가 노출
  ├─ 현재 게임 행(recordId 일치) 하이라이트
  └─ 다시 하기 버튼 → navigate('/')
```

## BFS 경로 검증 생략 이유

게임 시작 전 "경로가 존재하는가"를 BFS로 검증하지 않는다.

- 나무위키 특성상 바이트가 큰 인기 문서끼리는 6단계 내 연결 가능 (Six Degrees 효과)
- BFS 사전 검증 시 비용이 크고 게임 시작이 느려짐
- 대신 막히는 경우 **"게임 포기" 버튼**으로 UX에서 대응

---

## 나무마크 렌더링 방침

- 라이브러리: `namumark-clone-core` (TypeScript, npm)
- 완벽한 렌더링 불필요 — 게임 목적이므로 **링크 동작**이 핵심
- 표, 이미지, 복잡한 매크로 깨짐 허용
- `[[문서명]]` / `[[실제명|표시텍스트]]` 링크 렌더링이 최우선
- `NamuMark().parse()`는 **Web Worker**(`src/workers/namumark.worker.ts`)에서 실행 — 메인 스레드 블로킹으로 타이머 UI가 멈추는 문제 방지. 요청 ID 비교로 빠른 연속 클릭 시 이전 파싱 결과를 무시(race condition 방지)
- **`$` 에스케이프 workaround**: namumark 내부 `String.replace(regex, string)` 호출에서 교체 문자열 안의 `$1`, `$2` 등이 캡처 그룹 참조로 해석됨. 각주에 달러 금액(`$1.30` 등)이 있는 문서에서 RangeError 발생. 파싱 전 `$`를 PUA 문자(U+E024)로 치환하고 파싱 후 HTML에서 복원하는 방식으로 우회. `split/join` 사용(`replace`도 동일 문제 있으므로)
- **문서 제목은 namumark 파싱 결과 외부에서 렌더링** — `ArticleViewer`가 `displayedTitle` state를 별도 `<h1>` 요소로 표시. XSS 방지: dangerouslySetInnerHTML에 제목을 넣지 않는다. `displayedTitle`은 `article.title` 즉시 반영이 아닌 Worker 응답 시점에 `setHtml`과 함께 갱신 — 본문과 제목이 동일한 렌더에 전환되어 제목만 먼저 바뀌는 깜빡임 방지. `pendingTitleRef`에 postMessage 시점의 제목을 저장해두고 Worker 응답 시 참조
- **namumark 생성 클래스 · 엘리먼트 (CSS 타깃)**: `opennamu_TOC`(목차 컨테이너), `opennamu_TOC_title`(목차 헤딩), `opennamu_footnote`(주석 섹션), `opennamu_category`(카테고리 섹션 숨김), `opennamu_list_N`(중첩 레벨별 bullet — 1·3·5: disc/square, 2·4: circle), `hr.main_hr`(본문 첫 줄 구분선 숨김), `img[src=""]`(JS 미실행으로 src가 빈 이미지 숨김). 틀:/파일: 링크는 `opennamu_not_exist_link` 클래스로 타깃하지 않음(DB에 없는 내부 링크 전체에 붙으므로 게임 링크까지 숨겨짐) — URL prefix(`a[href^="/w/%ED%8B%80%3A"]`, `a[href^="/upload"]`)로 대신 타깃
- **나무마크 소스 전처리** (`src/workers/namumark.worker.ts`, `src/workers/includeTemplates.ts`): namumark에 넘기기 전 두 단계 정규화 적용.
  1. **비표준 테이블 속성 정규화** (`namumark.worker.ts`): `<table bgcolor=...>` / `<table\nbordercolor=...>` 처럼 공백·줄바꿈이 끼어 있는 비표준 속성을 `<tablebgcolor=...>` 등 나무마크 표준 형태로 변환 (`/<table[\s\n]+([a-z])/gi`). 미처리 시 namumark가 해당 속성 문자열을 텍스트로 누출.
  2. **`{{{#!html}}}` · `[include(틀:...)]` PUA 토큰화** (`includeTemplates.ts`): `preprocessIncludes` 단일 루프에서 두 패턴을 선후 위치 비교로 처리. `{{{#!html content}}}` 블록은 namumark가 내용을 이스케이프해 텍스트로 출력하므로 파싱 전 PUA 토큰(U+E025/U+E026)으로 추출 → 복원 시 원본 HTML 그대로 삽입. `[include(틀:...)]`는 known 틀만 토큰화하고 unknown은 원문 유지 → 기존 CSS 숨김(`a[href^="/w/%ED%8B%80%3A"]`) 적용. 지원 틀: `틀:상세 내용`, `틀:상위 문서`, `틀:하위 문서`, `틀:관련 문서`, `틀:다른 뜻`/`틀:다른 뜻1`, `틀:네모틀`/`틀:네모틀b` (인라인 테두리 박스), `틀:글배경`/`틀:글배경b`/`틀:글배경r`/`틀:글배경br` (인라인 배경색), `틀:날짜 이동` (날짜 문서 네비게이션). 파라미터 체계: `틀:다른 뜻`은 `설명N`/`문서명N`, `틀:다른 뜻1`은 `otherN`/`rdN` (병행 지원). 색상·CSS 값 파라미터는 `sanitizeColor`/`sanitizeCSSValue`로 화이트리스트 검증 후 인라인 스타일 삽입. CSS 클래스: 블록 네비게이션 박스 `.namu-include`, 인라인 테두리 `.namu-box`, 인라인 배경색 `.namu-bg`, 날짜 이동 테이블 `.namu-date-nav`.
- **Worker 파싱 실패 시 `error` 플래그**: catch 블록에서 `{ id, html: '<p>렌더링 실패: ...</p>', error: true }`를 postMessage. `ArticleViewer`의 `worker.onmessage`에서 `e.data.error`가 true이면 `onRenderError?.()` 콜백 호출 → GamePage의 `handleRenderError`로 전달
- **HTML 주입 후 JS post-processing** (`useEffect([html])`): ① `hljs.highlightElement` — `pre code[class]` 구문 강조, ② ul 연속 문단 들여쓰기 — 블록 요소 또는 `<br><br>` 직전까지 인라인 노드를 수집해 `div`로 래핑 + 최하위 `li`의 `marginLeft`만큼 추가 패딩, ③ KaTeX 수식 렌더링 — namumark가 `[math(LaTeX)]`를 `<span id="*opennamu_math_N">JS_escaped_LaTeX</span>` 플레이스홀더로만 출력하고 실제 `katex.render()` 호출은 버려지는 JS에 담으므로, 파싱 후 DOM에서 `span[id*="opennamu_math_"]`를 찾아 직접 렌더링. `getToolJSSafe` 이스케이프 역변환: `\'` 처리 후 `JSON.parse`로 unescape, ④ footnote rescue — namumark가 footnote를 마지막 소제목 content div 안에 배치하므로 소제목 접기 시 주석이 함께 사라지는 버그 발생. `.opennamu_footnote`를 `article-content` 직계 자식으로 이동해 해결, ⑤ 접기 버튼 SVG 교체 — ⊖/⊕ 텍스트 → chevron SVG, `<sub>` 내 첫 자식 앞으로 DOM 이동, ⑥ TOC `.toc-content` wrapper 생성 — `opennamu_TOC_title` 이후 노드를 `div.toc-content`로 묶어 접기 토글 대상 단일화

## 훅 설계 결정

### useRedirect

- `.maybeSingle()` 사용 — `.single()`은 결과 없을 때 PostgREST 오류를 반환하지만, 리다이렉트 미등록이 정상 케이스이므로 null 반환으로 처리
- 오류·미발견 시 원본 title 그대로 반환 — 호출부가 별도 오류 처리 없이도 안전하게 동작

### useGame

- 타이머: `Date.now()` 스냅샷 방식 (`elapsedMs = Date.now() - startTime`) — 백그라운드 탭에서 `setInterval`이 throttle되어도 실제 경과 시간을 정확하게 추적. 누적 increment 방식이면 배경 탭에서 시간이 느리게 가는 문제 발생
- 100ms 인터벌로 UI 갱신 — 타이머 표시에 충분한 주기
- `startGame`/`recordVisit`/`undoLastVisit`/`stopGame`/`restoreGame` 모두 `useCallback(fn, [])` — 내부에서 ref와 setState만 사용하므로 외부 deps 없이 안정적
- `undoLastVisit()`: namumark 파싱 실패 시 호출 — path 마지막 항목 제거 + clickCount 감소. 실패 문서를 기록에서 소급 제거
- `restoreGame(path, clickCount, startTime)`: 새로고침 복원 시 호출 — 저장된 startTime을 `startTimeRef`에 주입해 `elapsedMs = Date.now() - startTime`이 연속 시간을 재개

### useMainPage

- KST 날짜: 클라이언트에서 `Date.now() + 9h` offset으로 ISO 문자열 생성. 서버 개입 없음
- 랜덤 문서 선택: `count: 'estimated'` HEAD 쿼리로 전체 행 수 추정 → `Math.random() * totalCount`로 randomId 생성 → `gte('id', randomId).limit(1)` 단건 fetch. 빈 결과(estimated가 실제 max ID 초과)이면 range × 0.9로 줄여 재시도 — range < 1이 되면 throw. `count: 'exact'`는 전체 스캔으로 대형 테이블에서 500 오류 발생 가능하여 제외
- daily_prompts 오류 → graceful degradation: null 처리로 "오늘의 문제 없음" 상태 표시. articles 오류만 error state 설정 (랜덤 모드 자체가 불가한 경우)

### useArticle

- 실패 시 error 상태 설정 + rethrow — 호출부(GamePage)가 catch로 토스트 표시, 동시에 error 상태로 초기 로드 실패 감지 가능
- `loadArticleOptimistic(rawTitle, resolveRedirectFn)` — redirect 조회와 R2 fetch를 `Promise.all`로 병렬 실행해 Supabase RTT를 체감 지연에서 제거. redirect 문서는 R2에 업로드되지 않으므로 rawTitle fetch가 404(Error)로 끝나면 resolved title로 재fetch. resolved title을 반환하므로 호출부(GamePage)가 목표 문서 도달 여부 판단에 사용

### useGameRecord

- `hasInsertedRef`로 마운트 시 단 1회 INSERT 보장 — `result`가 deps에 포함하되 ref로 중복 실행 차단
- INSERT에 `.select('id').single()` 추가 — 생성된 레코드 UUID를 `recordId`로 노출. ResultPage가 닉네임 UPDATE 시 사용
- `updateUserName(name)` — `game_records WHERE id = recordId` UPDATE. recordId null이면 에러 throw
- 저장 실패 시 `saveError` 반환 — saveError 발생 시 닉네임 입력 버튼 비활성화 (recordId 없으므로 UPDATE 불가)

### useLeaderboard

- 인자: `(tab: 'daily' | 'random', date: string, sortBy: 'elapsed_ms' | 'click_count')`
- 공통 조건: `user_name IS NOT NULL`, 상위 10개
- tab='daily': `WHERE challenge_type='daily' AND daily_date=$date`
- tab='random': `WHERE challenge_type='random'` (날짜 무관, 전체 랜덤 도전 통합 랭킹)
- 정렬: 선택한 `sortBy` ASC → 나머지 컬럼(elapsed_ms ↔ click_count) ASC 보조 정렬
- tab/date/sortBy가 바뀔 때마다 재쿼리 (useEffect deps)

### ResultPage

- `location.state`를 `useState(() => ...)` 초기값으로 캡처 — GamePage→ResultPage navigate 시 state 전달, 직접 접근 시 null → `useEffect`에서 `navigate('/', { replace: true })`
- `stopGame()`이 finalElapsed(number)를 반환 — navigate 시점에 setState가 아직 반영되지 않으므로 ref에서 직접 계산한 값을 전달받아 정확한 종료 시각 보장
- path는 GamePage의 `handleClick`에서 `[...path, resolved]`로 직접 조합 후 전달 — `recordVisit` setState가 비동기이므로 클로저의 path에 resolved를 직접 추가
- 닉네임 입력은 필수 — 비어 있거나 isSaved=false(INSERT 미완료)이면 제출 불가
- 닉네임 입력 초기값은 `localStorage.getItem('namurun_nickname')` — 직전 게임에서 제출한 닉네임을 자동 prefill (없으면 빈 문자열). 제출 성공 시 `localStorage.setItem('namurun_nickname', nickname.trim())`으로 갱신
- 제출 성공 시 `/leaderboard`로 navigate, state에 `{ tab, dailyDate, recordId }` 전달 — tab은 게임의 `challenge_type`('daily' | 'random'), dailyDate는 daily 챌린지일 때만 채워 리더보드가 해당 날짜로 진입하도록 함

### GamePage

- namumark 내부 링크 href 형식: `/w/<url-encoded-title>` — 이 형식으로 내부/외부 구분. 카테고리 링크(`/w/category:`)는 게임에서 차단
- `#anchor` 링크(목차 `#s-1.1`, 주석 `#fn-1` 등)는 `preventDefault` 없이 브라우저 기본 스크롤에 위임 — 게임 이동과 무관하므로 인터셉트하지 않음
- 콘텐츠 영역은 `overflow-y-auto` div로 독립 스크롤 (window 스크롤 아님) — 헤더·사이드바 고정을 위해 `h-screen + overflow-hidden` 레이아웃 사용
- 문서 이동 성공 시 `contentRef.scrollTop = 0`으로 스크롤 초기화 — 이전 문서의 스크롤 위치가 유지되지 않도록
- 중복 클릭 방지: `isNavigatingRef`(ref) 사용 — 상태 대신 ref를 쓰면 재렌더 없이 동기적으로 잠금/해제 가능. 잠금 해제는 `ArticleViewer`의 `onReady` 콜백에서 수행 — R2 fetch 완료(article 상태 변경) 시점이 아닌 namumark Worker 파싱 + HTML DOM 커밋 완료 시점까지 잠금 유지. fetch 실패(catch)에서는 `onReady`가 호출되지 않으므로 catch에서 직접 해제
- 이동 중 오버레이: `isRendering` state — 링크 클릭 시 `true`, `onReady`/catch에서 `false`. `isLoading`(R2 fetch 기준)이 아닌 `isRendering`(Worker 렌더링 기준)으로 overlay를 제어해 본문이 실제로 교체되기 전까지 뿌옇게 유지
- `location.state`를 `useState(() => ...)` 초기값으로 캡처 — 이후 리렌더에서도 gameStart/gameEnd가 안정적인 문자열로 유지됨
- **렌더링 실패 복구 흐름**: `ArticleViewer`의 `onRenderError` → `handleRenderError` → `undoLastVisit()`(실패 문서 path·clickCount 소급 제거) + `hasRenderError = true`. `ArticleFallbackLinks`(이전 문서 / 랜덤 문서) 표시. 복구 이동 시 `isNavigatingRef`/`isRendering`으로 기존 이동과 동일하게 잠금·오버레이 처리. `hasPrev` 조건: undo 후 `path.length >= 1`(시작 문서 실패 시 path = [] → 숨김)
- **타이머 지연 시작**: 초기 문서 로드 시 `startGame`을 `useEffect`에서 즉시 호출하지 않음. `loadArticle`만 호출하고, `onReady` 첫 번째 콜백 시점(Worker 파싱 + DOM 커밋 완료)에 `startGame` 실행. `hasStartedRef`(ref)로 stale closure 없이 "최초 호출" 여부 판별. `hasGameStarted`(state)로 로딩 표시와 아티클 영역 가시성 제어 — `article`이 세팅되면 즉시 `ArticleViewer`를 `hidden`으로 마운트해 Worker 파싱을 시작하되, `hasGameStarted`가 `true`가 되어야 표시. 두 번째 문서부터는 기존 `isNavigatingRef`/`isRendering` 흐름 유지
- **새로고침 세션 복원**: `sessionStorage['namurun_game_session']`에 `{ gameStart, gameEnd, path, clickCount, startTime, currentArticle }` 저장. 저장 시점: 최초 `onReady`(게임 시작) + 매 문서 이동 성공(`handleClick`에서 `recordVisit` 직후). 마운트 시 `location.state`가 null이면 sessionStorage에서 복원 시도 — 성공 시 `currentArticle` 로드 + `restoreGame` 호출로 타이머 재개. 세션 삭제: 목표 문서 도달(`navigate('/result')` 직전) + 포기 확인. sessionStorage 없으면 기존 "잘못된 접근" 표시
- **콘텐츠 영역 레이아웃**: `overflow-y-auto` div 내부를 `flex` row로 구성 — 좌: 아티클 래퍼(`flex-1 min-w-0 relative`), 우: 버튼 거터(`w-10 shrink-0 relative`). `hasToc` state: `handleArticleReady` 시점에 `contentRef.current?.querySelector('.opennamu_TOC')`로 TOC 유무를 감지해 `ArticleNavButtons`에 전달

---

## 컴포넌트 구조

구현 완료 항목과 예정 항목을 함께 표기.

```
src/
  pages/
    MainPage.tsx          ← 오늘의 문제, 랜덤 시작 ✅
    GamePage.tsx          ← 게임 화면 (링크 인터셉트, 이동 플로우) ✅
    ResultPage.tsx        ← 결과 화면 (소요 시간/클릭 수/경로 표시, 닉네임 입력 → /leaderboard) ✅
    LeaderboardPage.tsx   ← 리더보드 화면 (오늘의 문제·랜덤 도전 탭, 날짜 네비게이션, 정렬 기준 선택, 현재 행 하이라이트) ✅
    RenderDemoPage.tsx    ← 개발용 렌더링 테스트 (/render-demo, 배포 무관)
  components/
    ArticleViewer.tsx        ← namumark 렌더링 + 문서 제목 표시 ✅
    ArticleFallbackLinks.tsx ← 렌더링 실패 시 복구 링크 (이전 문서 / 랜덤 문서) ✅
    ArticleNavButtons.tsx    ← 문서 내 스크롤 버튼 (목차·맨 위·맨 아래) ✅
    GameHeader.tsx           ← 타이머(MM:SS.s), 클릭 수, 목표 문서명 ✅
    PathSidebar.tsx       ← 이동 경로 사이드바 (현재 문서 하이라이트) ✅
    NamurunLogo.tsx       ← 나무런 하이브리드 로고 SVG 컴포넌트 ✅
    HowToPlay.tsx         ← 로비 하단 게임 방법 안내 (3단계 카드 + 관련 영상 슬롯) ✅
    LobbyNav.tsx          ← 로비 좌측 고정 섹션 목차 (게임 시작·게임 방법·관련 영상, IntersectionObserver로 활성 섹션 감지, xl 이상만 표시) ✅
  hooks/
    useGame.ts            ← 게임 상태 (elapsedMs, clickCount, path) ✅
    useMainPage.ts        ← 메인 화면 데이터 (일일 문제 조회, 랜덤 문서 선택) ✅
    useArticle.ts         ← R2 fetch + 로딩/에러 상태 관리 ✅
    useRedirect.ts        ← Supabase redirects 조회 ✅
    useGameRecord.ts      ← game_records INSERT + recordId 반환 + updateUserName ✅
    useLeaderboard.ts     ← game_records 리더보드 쿼리 (탭·날짜·정렬 기준별 상위 10개) ✅
  lib/
    supabase.ts           ← Supabase 클라이언트 싱글톤 ✅
    r2.ts                 ← R2 fetch 유틸 ✅
    articles.ts           ← articles 테이블 유틸 (`fetchRandomArticleTitle`) ✅
  workers/
    namumark.worker.ts    ← NamuMark().parse() 전담 Web Worker ✅
    includeTemplates.ts   ← [include(틀:...)] pre/post-processing (known 틀 → HTML 박스) ✅
  shims/
    crypto.ts             ← namumark-clone-core가 요구하는 crypto mock ✅
  types/
    namumark-clone-core.d.ts  ← 외부 라이브러리 타입 선언 ✅
```
