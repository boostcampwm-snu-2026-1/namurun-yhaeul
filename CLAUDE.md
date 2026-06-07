# 나무런 (Namurun) — CLAUDE.md

나무위키 내부 링크만으로 목표 문서에 가장 빨리 도달하는 스피드런 웹 게임.

---

## 기술 스택

React + TypeScript + Tailwind CSS / Vercel  
Supabase (메타데이터 + 리더보드) / Cloudflare R2 (문서 본문 서빙)  
namumark-clone-core (나무마크 렌더링)  
데이터: 나무위키 덤프 heegyu/namuwiki — CC BY-NC-SA 2.0 KR (비상업적 이용만 허용)

---

## 브랜치 전략

`main` (배포, 직접 커밋 금지) ← `dev` ← `feature/*`  
PR 흐름: `feature/*` → `dev` → (배포 시) `main`

---

## 핵심 결정사항

- 나무마크 렌더링은 완벽하지 않아도 됨 — 링크 동작이 핵심, 표/이미지 깨짐 허용
- 타이머는 클라이언트 기준 — 초기 버전 서버 검증 없음
- 비로그인 — 닉네임만 입력, Supabase Auth 미사용
- 리다이렉트 문서는 게임 시작/도착점 후보 제외

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

환경변수: `.env.example` 참고

---

## 코드 스타일

- 함수형 컴포넌트만 사용 (class component 금지)
- 컴포넌트 로직은 커스텀 훅으로 분리 (`useGame`, `useArticle` 등)
- `any` 사용 금지 — 타입 모를 경우 `unknown` 후 narrowing

---

## 절대 하지 말 것

- `dangerouslySetInnerHTML` 직접 사용 금지 — 단, `namumark-clone-core` 파싱 결과를 삽입하는 `ArticleViewer` 컴포넌트에서의 사용은 허용 (라이브러리 출력에 한정, XSS)
- R2는 read-only — 데이터 파이프라인 외 코드에서 R2 write 금지
- Supabase service role key 클라이언트 노출 금지 — anon key만 프론트엔드에서 사용

---

## 작업 전 필독

**docs는 기술 스펙이다** — 코드보다 먼저 작성되고, 코드와 항상 일치해야 한다.

작업을 시작하기 전에 반드시 관련 문서를 먼저 읽는다.

구현 내용이 문서의 설계와 다를 경우, 코드를 작성하기 전에 반드시 해당 문서를 먼저 수정하는 절차가 필요하다. 설계 변경 없이 임의로 구현 방향을 바꾸지 않는다.

---

## 커밋 컨벤션

```
<type>: <description>

[optional body]
```

- `description`: 현재형, 소문자, 마침표 없이
- `body`: 왜 했는지 / 주요 결정사항 — 있을 때만

| 타입 | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 코드 정리 |
| `style` | 포맷, 공백 등 로직 무관 |
| `docs` | 문서 수정 |
| `chore` | 빌드, 패키지, 설정 |
| `test` | 테스트 추가/수정 |

---

## Claude Skill 제안

동일한 작업이 3회 이상 반복되는 패턴이 확인되면 skill 생성을 제안한다.

---

## 상세 문서

| 문서 | 내용 |
|------|------|
| `docs/architecture.md` | 아키텍처, 컴포넌트 구조, 데이터 흐름 |
| `docs/db-schema.md` | Supabase 테이블 스키마 + 인덱스 |
| `docs/data-pipeline.md` | 전처리 스크립트 설계 및 실행 방법 |

문서는 Mintlify에서 렌더링된다. 세션 시작 시 전체 문서 구조가 필요하면 `https://namurun.mintlify.app/llms.txt` 를 fetch한다.
