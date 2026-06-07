# status

현재 파이프라인 진행 상태를 파악하고 다음 단계를 안내한다.  
대화가 끊기거나 세션이 바뀌었을 때 맥락을 빠르게 복구하기 위한 skill.

## 실행 순서

1. **현재 상태 파악** — 아래를 병렬로 실행한다:
   - `git branch --show-current` — 현재 브랜치 확인
   - `git status --short` — 커밋되지 않은 변경사항 확인
   - `git log dev..HEAD --oneline` — 이 브랜치에서 쌓인 커밋 목록

2. **브랜치 확인**
   - `dev` 또는 `main`이면 아래를 출력하고 종료한다:
     ```
     feature 브랜치가 아닙니다.
     → /plan-sprint 로 새 작업을 시작하세요.
     ```

3. **이슈 연결** — 브랜치명에서 이슈를 유추한다:
   - `gh issue list --state open`에서 브랜치명 키워드로 제목 매칭
   - 매칭 실패 시 사용자에게 이슈 번호를 묻는다
   - `gh issue view <N> --comments`로 작업 계획 코멘트를 읽는다
   - `gh pr list --head <현재브랜치> --state open`으로 PR 여부 확인

4. **파이프라인 단계 판단**

   | 단계 | 완료 판단 기준 |
   |------|--------------|
   | plan-sprint | 이슈 코멘트에 `### 커밋 단위` 섹션 존재 |
   | implement | 작업 계획의 모든 커밋 단위명이 `git log`에 존재 |
   | docs-sync | implement 완료 후 `docs:` 커밋이 있거나 uncommitted 변경사항 없음 |
   | commit-msg | `git status`에 uncommitted 변경사항 없음 |
   | create-pr | 현재 브랜치로 열린 PR 존재 |

5. **결과 출력**

   ```
   현재 브랜치: feature/xxx
   연결된 이슈: #N "이슈명"

   ✓ plan-sprint
   ✓ implement (커밋 2/2)
     docs-sync        ← 현재 단계
     commit-msg
     create-pr

   → /docs-sync 를 실행하세요.
   ```

   - implement 진행 중이면 완료된 커밋 수를 표시한다 (예: `implement (커밋 1/2)`)
   - 모든 단계 완료 시:
     ```
     ✓ 모든 단계 완료
     PR: <URL>
     ```
   - uncommitted 변경사항이 있으면 별도로 표시한다:
     ```
     ⚠ 커밋되지 않은 변경사항 있음 — /commit-msg 를 먼저 실행하세요.
     ```
