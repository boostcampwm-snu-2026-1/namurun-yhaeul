# auto-sync

Compares implemented code against docs, applies any needed updates, and commits automatically. No human approval steps.

## Usage

`/auto-sync` (runs on current branch)

---

## Preconditions

| Condition | Failure message |
|-----------|-----------------|
| Current branch is `feature/*` | "feature 브랜치에서 실행해주세요. 현재: <branch>" |
| Branch has commits ahead of dev | "dev 대비 커밋이 없습니다. 구현 후 실행하세요." |

---

## Execution

### Step 1 — Read context (run in parallel)

- `git diff dev...HEAD --name-only` — files changed on this branch
- Read `CLAUDE.md` → get docs file list from `## 상세 문서`

### Step 2 — Read relevant docs

Read all docs files related to the changed code.

### Step 3 — Compare

Read every changed file on this branch. For each file, check the following two categories:

**A. Structural changes** — docs must always reflect these:
- New files or exports not listed in docs
- ✅ / 예정 status that needs updating in architecture.md
- Removed or renamed items still referenced in docs
- New dev commands, environment variables, or scripts added

**B. Non-obvious design decisions** — document anything a future implementer would need to know that isn't obvious from the function/variable names alone. Ask: "if someone reads only the docs and not this code, what would they get wrong?" Examples of what to capture:
- Algorithm or approach chosen when multiple valid options exist (e.g., "client-side Fisher-Yates shuffle of top-100, not DB RANDOM()" or "Date.now() snapshot approach for timer accuracy across background tabs")
- Data transformation logic that isn't self-evident (e.g., "KST date string computed as UTC+9 offset on client, no server involvement")
- Error handling strategy and fallback behavior (e.g., "daily_prompts query failure is treated as null — graceful degradation to random-only mode; articles failure sets error state")
- Performance trade-offs (e.g., "top-100 articles pre-fetched on mount so random start is instant on click")
- Constraints or invariants that future code must respect

For each decision found in B: check if it already appears anywhere in docs. Only flag it if it is genuinely absent — do not duplicate content already documented.

### Step 4 — Apply or skip

**If no discrepancies found:**
```
✓ auto-sync 완료 — 코드와 docs 사이에 불일치 없음.
→ /auto-pr <N> 으로 PR을 생성하세요.
```
Stop here.

**If discrepancies found:**
- Apply all doc fixes directly (do not ask for approval)
- Run:
  ```
  git add docs/ CLAUDE.md
  git commit -m "docs: <brief summary of what was synced>"
  ```
- Output:
  ```
  ✓ auto-sync 완료

  수정된 파일:
  - docs/xxx.md: (what changed)

  → /auto-pr <N> 으로 PR을 생성하세요.
  ```
