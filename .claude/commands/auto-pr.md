# auto-pr

Pushes the current branch and creates a PR to dev. No human approval steps.

## Usage

`/auto-pr <issue-number>`

---

## Preconditions

| Condition | Failure message |
|-----------|-----------------|
| Issue number provided | "이슈 번호를 입력해주세요. 사용법: /auto-pr <번호>" |
| Current branch is `feature/*` | "feature 브랜치에서 실행해주세요. 현재: <branch>" |
| Branch has commits ahead of dev | "dev 대비 커밋이 없습니다." |

---

## Execution

### Step 1 — Read context (run in parallel)

- `git branch --show-current`
- `git log --oneline dev..HEAD`
- `gh issue view <N> --comments` — issue body and work plan comment
- `gh pr list --head <branch> --state open` — check if PR already exists

If a PR already exists for this branch, output its URL and stop:
```
이미 PR이 존재합니다: <URL>
```

### Step 2 — Docs sync check

Run `git log --oneline dev..HEAD`.  
If no `docs:` commit exists AND no files under `docs/` or `CLAUDE.md` were changed:  
→ Read `.claude/commands/auto-sync.md` and execute all its steps before continuing.

### Step 3 — Push

```
git push -u origin <branch>
```

### Step 4 — Build PR body

**Title:** issue title verbatim  
**Body:** Write all content in **Korean**.

```
## 구현 내용

(2–4줄 한글 요약 — 작업 계획의 구현 범위 기반)

## 완료 기준

(work plan의 완료 기준을 한글 체크리스트로)
- [ ] ...

Closes #N
```

### Step 5 — Create PR

```
gh pr create --base dev --title "<title>" --body "<body>"
```

### Step 6 — Output log

```
✓ auto-pr 완료

PR: <URL>
브랜치: feature/xxx → dev
Closes #N
```
