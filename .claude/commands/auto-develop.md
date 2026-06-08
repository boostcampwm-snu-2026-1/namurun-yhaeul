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

After Phase 4 completes, output the following debrief in Korean. Write each section only if there is meaningful content — omit sections that are empty or trivial.

```
✓ auto-develop 완료

이슈:   #N "이슈명"
브랜치: feature/xxx
PR:     <URL>

커밋 이력:
<git log --oneline dev..HEAD 출력>

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
(현재 열린 이슈 중 자연스러운 다음 작업 1개. gh issue list로 확인)
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
