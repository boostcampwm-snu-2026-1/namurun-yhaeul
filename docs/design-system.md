# 디자인 시스템 — Wiki Speedrun System

나무런의 디자인 스펙. **Google Stitch 프로젝트 `나무위키 레이스`(ID `523199435923899364`)가 디자인 소스 오브 트루스다.** 코드의 색·타이포그래피·스페이싱·레이아웃은 Stitch HTML 출력물과 항상 일치해야 한다.

이 문서는 `docs/architecture.md`(아키텍처)와 한 쌍으로, 아키텍처가 "무엇을 그리는가"라면 이 문서는 "어떻게 보이는가"를 규정한다.

---

## 작업 규칙

### 1. Stitch가 스펙이다

- 코드의 디자인은 Stitch HTML과 **항상 일치**해야 한다.
- **디자인 변경은 반드시 Stitch에서 먼저** 수정한다 (MCP `edit_screens` 또는 Stitch UI). 그 뒤 화면을 다시 읽어와 코드에 반영한다.
- **코드에서 임의로 디자인을 바꾸지 않는다.** 이는 CLAUDE.md의 "구현이 docs 설계와 다르면 docs를 먼저 고친다" 절차와 동일한 원칙이다.
- 불일치 발견 시 **코드를 Stitch에 맞춘다.** Stitch 쪽이 틀렸다고 판단되면 Stitch부터 고친 뒤 코드에 반영한다.

### 2. 하드코딩 금지 — 토큰으로만 참조

- 색상·폰트·radius·반복 스페이싱은 **반드시 디자인 토큰**(`@theme` 기반 Tailwind 유틸리티)으로 참조한다. `#5ddac9`, `320px` 같은 값을 컴포넌트에 직접 작성하지 않는다.
- 새 값이 필요하면 **토큰을 먼저 `src/index.css`에 정의**한 뒤 사용한다.
- **토큰 이름은 Stitch 네이밍을 그대로** 따른다 (`font-display-timer`, `sidebar-width`, `gutter` 등). 이름이 같아야 양쪽 대조가 쉽다.
- 인라인 `style`로 색상·그림자를 하드코딩하지 않는다 — 토큰 또는 커스텀 클래스를 쓴다.

### 3. 토큰 정의는 한 곳에

- 모든 디자인 토큰과 커스텀 클래스(`.circuit-bg`, `.glow-*`, `.neon-glow`, 커스텀 스크롤바)는 **`src/index.css` 단일 정의**로 둔다. 컴포넌트에 흩뿌리지 않는다.
- 이 프로젝트는 `tailwind.config.ts` 없이 Tailwind v4의 `@theme` 블록으로 토큰을 등록한다.

### 4. 임의값(arbitrary value) 예외

- Stitch HTML 자체가 일회성 임의값을 쓰는 경우(`pl-[344px]`, `shadow-[0_0_12px_rgba(93,218,201,0.3)]`)는 **그대로 반영한다** — 그게 소스이기 때문이다.
- 단, **같은 임의값이 2회 이상 반복되면 토큰화**하여 `@theme`로 승격한다.

### 5. 레이아웃 구조도 스펙이다

- fixed 헤더/사이드바, `ml-sidebar-width`, `px-gutter`, `max-w-content-max-width` 등 **Stitch의 구조·스페이싱 클래스를 그대로** 쓴다. 시각만 비슷하게 맞추고 DOM 구조를 바꾸지 않는다.
- 시맨틱 태그(`header`/`nav`/`main`/`aside`)와 Stitch의 계층 구조를 유지한다.

### 6. 반응형 기준

- **1280px가 기준 뷰포트다.** 반응형은 Stitch가 제공하는 breakpoint(`md:`, `lg:`)만 반영하고 임의로 추가하지 않는다.

### 7. 검증 절차

- 화면 작업 후 해당 Stitch 스크린을 다시 받아 **클래스 단위로 대조**한다.
- 토큰 변경은 영향 범위가 전역이므로, 변경 시 5개 화면(메인/게임/결과/순위/로고)을 모두 확인한다.

---

## 디자인 토큰

모든 토큰은 `src/index.css`의 `@theme` 블록에 등록한다. 정확한 값은 Stitch HTML이 기준이며, 아래는 등록되어야 할 토큰의 목록이다.

### 색상 (`--color-*`)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `surface` / `background` | `#0f1513` | 기본 배경 (다크) |
| `surface-container-lowest` | `#090f0e` | 가장 어두운 컨테이너 |
| `surface-container-low` | `#171d1c` | 헤더 배경 |
| `surface-container` | `#1b2120` | 카드·사이드바 배경 |
| `surface-container-high` | `#252b2a` | 강조 컨테이너 |
| `surface-container-highest` | `#303635` | active 항목·테이블 헤더 |
| `on-surface` | `#dee4e1` | 기본 텍스트 |
| `on-surface-variant` | `#bcc9c6` | 보조 텍스트 |
| `outline` | `#869490` | 테두리 |
| `outline-variant` | `#3d4947` | 약한 구분선 |
| `primary` | `#5ddac9` | 핵심 강조 (네온 그린) |
| `primary-container` | `#00a495` | 강조 컨테이너 |
| `on-primary` | `#003731` | primary 위 텍스트 |
| `on-primary-container` | `#00312c` | primary-container 위 텍스트 |
| `secondary` | `#c8c6c5` | 은색(2위) |
| `tertiary` | `#ffb59b` | 타이머/금색 계열 강조 |
| `error` | `#ffb4ab` | 포기/위험 |

### 타이포그래피

폰트: **Hanken Grotesk**(헤드라인/본문), **JetBrains Mono**(타이머/라벨/코드). Google Fonts로 로드.

| 토큰 | 역할 |
|------|------|
| `font-display-timer` | 타이머 대형 표시 (JetBrains Mono) |
| `font-headline-lg` | 페이지 대제목 |
| `font-headline-md` | 섹션·미션 제목 |
| `font-label-mono` | 모노 라벨 (UPPERCASE, tracking) |
| `font-body-sm` | 기본 본문 |
| `font-body-article` | 위키 본문 |

> 각 토큰의 정확한 size·weight·tracking·line-height는 Stitch HTML 기준값을 `index.css`에 등록한다.

### 스페이싱

| 토큰 | 값 |
|------|-----|
| `sidebar-width` | `320px` |
| `content-max-width` | `800px` |
| `gutter` | `24px` |
| `stack-lg` | `32px` |
| `stack-md` | `16px` |
| `stack-sm` | `8px` |
| `unit` | `4px` |

### Border radius (각진 미감)

| 토큰 | 값 |
|------|-----|
| `DEFAULT` | `0.125rem` |
| `lg` | `0.25rem` |
| `xl` | `0.5rem` |
| `full` | `0.75rem` |

### 커스텀 클래스

`src/index.css`에 정의. Stitch와 동일한 CSS 값을 사용한다.

| 클래스 | 용도 |
|--------|------|
| `.circuit-bg` | 메인 배경의 회로 패턴 |
| `.glow-green` | primary 네온 글로우 (버튼) |
| `.glow-text` | 텍스트 글로우 (히어로 제목) |
| `.glow-timer` | 타이머 네온 글로우 |
| `.neon-glow` | 결과 화면 대제목 강한 글로우 |
| 커스텀 스크롤바 | 다크 테마 스크롤바 |

---

## 화면별 레이아웃 구조

Stitch HTML 기준 핵심 골격. 1280px 기준.

### 메인 로비

- `<body class="circuit-bg">`, `h-16` fixed 헤더(glow 그림자), `w-sidebar-width` fixed 사이드바
- `<main class="pt-24 lg:pl-[344px] px-gutter">`
- 히어로: 128px 로고 + `font-headline-lg glow-text` 대제목
- 벤토 그리드(`md:grid-cols-12`): 오늘의 문제 8칸 + 순위 4칸
- 하단 progress bar (`fixed bottom-0 h-1 bg-primary/20`)

### 게임 플레이

- `<body class="overflow-hidden">` — window 스크롤 없음
- `h-20` HUD 헤더: 로고 + 미션 상태(`font-label-mono` UPPERCASE + `font-headline-md`) | 타이머(`font-display-timer glow-timer`) + 클릭 | 히스토리/설정 + 포기하기(`border-2 border-error text-error`)
- `h-[calc(100vh-80px)]` fixed 사이드바: 번호 매긴 경로, active `border-l-4 border-primary bg-surface-container-highest translate-x-1`
- `<section class="ml-sidebar-width">` → `max-w-content-max-width` 위키 본문

### 결과 화면

- `h-16` fixed 헤더, `max-w-content-max-width mx-auto` 중앙 정렬 메인
- "미션 완료" 배지(`font-label-mono text-primary uppercase tracking-[0.2em]`)
- 64px italic `neon-glow` 대제목
- 3열 스탯 그리드(`grid-cols-3 gap-stack-md`), 타이머 `font-display-timer`
- 수평 경로 시각화 (dashed connector)

### 전체 순위

- `h-16` fixed 헤더, `h-[calc(100vh-64px)]` fixed 사이드바, `md:ml-sidebar-width` 메인
- 테이블: `thead`는 `bg-surface-container-highest`, `font-label-mono uppercase tracking-wider`
- 순위 색: 1위 `text-tertiary-container`(금) / 2위 `text-secondary`(은) / 3위 `text-[#CD7F32]`(동)
- "나의 순위" 행: `bg-primary/10 border-2 border-primary` 하이라이트

---

## Stitch 워크플로우

1. **읽기**: MCP `list_screens` → `get_screen`으로 대상 화면 HTML 확인
2. **수정**: 디자인 변경이 필요하면 MCP `edit_screens` 또는 Stitch UI에서 수정
3. **반영**: 수정된 화면을 다시 읽어 코드에 토큰·구조 반영
4. **대조**: 작업 후 클래스 단위로 Stitch와 코드를 비교

MCP 프로젝트 ID: `523199435923899364`
