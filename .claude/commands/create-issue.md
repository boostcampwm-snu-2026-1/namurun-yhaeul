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

After the draft, ask about **every item that is ambiguous or underspecified** — because the issue will be executed fully autonomously with no human in the loop during implementation.

Ask about anything where the wrong assumption would cause incorrect implementation:
- 완료 기준이 모호할 때: "어떤 동작이 보장되면 완료로 볼 수 있을까요?"
- 범위 판단이 어려울 때: "A 방식과 B 방식 중 어느 쪽인가요?"
- fix에서 재현 조건이 없을 때: "어떤 상황에서 발생하나요?"
- 구현 방식이 여러 갈래일 때: 선택지를 제시하고 확인
- 엣지 케이스 처리가 불명확할 때: 예상 동작을 확인

Do **not** ask about:
- 탐색 시작점 — find it in the code
- File paths — use Glob/Grep
- Anything already clearly inferable from the description or codebase

Group related questions together. After user answers, check if any answers introduce new ambiguities — if so, ask follow-up questions until nothing is underspecified.

Output format:
```
## 이슈 초안 — [type] <제목>

<draft body>

---

확인이 필요한 항목:
1. <질문>
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
