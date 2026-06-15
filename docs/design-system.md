# 디자인 시스템 — 나무런

나무런의 디자인 스펙. **`src/index.css`의 `@theme` 토큰이 단일 소스 오브 트루스다.** 색·타이포그래피·스페이싱·레이아웃은 모두 이 토큰을 통해 참조한다.

이 문서는 `docs/architecture.md`(아키텍처)와 한 쌍으로, 아키텍처가 "무엇을 그리는가"라면 이 문서는 "어떻게 보이는가"를 규정한다.

> Google Stitch는 초기 디자인 참고용으로 사용했으며, 소스 오브 트루스가 아니다. 이후 디자인 결정은 이 문서와 코드를 기준으로 한다.

---

## 작업 규칙

### 1. 토큰이 스펙이다

- 색상·폰트·radius·스페이싱은 **반드시 `@theme` 토큰**으로 참조한다. 컴포넌트에 `#006a60`, `320px` 같은 값을 직접 쓰지 않는다.
- 새 값이 필요하면 **토큰을 먼저 `src/index.css`에 정의**한 뒤 사용한다.
- 인라인 `style`로 색상·그림자를 하드코딩하지 않는다 — 토큰 또는 커스텀 클래스를 쓴다.

### 2. 토큰 정의는 한 곳에

- 모든 디자인 토큰과 커스텀 클래스(`.circuit-bg`, `.glow-*`, 커스텀 스크롤바)는 **`src/index.css` 단일 정의**로 둔다.
- 이 프로젝트는 `tailwind.config.ts` 없이 Tailwind v4의 `@theme` 블록으로 토큰을 등록한다.

### 3. 임의값(arbitrary value) 사용 기준

- 일회성 레이아웃 조정(`pl-[344px]`, `h-[calc(100vh-80px)]`)은 허용한다.
- 같은 임의값이 2회 이상 반복되면 토큰으로 승격한다.

### 4. 반응형 기준

- **1280px가 기준 뷰포트다.** 반응형 breakpoint(`md:`, `lg:`)는 필요한 경우에만 최소한으로 추가한다.

### 5. 일관성 유지

- 디자인을 변경할 때는 이 문서와 `src/index.css`를 함께 업데이트한다.
- 변경이 여러 화면에 영향을 주는 경우(토큰 수정 등) 모든 페이지를 확인한다.

---

## 디자인 토큰

모든 토큰은 `src/index.css`의 `@theme` 블록에 등록한다. 아래 표가 현재 등록된 값의 기준이다.

### 색상 (`--color-*`)

라이트 모드 기반. Material Design 3 Tonal Palette 계열.

#### Surface / Background

| 토큰 | 값 | 용도 |
|------|-----|------|
| `background` / `surface` / `surface-bright` | `#f5fbf8` | 기본 배경 |
| `surface-dim` | `#d5dbd9` | 어두운 배경 변형 |
| `surface-container-lowest` | `#ffffff` | 가장 밝은 컨테이너 |
| `surface-container-low` | `#eff5f2` | 헤더 배경 |
| `surface-container` | `#e9efed` | 사이드바·카드 배경 |
| `surface-container-high` | `#e4e9e7` | 강조 컨테이너 |
| `surface-container-highest` | `#dee4e1` | active 항목·테이블 헤더 |
| `surface-variant` | `#dee4e1` | 구분선·배지 배경 |
| `inverse-surface` | `#2b3230` | 다크 반전 배경 (토스트 등) |
| `inverse-on-surface` | `#ecf2ef` | 다크 반전 위 텍스트 |

#### Text

| 토큰 | 값 | 용도 |
|------|-----|------|
| `on-surface` / `on-background` | `#171d1c` | 기본 텍스트 |
| `on-surface-variant` | `#3d4947` | 보조 텍스트 |

#### Primary (Teal)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `primary` | `#006a60` | 핵심 강조색 |
| `primary-container` | `#00a495` | 강조 버튼 배경 |
| `primary-fixed` | `#7cf7e5` | 고정 강조 |
| `primary-fixed-dim` | `#5ddac9` | 고정 강조 dim |
| `on-primary` | `#ffffff` | primary 위 텍스트 |
| `on-primary-container` | `#00312c` | primary-container 위 텍스트 |
| `inverse-primary` | `#5ddac9` | 다크 배경 위 primary |
| `surface-tint` | `#006a60` | 표면 tint |

#### Secondary / Tertiary / Error / Outline

| 토큰 | 값 | 용도 |
|------|-----|------|
| `secondary` | `#5f5e5e` | 보조 강조 |
| `secondary-container` | `#e2dfde` | 보조 컨테이너 |
| `on-secondary` | `#ffffff` | secondary 위 텍스트 |
| `tertiary` | `#984626` | 3위·동색 강조 |
| `tertiary-container` | `#d97854` | 순위 컨테이너 (1위 등) |
| `tertiary-fixed-dim` | `#ffb59b` | 금색 계열 (1위) |
| `on-tertiary` | `#ffffff` | tertiary 위 텍스트 |
| `on-tertiary-container` | `#531700` | tertiary-container 위 텍스트 |
| `error` | `#ba1a1a` | 오류·포기 버튼 |
| `error-container` | `#ffdad6` | 오류 컨테이너 |
| `on-error` | `#ffffff` | error 위 텍스트 |
| `on-error-container` | `#93000a` | error-container 위 텍스트 |
| `outline` | `#6c7a77` | 테두리 |
| `outline-variant` | `#bcc9c6` | 약한 구분선 |
| `link` | `#1558d6` | 위키 본문 하이퍼링크 |

### 타이포그래피

폰트: **Hanken Grotesk**(헤드라인), **Inter**(본문), **JetBrains Mono**(타이머/라벨). Google Fonts로 로드.

| 토큰 | 폰트 | 크기 | 굵기 | line-height | 용도 |
|------|------|------|------|-------------|------|
| `headline-lg` | Hanken Grotesk | 32px | 800 | 40px | 페이지 대제목 |
| `headline-md` | Hanken Grotesk | 24px | 700 | 32px | 섹션·미션 제목 |
| `body-sm` | Inter | 14px | 400 | 20px | 기본 본문 |
| `body-article` | Inter | 17px | 400 | 28px | 위키 본문 |
| `label-mono` | JetBrains Mono | 12px | 500 | 16px | 모노 라벨 (UPPERCASE) |
| `display-timer` | JetBrains Mono | 48px | 700 | 48px | 타이머 대형 표시 |

### 스페이싱

| 토큰 | 값 | 용도 |
|------|-----|------|
| `sidebar-width` | `320px` | 사이드바 너비 |
| `content-max-width` | `800px` | 본문 최대 너비 |
| `gutter` | `24px` | 기본 좌우 패딩 |
| `stack-lg` | `32px` | 섹션 간 세로 간격 |
| `stack-md` | `16px` | 요소 간 세로 간격 |
| `stack-sm` | `8px` | 밀접 요소 간격 |
| `unit` | `4px` | 기본 단위 |

### Border Radius (각진 미감)

| 토큰 | 값 |
|------|-----|
| `DEFAULT` | `0.125rem` (2px) |
| `lg` | `0.25rem` (4px) |
| `xl` | `0.5rem` (8px) |
| `full` | `0.75rem` (12px) |

### 커스텀 클래스

`src/index.css`에 정의.

| 클래스 | 용도 |
|--------|------|
| `.circuit-bg` | 배경의 회로 패턴 (teal 도트, 24px 간격) |
| `.glow-green` | primary 글로우 box-shadow (버튼) |
| `.glow-text` | 텍스트 글로우 (히어로 제목) |
| `.glow-timer` | 타이머 텍스트 글로우 |
| `.article-doc-title` | 위키 문서 제목 — `headline-lg` 스타일, `outline-variant` 하단 구분선 |

### `.article-viewer` 내부 스타일

namumark-clone-core가 생성하는 클래스를 `src/index.css`에서 직접 타깃해 스타일링한다.

| 선택자 | 용도 |
|--------|------|
| `h1` ~ `h6` | 소제목 크기 계층 (h1: 2em / h2: 1.75em / h3: 1.5em / h4: 1.25em / h5: 1.1em / h6: 1em) |
| `.opennamu_TOC` | 목차 컨테이너 — `surface-container-low` 배경, `outline-variant` 테두리 |
| `.opennamu_TOC_title` | 목차 "목차" 헤딩 |
| `.opennamu_footnote` | 주석 섹션 — `outline-variant` 상단 구분선, `on-surface-variant` 텍스트 |
| `a[href^="/w/%ED%8B%80%3A"]`, `a[href^="/upload"]` | 틀: 링크는 `/w/%ED%8B%80%3A` prefix로 숨김. 파일: 링크는 namumark가 `/upload?name=...`으로 렌더링하므로 `/upload` prefix로 타깃 |
| `img[src=""]` | JS 미실행으로 src가 채워지지 않은 이미지 — `display: none` |

---

## 화면별 레이아웃 구조

1280px 기준. 각 화면 제목 옆 `( )`는 구현 파일이다.

### 메인 로비 (`src/pages/MainPage.tsx`)

- `<body class="circuit-bg">`, `h-16` fixed 헤더, `w-sidebar-width` fixed 사이드바 (lg 이상)
- `<main>`: 오늘의 문제 카드 + 랜덤 도전 버튼
- 헤더: 로고 + 서비스명, 네비게이션 링크

### 게임 플레이 (`src/pages/GamePage.tsx`, `src/components/GameHeader.tsx`, `src/components/PathSidebar.tsx`)

- `h-20` HUD 헤더: 로고 + 목표 문서 | 타이머(`font-display-timer glow-timer`) + 클릭 수 | 포기하기 버튼
- `w-36` fixed 사이드바 (경로 추적 전용 — 넓은 네비게이션 사이드바와 다름): 번호 매긴 경로, active `border-l-2 border-primary bg-surface-container-highest`
- `<section class="ml-sidebar-width">` → `max-w-content-max-width` 위키 본문

### 결과 화면 (`src/pages/ResultPage.tsx`)

- `max-w-content-max-width mx-auto` 중앙 정렬
- 도착 메시지, 소요 시간(`font-display-timer`) + 클릭 수 스탯
- 이동 경로 목록, 닉네임 입력 + 제출

### 전체 순위 (`src/pages/LeaderboardPage.tsx`)

- `max-w-content-max-width mx-auto` 중앙 정렬
- 테이블: 헤더 `bg-surface-container-highest`, `font-label-mono uppercase`
- 순위 색: 1위 `text-tertiary-fixed-dim`(금) / 2위 `text-secondary-fixed-dim`(은) / 3위 `text-tertiary`(동)
- 나의 순위 행: `bg-primary/10 border border-primary` 하이라이트
