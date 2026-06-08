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

Use the field structure matching the chosen type:

**feat** — 배경 / 구현 범위 / 완료 기준 / 탐색 시작점  
**fix** — 증상 / 재현 조건 / 관련 코드 / 완료 기준 / 탐색 시작점  
**refactor** — 현재 상태 / 목표 상태 / 범위 / 완료 기준 / 탐색 시작점  
**chore** — 배경 / 변경 범위 / 완료 기준 / 탐색 시작점  
**test** — 테스트 대상 / 테스트 케이스 / 파일 범위 / 탐색 시작점

### Step 4 — Ask focused questions

This step is the most important. The issue will be executed **fully autonomously** with no human in the loop — every ambiguity will become a wrong implementation decision.

**There is no limit on the number of questions. Ask every question that needs asking.**

#### 4a — Collect candidates

Go through these two sources and list every question candidate:

1. **Draft markers**: every `[?]` you wrote in Step 3 must become a question — no exceptions.
2. **Mandatory checklist**: go through each item below and ask yourself "do I know the answer with certainty?" If not, add it as a question.

| Category | What to verify |
|----------|---------------|
| 완료 기준 | Each criterion unambiguous? No vague verbs like "잘 보여야 한다"? |
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

Incorporate user's answers. Present the final draft in Korean:

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
