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

Check each of the following against the actual implementation:

- Design decisions made during implementation that are not yet reflected in docs
- Component/hook/util structure that differs from what docs describe
- New files or exports that docs don't mention
- Removed or renamed items still referenced in docs

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
