# auto-plan

Reads a GitHub issue, validates it, generates a work plan, posts it as an issue comment, and creates the feature branch. No human approval steps.

## Usage

`/auto-plan <issue-number>`

---

## Preconditions

Check each condition before proceeding. On failure, print the reason and stop — do NOT post an issue comment for precondition failures.

| Condition | Failure message |
|-----------|-----------------|
| Issue number provided | "이슈 번호를 입력해주세요. 사용법: /auto-plan <번호>" |
| Current branch is `dev` | "dev 브랜치에서 실행해주세요. 현재: <branch>" |
| Working tree is clean (`git status --short` is empty) | "커밋되지 않은 변경사항이 있습니다. 먼저 커밋하세요." |

---

## Execution

### Step 1 — Read context (run in parallel)

- `gh issue view <N> --comments` — full issue body and all comments
- `git log --oneline -5` — recent commit style for branch naming reference
- Read `CLAUDE.md` → identify docs files listed under `## 상세 문서`

### Step 1.5 — Resolve dependency base branch

Parse the issue body for the `**의존 이슈:**` field.

**If not present:** base branch = `dev`. Skip to Step 2.

**If present** (e.g., `**의존 이슈:** #M` or `**의존 이슈:** #M, #K`):

For each listed dependency number, run:
```
gh pr list --state open --json number,headRefName,body --limit 100
```
Search the result for a PR whose body contains `Closes #M`.

- **PR found (still open):** base branch for that dependency = `headRefName` of that PR
- **PR not found (already merged or not yet created):** base branch = `dev`

If multiple dependencies all point to different open branches, use the branch of the **last** dependency in the list (deepest in the chain). If they are independent, stop and report:
```
⚠️  #N의 의존 이슈 #M, #K가 서로 독립적인 열린 PR을 가집니다.
의존 이슈를 하나로 좁히거나, 해당 PR들을 머지한 뒤 재실행해주세요.
```

Store the resolved base branch as `<BASE>` for use in Step 5.

### Step 2 — Read relevant files (run in parallel)

- All docs files relevant to the issue scope (from Step 1)
- All files listed in the issue's **탐색 시작점** field

### Step 3 — Validate issue

Check each condition in order. On first failure, post the stop comment (see format below) to the issue and stop.

| Condition | Comment reason |
|-----------|---------------|
| **완료 기준** field exists with ≥1 checkbox item | "완료 기준이 없거나 체크리스트가 비어 있습니다. 완료 기준을 추가해주세요." |
| **탐색 시작점** field exists and is not empty | "탐색 시작점이 비어 있습니다. 참조 파일/컴포넌트를 작성해주세요." |
| Issue scope fits in one PR (estimated ≤3 commit units) | "이슈 범위가 너무 큽니다. 아래와 같이 분리를 고려해주세요:\n<suggested splits>" |
| No contradictions or ambiguities that block implementation | "요구사항에 불명확한 부분이 있어 구현을 시작할 수 없습니다:\n<question list>" |

### Step 4 — Generate work plan

Derive a branch name from the issue title using kebab-case. Use the prefix that matches the issue type:

| 이슈 타입 | 브랜치 prefix |
|-----------|--------------|
| `feat`    | `feature/`   |
| `fix`     | `fix/`       |
| `refactor`| `refactor/`  |
| `chore`   | `chore/`     |
| `docs`    | `docs/`      |
| `test`    | `test/`      |
Generate the plan in this exact format:

```
## 작업 계획 — #N "이슈명"

브랜치: feature/xxx (base: <BASE>)

### 구현 범위
- 신규: (new files)
- 수정: (files to modify)
- 주요 구현 포인트: (key logic to implement)

### 커밋 단위
단일: (모든 작업)

또는

[1/N] 단위 이름
- 포함 파일/작업

[2/N] 단위 이름
- 포함 파일/작업

### Docs 업데이트
(omit this section entirely if no docs changes are needed)
- <file>: <what changes and why>

### 완료 기준
(copy from issue, reformatted as checkboxes if needed)
- [ ] ...
```

### Step 5 — Post and branch

**If a work plan comment already exists on the issue (resume case):**
- Skip posting a new comment
- Extract the branch name from the existing comment's `브랜치: feature/xxx` line
- Run `git checkout feature/xxx` to restore branch state
- Stop here — do not re-create the branch or re-commit docs

**Otherwise (normal case), run sequentially:**

1. `gh issue comment <N> --body "<work plan>"` — post work plan to issue
2. Branch creation — depends on `<BASE>` resolved in Step 1.5:
   - If `<BASE>` is `dev`: `git checkout -b feature/xxx` (already on dev)
   - If `<BASE>` is `feature/yyy`:
     ```
     git fetch origin feature/yyy
     git checkout feature/yyy
     git checkout -b feature/xxx
     ```
     (`git fetch` first in case the branch only exists on remote)

If the plan includes a **Docs 업데이트** section, apply and commit docs changes immediately:
```
# Read and edit the relevant docs files, then:
git add docs/ CLAUDE.md
git commit -m "docs: ..."
```

### Step 6 — Output log

```
✓ auto-plan 완료

이슈:   #N "이슈명"
브랜치: feature/xxx
커밋 단위: N개
작업 계획: <gh issue comment URL>

→ /auto-implement <N> 으로 구현을 시작하세요.
```

---

## Stop comment format

When stopping due to a Step 3 validation failure, post this comment to the issue:

```
🤖 **auto-plan 중단**

**사유:** <reason from validation table>

수정 후 `/auto-plan <N>`을 다시 실행해주세요.
```
