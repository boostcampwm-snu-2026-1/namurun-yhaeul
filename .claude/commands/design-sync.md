# design-sync

Compares implemented design code against **Stitch** — the design source of truth — reports and fixes mismatches, and keeps `docs/design-system.md`'s token table in sync. Fixes are applied without approval, but the skill **stops loudly** when Stitch MCP is unavailable or when Stitch itself looks wrong.

This is a different axis from `auto-sync`: `auto-sync` compares `code ↔ docs`, `design-sync` compares `Stitch ↔ code ↔ design-system.md`.

## Usage

`/design-sync` — runs on the current feature branch, all screens
`/design-sync <screen>` — limit to one screen: `메인` / `게임` / `결과` / `순위`

---

## Preconditions

Check in order. On failure, print the message and stop.

| Condition | Failure message |
|-----------|-----------------|
| Current branch is `feature/*` | "feature 브랜치에서 실행해주세요. 현재: <branch>" |
| Design files changed vs dev (`src/index.css`, `src/pages/**`, `src/components/**`) | "디자인 관련 변경이 없습니다." |
| **Stitch MCP connected** | (see Step 1 — hard stop, never skip) |

---

## Execution

### Step 1 — Verify Stitch connection (first, unconditionally)

Call `mcp__stitch__list_screens` for project `523199435923899364`.

**On connection failure or empty response, stop immediately. Do not skip.** Passing without Stitch gives false confidence ("verified" when nothing was checked), which defeats the purpose of the sync.

Print this and stop the entire skill:
```
🛑 design-sync 중단 — Stitch MCP에 연결되어 있지 않습니다.

디자인 동기화는 소스 오브 트루스인 Stitch 없이는 검증할 수 없습니다.
다음으로 연결한 뒤 다시 실행하세요:
  npx -y @_davideast/stitch-mcp init -c claude-code
연결 확인: claude mcp list
```

### Step 2 — Read context (run in parallel)

- `git diff dev...HEAD --name-only` — design files changed on this branch
- Read `docs/design-system.md` — token tables and per-screen layout skeletons
- Read `src/index.css` — currently registered `@theme` tokens and custom classes
- Read all changed page/component files

### Step 3 — Pull Stitch source

Resolve the screen ↔ code mapping from `docs/design-system.md` — each screen heading under "화면별 레이아웃 구조" names its implementing file(s). Do not hardcode paths here; the doc is the single source kept in sync with the structure.

For each target screen (or the single screen passed as an argument), call `mcp__stitch__get_screen` to fetch the HTML.

### Step 4 — Compare (class / token level)

For each screen, compare the code against the Stitch HTML and classify every discrepancy:

- **A. Hardcoding** — hex colors or px values written directly in code where a token exists
- **B. Structure / class mismatch** — missing fixed header/sidebar, divergent layout/spacing classes, wrong tokens
- **C. Unregistered token** — code uses a token absent from `index.css @theme` or from `design-system.md`
- **D. Undocumented** — a token/class present in Stitch is missing from the `design-system.md` token table

### Step 5 — Apply or stop

| Situation | Action |
|-----------|--------|
| Code differs from Stitch (code is wrong) | Fix the code to match Stitch |
| Hardcoded value | Replace with a token reference (define the token in `index.css` first if missing) |
| New token/class introduced | Register it in `index.css` and update the `design-system.md` token table |
| **Stitch itself looks wrong** | **Do not fix — stop and report.** Never change design arbitrarily in code (CLAUDE.md rule). Report to the user using the format below |

When Stitch looks wrong, print this, skip that screen, and continue with the rest (mark it unresolved in the final report):
```
⚠️  Stitch <화면>의 <요소>가 스펙/코드와 어긋납니다: <설명>

코드에서 임의로 바꾸지 않습니다. Stitch에서 먼저 수정한 뒤
/design-sync 를 다시 실행하세요. (MCP edit_screens 또는 Stitch UI)
```

### Step 6 — Verify + commit

- Run `npm run lint` → `npm run test:run` (on failure, fix and retry once)
- Split commits by change type. Messages in Korean, following the CLAUDE.md convention:
  - Visual code alignment: `style: <화면> Stitch 디자인과 동기화`
  - Token / doc update: `docs: design-system 토큰표 <항목> 동기화`

### Step 7 — Output report

```
✓ design-sync 완료

대조한 화면: N개
불일치 발견: M건
  - [A 하드코딩] <파일>: <내용> → <조치>
  - [B 구조] <파일>: <내용> → <조치>
  ...
미해결 (Stitch 수정 필요): K건
  - <화면>: <설명>

커밋: <git log --oneline 최근 변경>
```

When no discrepancies are found:
```
✓ design-sync 완료 — Stitch와 코드 사이에 불일치 없음.
```

---

## auto-develop integration (optional)

For design issues, `design-sync` may run as Phase 3.5 in the `auto-develop` pipeline, right after Phase 3 (`auto-sync`). This reconciles both `code ↔ docs` (auto-sync) and `Stitch ↔ code` (design-sync) before the PR is created.
