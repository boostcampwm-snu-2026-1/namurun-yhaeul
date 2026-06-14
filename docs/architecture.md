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
  ├─ 외부 링크: 클릭 차단
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
  ├─ 닉네임 입력 (필수) → game_records UPDATE (user_name)
  └─ 제출 완료 → navigate('/leaderboard', { state: { startArticle, endArticle, recordId } })

[리더보드 화면 /leaderboard]
  ├─ 동일 start_article + end_article 기준 상위 10개
  ├─ 정렬: click_count ASC → elapsed_ms ASC
  ├─ 컬럼: 순위, 닉네임, 클릭 수, 소요 시간, 시작 문서, 도착 문서
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
- **문서 제목은 namumark 파싱 결과 외부에서 렌더링** — `ArticleViewer`가 `article.title`을 별도 `<h1>` 요소로 표시. XSS 방지: dangerouslySetInnerHTML에 제목을 넣지 않는다
- **namumark 생성 CSS 클래스명** (js 미사용으로 CSS에서 직접 타깃): `opennamu_TOC`(목차 컨테이너), `opennamu_TOC_title`(목차 헤딩), `opennamu_footnote`(주석 섹션), `opennamu_not_exist_link`(include 틀 자리표시 — DB에 없는 문서), `img[src=""]`(JS 미실행으로 src가 빈 이미지 → 숨김)

## 훅 설계 결정

### useRedirect

- `.maybeSingle()` 사용 — `.single()`은 결과 없을 때 PostgREST 오류를 반환하지만, 리다이렉트 미등록이 정상 케이스이므로 null 반환으로 처리
- 오류·미발견 시 원본 title 그대로 반환 — 호출부가 별도 오류 처리 없이도 안전하게 동작

### useGame

- 타이머: `Date.now()` 스냅샷 방식 (`elapsedMs = Date.now() - startTime`) — 백그라운드 탭에서 `setInterval`이 throttle되어도 실제 경과 시간을 정확하게 추적. 누적 increment 방식이면 배경 탭에서 시간이 느리게 가는 문제 발생
- 100ms 인터벌로 UI 갱신 — 타이머 표시에 충분한 주기
- `startGame`/`recordVisit`/`stopGame` 모두 `useCallback(fn, [])` — 내부에서 ref와 setState만 사용하므로 외부 deps 없이 안정적

### useMainPage

- KST 날짜: 클라이언트에서 `Date.now() + 9h` offset으로 ISO 문자열 생성. 서버 개입 없음
- 랜덤 문서 선택: DB `ORDER BY RANDOM()` 대신 `byte_size DESC LIMIT 100` fetch 후 클라이언트 Fisher-Yates shuffle — `ORDER BY RANDOM()`은 인덱스를 타지 않아 571K 건 테이블에서 느림
- top-100 마운트 시 미리 fetch — 랜덤 시작 버튼 클릭 즉시 이동 가능 (클릭 시점 fetch면 딜레이 발생)
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

- `game_records WHERE start_article=X AND end_article=Y AND user_name IS NOT NULL ORDER BY click_count ASC, elapsed_ms ASC LIMIT 10`
- startArticle/endArticle이 바뀔 때마다 재쿼리 (useEffect deps)

### ResultPage

- `location.state`를 `useState(() => ...)` 초기값으로 캡처 — GamePage→ResultPage navigate 시 state 전달, 직접 접근 시 null → `useEffect`에서 `navigate('/', { replace: true })`
- `stopGame()`이 finalElapsed(number)를 반환 — navigate 시점에 setState가 아직 반영되지 않으므로 ref에서 직접 계산한 값을 전달받아 정확한 종료 시각 보장
- path는 GamePage의 `handleClick`에서 `[...path, resolved]`로 직접 조합 후 전달 — `recordVisit` setState가 비동기이므로 클로저의 path에 resolved를 직접 추가
- 닉네임 입력은 필수 — 비어 있거나 isSaved=false(INSERT 미완료)이면 제출 불가
- 제출 성공 시 `/leaderboard`로 navigate, state에 `{ startArticle, endArticle, recordId }` 전달

### GamePage

- namumark 내부 링크 href 형식: `/w/<url-encoded-title>` — 이 형식으로 내부/외부 구분. 카테고리 링크(`/w/category:`)는 게임에서 차단
- `#anchor` 링크(목차 `#s-1.1`, 주석 `#fn-1` 등)는 `preventDefault` 없이 브라우저 기본 스크롤에 위임 — 게임 이동과 무관하므로 인터셉트하지 않음
- 콘텐츠 영역은 `overflow-y-auto` div로 독립 스크롤 (window 스크롤 아님) — 헤더·사이드바 고정을 위해 `h-screen + overflow-hidden` 레이아웃 사용
- 문서 이동 성공 시 `contentRef.scrollTop = 0`으로 스크롤 초기화 — 이전 문서의 스크롤 위치가 유지되지 않도록
- 중복 클릭 방지: `isNavigatingRef`(ref) 사용 — 상태 대신 ref를 쓰면 재렌더 없이 동기적으로 잠금/해제 가능
- `location.state`를 `useState(() => ...)` 초기값으로 캡처 — 이후 리렌더에서도 gameStart/gameEnd가 안정적인 문자열로 유지됨

---

## 컴포넌트 구조

구현 완료 항목과 예정 항목을 함께 표기.

```
src/
  pages/
    MainPage.tsx          ← 오늘의 문제, 랜덤 시작 ✅
    GamePage.tsx          ← 게임 화면 (링크 인터셉트, 이동 플로우) ✅
    ResultPage.tsx        ← 결과 화면 (소요 시간/클릭 수/경로 표시, 닉네임 입력 → /leaderboard) ✅
    LeaderboardPage.tsx   ← 리더보드 화면 (동일 문제 기준 상위 10개, 현재 행 하이라이트) ✅
    RenderDemoPage.tsx    ← 개발용 렌더링 테스트 (/render-demo, 배포 무관)
  components/
    ArticleViewer.tsx     ← namumark 렌더링 + 문서 제목 표시 ✅
    GameHeader.tsx        ← 타이머(MM:SS.s), 클릭 수, 목표 문서명 ✅
    PathSidebar.tsx       ← 이동 경로 사이드바 (현재 문서 하이라이트) ✅
    NamurunLogo.tsx       ← 나무런 하이브리드 로고 SVG 컴포넌트 ✅
  hooks/
    useGame.ts            ← 게임 상태 (elapsedMs, clickCount, path) ✅
    useMainPage.ts        ← 메인 화면 데이터 (일일 문제 조회, 랜덤 문서 선택) ✅
    useArticle.ts         ← R2 fetch + 로딩/에러 상태 관리 ✅
    useRedirect.ts        ← Supabase redirects 조회 ✅
    useGameRecord.ts      ← game_records INSERT + recordId 반환 + updateUserName ✅
    useLeaderboard.ts     ← game_records 리더보드 쿼리 (상위 10개) ✅
  lib/
    supabase.ts           ← Supabase 클라이언트 싱글톤 ✅
    r2.ts                 ← R2 fetch 유틸 ✅
  workers/
    namumark.worker.ts    ← NamuMark().parse() 전담 Web Worker ✅
  shims/
    crypto.ts             ← namumark-clone-core가 요구하는 crypto mock ✅
  types/
    namumark-clone-core.d.ts  ← 외부 라이브러리 타입 선언 ✅
```
