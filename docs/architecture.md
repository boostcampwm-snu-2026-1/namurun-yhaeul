# 아키텍처

## 데이터 흐름

```
사용자 링크 클릭
  → Supabase redirects 테이블 확인 (NASDAQ → 나스닥 등 리다이렉트 처리)
  → 프론트엔드가 R2에서 "articles/{title}.json" fetch (CDN 캐시)
  → namumark-clone-core로 HTML 렌더링
  → Supabase articles.links[] 배열로 유효 내부 링크인지 검증
    (links[]는 모든 일반 문서 기준 — 토막글 포함. 시작/도착 후보는 byte_size + 링크 수로 쿼리 시 필터)
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
  ├─ 문서 영역: R2 fetch → namumark-clone-core 렌더링
  ├─ 링크 클릭 → redirects 확인 → articles.links[] 검증 → 이동
  ├─ 외부 링크: 비활성화 처리
  ├─ R2 fetch 실패 시: "문서를 불러올 수 없습니다" 안내 + 건너뛰기 버튼
  │    ArticleNetworkError  — 연결 실패 (오프라인, CORS 등)
  │    ArticleNotFoundError — 404, R2에 파일 없음
  │    ArticleFetchError    — 기타 HTTP 오류
  │    ArticleParseError    — 200 응답이지만 JSON 파싱 실패
  └─ 막힌 경우: "문서 건너뛰기" 버튼

      ↓ (목표 문서 도달)

[결과 화면]
  ├─ 소요 시간, 총 클릭 수, 거쳐온 경로
  ├─ 닉네임 입력 → game_records INSERT
  └─ 다시 하기 / 오늘의 문제 도전

[리더보드]
  └─ 동일 start_article + end_article 기준 최소 클릭 수 → 동점 시 시간 순
```

## BFS 경로 검증 생략 이유

게임 시작 전 "경로가 존재하는가"를 BFS로 검증하지 않는다.

- 나무위키 특성상 바이트가 큰 인기 문서끼리는 6단계 내 연결 가능 (Six Degrees 효과)
- BFS 사전 검증 시 비용이 크고 게임 시작이 느려짐
- 대신 막히는 경우 **"문서 건너뛰기" 버튼**으로 UX에서 대응

---

## 나무마크 렌더링 방침

- 라이브러리: `namumark-clone-core` (TypeScript, npm)
- 완벽한 렌더링 불필요 — 게임 목적이므로 **링크 동작**이 핵심
- 표, 이미지, 복잡한 매크로 깨짐 허용
- `[[문서명]]` / `[[실제명|표시텍스트]]` 링크 렌더링이 최우선

## 컴포넌트 구조

구현 완료 항목과 예정 항목을 함께 표기.

```
src/
  pages/
    MainPage.tsx          ← (예정) 오늘의 문제, 랜덤 시작
    GamePage.tsx          ← (예정) 게임 화면
    ResultPage.tsx        ← (예정) 결과 화면
    RenderDemoPage.tsx    ← 개발용 렌더링 테스트 (/render-demo, 배포 무관)
  components/
    ArticleViewer.tsx     ← namumark 렌더링 ✅
    GameHeader.tsx        ← (예정) 타이머, 클릭 수, 목표 문서
    Leaderboard.tsx       ← (예정)
  hooks/
    useGame.ts            ← 게임 상태 (elapsedMs, clickCount, path) ✅
    useArticle.ts         ← (예정) R2 fetch + namumark 렌더링
    useRedirect.ts        ← Supabase redirects 조회 ✅
  lib/
    supabase.ts           ← Supabase 클라이언트 싱글톤 ✅
    r2.ts                 ← R2 fetch 유틸 ✅
  shims/
    crypto.ts             ← namumark-clone-core가 요구하는 crypto mock ✅
  types/
    namumark-clone-core.d.ts  ← 외부 라이브러리 타입 선언 ✅
```
