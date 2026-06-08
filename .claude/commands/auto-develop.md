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

## Pipeline

Execute each phase in order. If a phase posts a stop comment to the issue and halts, stop the entire pipeline immediately — do not proceed to the next phase.

### Phase 1 — Plan
Read `.claude/commands/auto-plan.md` and execute all its steps with issue number `<N>`.

On completion: branch `feature/xxx` is created and work plan is posted to issue.

### Phase 2 — Implement
Read `.claude/commands/auto-implement.md` and execute all its steps with issue number `<N>`.

On completion: all commit units are implemented and committed.

### Phase 3 — Sync
Read `.claude/commands/auto-sync.md` and execute all its steps.

On completion: docs are in sync with the implementation.

### Phase 4 — PR
Read `.claude/commands/auto-pr.md` and execute all its steps with issue number `<N>`.

On completion: PR is open and targeting `dev`.

---

## Final output

```
✓ auto-develop 완료

이슈:   #N "이슈명"
브랜치: feature/xxx
PR:     <URL>

커밋 이력:
<git log --oneline dev..HEAD 출력>
```

---

## Resume behavior

If the pipeline was previously interrupted mid-way (e.g. auto-implement posted a stop comment and halted):

1. Resolve the issue (fix the code, clarify the spec, etc.)
2. Re-run `/auto-develop <N>`
3. Each phase self-detects its completion state and skips already-done work:
   - auto-plan: skips if work plan comment already exists on issue
   - auto-implement: skips already-committed units (cross-checks git log)
   - auto-sync: skips if no discrepancies found
   - auto-pr: skips if PR already exists for the branch
