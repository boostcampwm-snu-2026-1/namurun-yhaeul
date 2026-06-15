# 에이전트 워크플로우

Claude Code를 이용한 이슈 기반 완전 자동화 개발 사이클.

---

## 전체 흐름

```
1. /create-issue "설명"   ← 이슈 작성 (반복)
          ↓
2. /auto-develop-all      ← 배치 자동화 실행 (1회)
          ↓
   이슈별: plan → implement → sync → PR
          ↓
3. PR 리뷰 후 머지        ← 사람이 처리
```

---

## 스킬 목록

| 스킬 | 역할 |
|------|------|
| `/create-issue` | 이슈 초안 작성, 모호함 제거 질문, 생성 |
| `/auto-develop-all` | 전체 이슈 배치 처리 래퍼 |
| `/auto-develop <N>` | 단일 이슈 전체 파이프라인 실행 |
| `/auto-plan <N>` | 이슈 검증, 작업 계획 작성, 브랜치 생성 |
| `/auto-implement <N>` | 구현, lint/build 검증, 커밋 |
| `/auto-sync [N]` | 코드-문서 정합성 확인 및 업데이트 |
| `/auto-pr <N>` | 브랜치 push, PR 생성 |

---

## 이슈 작성 규칙

`/create-issue`가 생성하는 이슈 본문은 자동화 파이프라인이 파싱하므로 형식이 정확해야 한다.

### 타입별 본문 형식

**feat**
```
**배경:** (왜 필요한가)
**구현 범위:**
- 신규: ...
- 수정: ...
**완료 기준:**
- [ ] ...
**탐색 시작점:**
- src/path/to/file.tsx
```

**fix / refactor / chore / test** 도 동일한 bold-key 형식 사용. 타입별 세부 필드는 `.claude/commands/create-issue.md` 참고.

### 파싱 규칙

| 필드 | 파싱 주체 | 비고 |
|------|-----------|------|
| `**완료 기준:**` | auto-plan (이슈 검증) | `- [ ]` 체크리스트만 허용 |
| `**탐색 시작점:**` | auto-plan, auto-develop | 실제 파일 경로만 허용 (`src/...`) |
| `**의존 이슈:** #N` | auto-plan, auto-develop-all | 코드 의존이 있을 때만 작성 |

---

## auto-develop-all 동작

### 의존관계 처리

이슈 간 코드 의존이 있을 때 `**의존 이슈:** #N` 필드로 선언한다.

```
#1: 기반 유틸 추가           (의존 없음)
#2: 유틸을 사용하는 기능 추가  (의존 이슈: #1)
```

배치 실행 시:
1. 모든 이슈의 의존관계를 파싱해 방향 그래프 구성
2. 순환 의존 감지 시 시작 전 중단
3. 위상 정렬로 처리 순서 결정 (#1 먼저, #2 나중)

### 브랜치 전략

```
dev
 └─ feature/1-base-util           PR → dev
     └─ feature/2-use-util        PR → feature/1-base-util
```

`#1` PR이 `dev`에 머지되면 GitHub이 `#2` PR의 base를 자동으로 `dev`로 변경한다.

### 파일 충돌 처리

열린 PR과 파일이 겹치면 해당 이슈를 건너뜀(⏭)하고 다음 이슈로 진행한다.
단, 의존 이슈의 PR은 충돌 체크에서 제외 — 의도적으로 겹치는 관계이기 때문이다.

### 결과 분류

| 기호 | 의미 |
|------|------|
| ✓ | 완료 — PR 생성됨 |
| ⏭ | 건너뜀 — 파일 충돌 또는 의존 이슈 미완료 |
| ✗ | 중단 — 수동 확인 필요 |

---

## auto-develop 파이프라인

단일 이슈에 대한 순서:

```
preconditions (dev 브랜치, clean tree)
  ↓
Pre-flight: git pull + open PR 충돌 체크
  ↓
Phase 1 — auto-plan:    이슈 검증 → 작업 계획 코멘트 → 브랜치 생성
  ↓
Phase 2 — auto-implement: 구현 → lint/build → 커밋 (단위별)
  ↓
Phase 3 — auto-sync:    코드-문서 정합성 확인 및 커밋
  ↓
Phase 4 — auto-pr:      push → PR 생성
  ↓
Phase 5 — Cleanup:      git checkout dev && git pull  ← 항상 실행
```

Phase 어디서 멈추든 Phase 5는 항상 실행돼 다음 이슈 처리를 준비한다.

---

## 중단 및 재실행

### 배치 중 이슈 중단 (✗)

배치는 계속 진행하되 해당 이슈는 최종 요약에서 "중단 (수동 확인 필요)"으로 표시된다.

수동 해결 후 단독으로 재실행:
```
/auto-develop <N>
```

각 phase는 완료 여부를 자체 감지해 이미 끝난 작업은 건너뛴다.

### 파일 충돌로 건너뜀 (⏭)

의존하지 않는 열린 PR과 파일이 겹치는 경우다.
해당 PR을 머지한 뒤 재실행:
```
/auto-develop <N>
```

---

## 컨텍스트 관리

이슈마다 `/compact`를 실행해 누적 컨텍스트를 압축한다.
50개 이상의 배치에서도 후반부 이슈의 정확도를 유지하기 위한 조치다.

이슈가 많을 경우 라벨로 묶어 나눠서 실행하는 것을 권장한다:
```
/auto-develop-all ready     # "ready" 라벨 이슈만 처리
```
