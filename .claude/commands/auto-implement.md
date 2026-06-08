# auto-implement

Reads the work plan from the issue, implements all commit units sequentially, and commits each unit automatically. No human approval steps.

## Usage

`/auto-implement <issue-number>`

---

## Preconditions

Check each condition. On failure, print the reason and stop.

| Condition | Failure message |
|-----------|-----------------|
| Issue number provided | "이슈 번호를 입력해주세요. 사용법: /auto-implement <번호>" |
| Current branch is `feature/*` | "feature 브랜치에서 실행해주세요. 현재: <branch>" |
| Issue has a work plan comment (contains `### 커밋 단위`) | "작업 계획 코멘트가 없습니다. /auto-plan <N>을 먼저 실행하세요." |

---

## Execution

### Step 1 — Read context (run in parallel)

- `gh issue view <N> --comments` — issue body and work plan comment
- `git log --oneline dev..HEAD` — already completed commits on this branch
- Read all files listed in the issue's **탐색 시작점** field
- Read all relevant docs from `CLAUDE.md`'s `## 상세 문서` section

### Step 2 — Extract and resume

From the work plan's `### 커밋 단위` section, build the full unit list.  
Cross-reference with `git log` to identify already-completed units.  
Create a TodoWrite checklist of **remaining** units only.

Output:
```
구현 스펙 확인:
- (key spec points extracted from docs)

남은 커밋 단위: N개
[1/N] 단위명 ← 시작
...
```

### Step 3 — Implement each unit (loop)

For each remaining commit unit:

**3a. Implement**
- Write/modify the files specified in that unit
- Follow all CLAUDE.md rules:
  - If implementation requires a direction different from docs → update the docs file first, then continue
  - No `any` — use `unknown` + narrowing
  - Functional components only
  - `dangerouslySetInnerHTML` only in `ArticleViewer` with library output

**3b. Verify**

Check if `package.json` has a `test:run` script:

- **테스트 환경 있음 (`test:run` 스크립트 존재):**
  - 구현한 파일에 대응하는 테스트 파일이 없으면 작성한다 (`<filename>.test.ts`)
  - 최소 커버리지: 정상 케이스 1개 + 경계/오류 케이스 1개
  - `npm run lint` → `npm run test:run` 순서로 실행
  - 실패 시 수정 후 1회 재시도. 재시도 후에도 실패하면 stop comment 후 중단

- **테스트 환경 없음 (`test:run` 스크립트 없음):**
  - `npm run lint` + `npm run build` 실행
  - 실패 시 수정 후 1회 재시도. 재시도 후에도 실패하면 stop comment 후 중단
  - 커밋 메시지 body에 한 줄 추가: `테스트 환경 없음 — #23 해결 후 테스트 추가 필요`

**3c. Commit**
Derive commit type from the issue label (`feat`/`fix`/`refactor`/`chore`/`test`).  
Write the commit message in **Korean** following CLAUDE.md convention:

- **description**: 현재형, 소문자, 마침표 없이, 구체적으로 (❌ `타이머 추가` → ✅ `백그라운드 탭 복귀 시 타이머 재개 기능 추가`)
- **body**: 비자명한 이유가 있을 때만 한 줄, 이슈 번호·작업 참조 금지

```
git add <only files in this commit unit>
git commit -m "<type>: <한글 description>"
```

**3d. Mark done**
- Mark the corresponding TodoWrite item as completed
- Output: `✓ [N/total] 단위명 커밋 완료`

Repeat for the next unit.

### Step 4 — Output log

```
✓ auto-implement 완료

커밋: N개
```
`git log --oneline dev..HEAD` 출력

```
→ /auto-sync 로 docs 동기화를 진행하세요.
```

---

## Stop comment format

Post to the issue when halting due to lint/build failure or unclear spec:

```
🤖 **auto-implement 중단**

**사유:** <reason>
**단위:** [N/total] <unit name>
**오류:**
```
<error output>
```

수정 후 `/auto-implement <N>`을 다시 실행하세요. (완료된 커밋 단위는 건너뜁니다)
```
