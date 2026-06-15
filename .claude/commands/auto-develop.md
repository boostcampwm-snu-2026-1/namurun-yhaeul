# auto-develop

Runs the full development cycle for a single issue — plan → implement → sync → PR — with no human approval steps.

Each phase delegates to its dedicated skill file. The issue number flows through all phases unchanged.

## Usage

`/auto-develop <issue-number>`

---

## Preconditions

| Condition | Failure message |
|-----------|-----------------|
| Issue number provided | "이슈 번호를 입력해주세요. 사용법: /auto-develop <번호>" |
| Current branch is `dev` | "dev 브랜치에서 실행해주세요. 현재: <branch>" |
| Working tree is clean | "커밋되지 않은 변경사항이 있습니다. 먼저 정리하세요." |

---

## Pre-flight (runs after preconditions pass, before pipeline starts)

### 1. Pull latest dev

Always run `git pull`. Stop and report the error if it fails.

### 2. Open PR check

Run `gh pr list --state open --json number,title,headRefName,body` to list open PRs.

If no open PRs exist, proceed to the pipeline immediately.

**Identify dependency PRs first:**
Parse the current issue body for `**의존 이슈:**` and collect all listed issue numbers as `DEP_ISSUES`.
From the open PR list, find PRs whose body contains `Closes #M` where `#M` ∈ `DEP_ISSUES`. Mark these as **dependency PRs** — they are intentionally expected to overlap and must be excluded from the conflict check.

**For all remaining (non-dependency) open PRs:**
Extract the file paths listed in the current issue's **탐색 시작점** field (present in all issue types).
For each non-dependency open PR, run `gh pr diff <number> --name-only` and compare against that file list.

**If any non-dependency PR touches overlapping files — skip this issue:**

Output the following marker (used by auto-develop-all to detect skipped issues) and halt:
```
SKIP #<N>: PR #M "제목"이 <겹치는 파일>을 수정합니다. 해당 PR 머지 후 재실행 필요.
```

Then run `git checkout dev` before exiting.

**If no conflict — warn and continue:**
```
ℹ️  열린 PR N개 중 의존 PR M개 제외, 파일 겹침 없음 — 파이프라인을 계속 진행합니다.
```

---

## Pipeline

Execute each phase in order. If a phase posts a stop comment to the issue and halts, stop the entire pipeline immediately — do not proceed to the next phase.

### Phase 1 — Plan
Read `.claude/commands/auto-plan.md` and execute all its steps with issue number `<N>`.

On completion: branch `feature/xxx` is created and work plan is posted to issue.

### Phase 2 — Implement
Read `.claude/commands/auto-implement.md` and execute all its steps with issue number `<N>`.

On completion: all commit units are implemented and committed.

### Phase 3 — Sync
Read `.claude/commands/auto-sync.md` and execute all its steps with issue number `<N>`.

On completion: docs are in sync with the implementation.

### Phase 4 — PR
Read `.claude/commands/auto-pr.md` and execute all its steps with issue number `<N>`.

On completion: PR is open and targeting `dev`.

### Phase 5 — Cleanup
**Always run, regardless of which phase stopped (Phase 1 through 4, success or halt):**
```
git checkout dev
git pull
```
This ensures the workspace is ready for the next issue in a batch run.
If `git checkout dev` fails (already on dev), treat as success and continue.

---

## Final output

After Phase 4 completes, output the following debrief in Korean. Write each section only if there is meaningful content — omit sections that are empty or trivial.

```
✓ auto-develop 완료

이슈:   #N "이슈명"
브랜치: feature/xxx
PR:     <URL>

커밋 이력:
<git log --oneline <BASE>..HEAD 출력  (BASE는 auto-plan이 결정한 base 브랜치)>

---

## 구현 요약
(신규/수정 파일 목록, 핵심 설계 결정 1–3줄)

## 테스트
(작성한 테스트 케이스 목록 + 결과. 테스트 환경 없으면 생략)

## 중간 이슈 & 해결
(구현 중 막혔거나 예상과 달랐던 점, 어떻게 해결했는지.
 순탄하게 진행됐으면 이 섹션 생략)

## 꼭 확인할 것
(보안·성능·breaking change·임시 처리 등 사람이 반드시 알아야 할 것.
 없으면 생략)

## 리뷰 포인트
(PR에서 집중해서 볼 파일/로직. 단순 chore면 생략)

## 다음 이슈 제안
(배치 실행(/auto-develop-all) 중이 아닐 때만 출력. 현재 열린 이슈 중 자연스러운 다음 작업 1개. gh issue list로 확인)
```

---

## Resume behavior

If the pipeline was previously interrupted mid-way (e.g. auto-implement posted a stop comment and halted):

1. Resolve the issue (fix the code, clarify the spec, etc.)
2. Re-run `/auto-develop <N>`
3. Each phase self-detects its completion state and skips already-done work:
   - auto-plan: if work plan comment already exists, skip posting — but **checkout the branch named in the comment** (`브랜치: feature/xxx` line) before proceeding to Phase 2
   - auto-implement: skips already-committed units (cross-checks git log)
   - auto-sync: skips if no discrepancies found
   - auto-pr: skips if PR already exists for the branch
