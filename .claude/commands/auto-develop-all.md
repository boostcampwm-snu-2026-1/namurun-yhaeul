# auto-develop-all

Runs `/auto-develop` sequentially for every open issue, with no human intervention.
Issues are processed in ascending number order. PRs accumulate on GitHub for later human review.

## Usage

```
/auto-develop-all           # process all open issues
/auto-develop-all <label>   # process open issues with a specific label only
```

---

## Preconditions

| Condition | Failure message |
|-----------|-----------------|
| Current branch is `dev` | "dev 브랜치에서 실행해주세요. 현재: <branch>" |
| Working tree is clean | "커밋되지 않은 변경사항이 있습니다. 먼저 정리하세요." |

---

## Step 1 — Fetch issue list and build dependency graph

### 1a — Fetch issues

Run one of the following depending on whether a label argument was provided:

```bash
# No label argument
gh issue list --state open --json number,title,body --limit 200

# With label argument
gh issue list --state open --label "<label>" --json number,title,body --limit 200
```

If the list is empty, output:
```
처리할 이슈가 없습니다.
```
and stop.

### 1b — Parse dependencies

For each issue, scan its `body` for the `**의존 이슈:**` field.
Extract dependency numbers. Build a directed graph: `N → [deps of N]`.

Only include dependencies that are **in the current issue list**. Dependencies that are already merged (not in the open issue list) are treated as satisfied and ignored.

### 1c — Detect cycles

Check for circular dependencies (e.g., #1 depends on #2, #2 depends on #1).

If any cycle is found, stop and report:
```
⚠️  의존관계 순환이 감지되었습니다:
  #A → #B → #A

이슈를 수정하여 순환을 제거한 뒤 다시 실행해주세요.
```

### 1d — Topological sort

Sort all issues using topological order (Kahn's algorithm or DFS post-order):
- Issues with no dependencies come first
- Each issue comes after all its dependencies

Within the same "level" (no ordering constraint between them), sort by issue number ascending.

### 1e — Print execution plan

```
처리할 이슈 N개 (의존관계 반영 순서):
  1. #3 "제목" (의존 없음)
  2. #1 "제목" (의존 없음)
  3. #5 "제목" (depends on #3)
  4. #7 "제목" (depends on #3, #1)

순서대로 auto-develop을 실행합니다.
```

---

## Step 2 — Process each issue

For each issue number in the topologically sorted list, in order:

1. Print the current progress header:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [K/N] 이슈 #M "제목" 처리 시작
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

2. **Dependency gate**: check if any of this issue's dependencies were recorded as ✗ (halted) or ⏭ (skipped) in this run.
   - If yes, skip this issue automatically:
     ```
     → ⏭ #M 건너뜀 | 의존 이슈 #K가 완료되지 않음
     ```
   - If all dependencies completed (✓) or had no dependencies, proceed.

3. Read `.claude/commands/auto-develop.md` and execute all its steps for this issue number.
   - The `auto-develop` pipeline handles its own `dev` checkout and pull at the end (Phase 5).
   - Do NOT re-run the preconditions check from `auto-develop` (branch / clean tree) — the cleanup from the previous iteration already handled this.

4. Detect the outcome:
   - **Completed**: Phase 4 finished and a PR URL was printed → record as ✓
   - **Skipped** (file conflict): output contained `SKIP #<N>:` marker → record as ⏭
   - **Halted** (any other stop): pipeline stopped before Phase 4 → record as ✗

5. After each issue, print a one-line status:
   ```
   → ✓ #M 완료 | PR: <URL>
   → ⏭ #M 건너뜀 | 파일 충돌
   → ⏭ #M 건너뜀 | 의존 이슈 #K 미완료
   → ✗ #M 중단 | <간단한 이유>
   ```

6. Run `/compact` to compress conversation context before the next issue.

7. Continue to the next issue regardless of outcome.

---

## Step 3 — Final summary

After all issues are processed, output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ auto-develop-all 완료

전체: N개 | 완료: A개 | 건너뜀: B개 | 중단: C개

완료된 PR:
  #1 "제목" → <PR URL>
  #2 "제목" → <PR URL>
  ...

건너뜀 (파일 충돌 — PR 머지 후 재실행 필요):
  #N "제목" — PR #M "충돌 PR 제목"
  ...

중단 (수동 확인 필요):
  #N "제목" — <이유>
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Omit sections that have zero entries.

---

## Notes

- PRs are left open for human review — no auto-merge.
- Skipped issues can be re-run individually with `/auto-develop <N>` after the blocking PR is merged.
- Halted issues require manual diagnosis before re-running.
- The batch runner does not retry failed issues within the same run.
