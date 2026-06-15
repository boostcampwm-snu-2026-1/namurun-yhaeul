# create-issue

Drafts a GitHub issue from a brief description, asks targeted clarifying questions, and creates it on approval.

## Usage

`/create-issue <free-form description of what you want>`

---

## Execution

### Step 1 — Determine type

Pick the issue type from the description:

| Type | When |
|------|------|
| `feat` | New feature, new component/hook |
| `fix` | Bug, incorrect behavior |
| `refactor` | Structural improvement, no behavior change |
| `chore` | Build, config, environment, packages |
| `test` | Adding or updating tests |

If ambiguous, pick the most likely type and note it in the draft.

### Step 2 — Research before drafting

Gather context from the codebase to fill in fields accurately — especially 탐색 시작점:

- Read `docs/architecture.md` if the issue touches components or data flow
- Glob/Grep for files relevant to the description
- Identify actual file paths the implementer would need to read or modify

Do **not** ask the user for information you can look up in the code.

### Step 3 — Write draft

Fill in all template fields based on the description and Step 2 research.  
For fields where intent is unclear, write your best guess and mark it `[?]`.

Use the **exact** markdown template for the chosen type below. Field names must match exactly — the automation pipeline parses them by bold-text key (`**필드명:**`).

---

**feat**
```markdown
**배경:** (왜 이 기능이 필요한가)

**구현 범위:**
- 신규: (새로 만들 파일)
- 수정: (변경할 파일)

**완료 기준:**
- [ ] (검증 가능한 완료 조건)

**탐색 시작점:**
- src/path/to/file.tsx
```

---

**fix**
```markdown
**증상:** (무엇이 잘못 동작하는가)

**재현 조건:**
1. (재현 단계)

**관련 코드:** (버그가 있는 위치 간단 설명)

**완료 기준:**
- [ ] (검증 가능한 완료 조건)

**탐색 시작점:**
- src/path/to/file.tsx
```

---

**refactor**
```markdown
**현재 상태:** (현재 코드의 문제)

**목표 상태:** (리팩터링 후 기대하는 구조)

**변경 범위:**
- 수정: (변경할 파일)

**완료 기준:**
- [ ] (검증 가능한 완료 조건)

**탐색 시작점:**
- src/path/to/file.tsx
```

---

**chore**
```markdown
**배경:** (왜 이 작업이 필요한가)

**변경 범위:**
- (변경될 내용)

**완료 기준:**
- [ ] (검증 가능한 완료 조건)

**탐색 시작점:**
- package.json
- src/path/to/config.ts
```

---

**test**
```markdown
**테스트 대상:** (무엇을 테스트하는가)

**테스트 케이스:**
- (케이스 1)
- (케이스 2)

**변경 범위:**
- 신규: (새로 만들 테스트 파일)

**완료 기준:**
- [ ] (검증 가능한 완료 조건)

**탐색 시작점:**
- src/path/to/target.tsx
```

---

**공통 규칙:**

`**의존 이슈:**` — 이 이슈 구현에 다른 이슈의 코드가 선행되어야 할 때만 맨 아래에 추가:
```
**의존 이슈:** #N
```
단순 관련이 아닌, 코드 의존이 있을 때만. 없으면 이 줄 자체를 생략.

`**완료 기준:**` — `- [ ] ...` 체크리스트만 허용. "잘", "충분히", "적절히" 같은 검증 불가 표현 금지.

`**탐색 시작점:**` — `src/...` 형식의 실제 파일 경로만 허용. 컴포넌트명·모듈명 단독 사용 금지.

### Step 4 — Ask focused questions

This step is the most important. The issue will be executed **fully autonomously** with no human in the loop — every ambiguity will become a wrong implementation decision.

**There is no limit on the number of questions. Ask every question that needs asking.**

#### 4a — Collect candidates

Go through these two sources and list every question candidate:

1. **Draft markers**: every `[?]` you wrote in Step 3 must become a question — no exceptions.
2. **Mandatory checklist**: go through each item below and ask yourself "do I know the answer with certainty?" If not, add it as a question.
3. **의존 이슈 확인**: 이 이슈 구현에 다른 이슈의 코드가 선행되어야 하는가? 그렇다면 의존 이슈 번호를 확인한다.

| Category | What to verify |
|----------|---------------|
| 완료 기준 형식 | 모든 항목이 `- [ ] ...` 체크리스트 형식인가? 모호한 동사("잘", "충분히", "보여야") 없는가? |
| 탐색 시작점 | 모든 항목이 `src/...` 형식의 실제 파일 경로인가? 추상적 이름(컴포넌트명만)은 없는가? |
| 구현 방식 | Multiple valid approaches exist? (DB vs client, hook vs inline, A vs B) |
| 오류/예외 처리 | What happens on network error? Empty state? Loading state? |
| UI/UX | If UI is involved: layout, navigation behavior, what text to show? |
| 날짜/시간/지역 | Any timezone, locale, or format dependency? |
| 범위 경계 | What is explicitly OUT of scope this issue? Risk of scope creep? |
| 데이터 흐름 | Where does data come from? Who owns the state? What triggers refetch? |
| 기술 제약 | Must use a specific library/pattern? Must NOT use something? |

#### 4b — Filter and ask

Remove from the candidate list anything that is:
- Derivable from the codebase (file paths, existing patterns, library APIs)
- Already answered clearly in the user's description

Ask all remaining candidates. Group related questions under a shared heading when they belong to the same concern.

#### 4c — Follow-up loop

After the user answers, re-check: do any answers introduce new ambiguities? If yes, ask follow-up questions. Repeat until nothing is underspecified.

#### Output format

```
## 이슈 초안 — [type] <제목>

<draft body>

---

확인이 필요한 항목:

**[그룹명 (있을 때만)]**
1. <질문>
2. <질문>

**[다른 그룹]**
3. <질문>
```

### Step 5 — Refine and confirm

Incorporate user's answers. Before presenting the final draft, run this internal checklist — fix any failure silently before showing to the user:

| Check | Rule |
|-------|------|
| 완료 기준 형식 | 모든 항목이 `- [ ] ...` 형식인가 |
| 탐색 시작점 형식 | 모든 항목이 실제 파일 경로(`src/...`)인가 |
| 의존 이슈 형식 | 있다면 정확히 `**의존 이슈:** #N` 형식인가 |
| 모호한 표현 | 완료 기준에 "잘", "충분히", "적절히" 등 검증 불가 표현이 없는가 |

Present the final draft in Korean:

```
## 최종 이슈

**제목:** [type] <제목>
**라벨:** <type>

<final body>

---
이 내용으로 이슈를 생성할까요?
```

Apply any user-requested changes and re-present before creating.

### Step 6 — Create issue

On approval:

```
gh issue create --title "[type] <제목>" --label "<type>" --body "<body>"
```

Output:
```
✓ 이슈 생성 완료
<URL>
```
