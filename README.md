# 🌳 나무런 (Namurun)

> 나무위키의 내부 하이퍼링크만을 클릭하여 목표 문서에 가장 빨리 도달하는 스피드런 웹 게임

**[위키피디아 스피드런(The Wiki Game)](https://wikispeedruns.com/)** 의 나무위키 버전입니다.

---

## 🎮 서비스 소개

주어진 시작 문서에서 출발하여, 나무위키 내부 링크만을 클릭하여 목표 문서에 도달하세요.  
클릭 수와 소요 시간으로 순위를 겨루는 **일일 챌린지**와 **랜덤 스피드런**을 제공합니다.

### ✨ 핵심 기능

| 기능 | 설명 |
|------|------|
| 📅 일일 문제 | 매일 고정된 시작·도착 문서 쌍 제공 |
| 🎲 랜덤 스피드런 | 무작위 문서 쌍으로 즉석 대결 |
| 📄 나무마크 렌더링 | 실제 나무위키와 유사한 문서 표시 |
| 🏆 결과 & 리더보드 | 클릭 수, 경로, 소요 시간 기록 및 순위 표시 |

---

## 🛠 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| 프론트엔드 | React + TypeScript | 컴포넌트 기반 UI, 타입 안정성 |
| 스타일링 | Tailwind CSS | 빠른 프로토타이핑, 유틸리티 우선 |
| 호스팅 | Vercel | 프론트엔드 무료 배포, GitHub 연동 |
| DB (메타데이터) | Supabase (PostgreSQL) | 무료 티어, REST API 내장, 리더보드용 |
| 객체 스토리지 | Cloudflare R2 | Egress 무료, CDN 캐싱, 문서 JSON 서빙 |
| 마크업 파서 | namumark-clone-core | TypeScript 구현체, 나무마크 렌더링 |
| 데이터 | 나무위키 덤프 (CC BY-NC-SA 2.0 KR) | heegyu/namuwiki (HuggingFace, 867K 문서) |

---

## 🏗 아키텍처 흐름

```
사용자 링크 클릭
  → Supabase redirects 테이블 확인 (리다이렉트 처리)
  → 프론트엔드가 R2에서 "articles/문서명.json" fetch (CDN 캐시)
  → namumark-clone-core로 HTML 렌더링
  → Supabase articles.links[] 배열로 유효 링크 검증
  → 도착 확인 시 game_records에 기록
```

---

## 🌿 브랜치 전략

```
main    ─── 배포 브랜치 (직접 커밋 금지)
 └─ dev ─── 개발 통합 브랜치
     └─ feature/xxx ─── 기능별 작업 브랜치
```

- `feature/*` → `dev` PR 후 머지
- `dev` → `main` PR은 배포 직전에만 진행

---

## 🔄 데이터 파이프라인 (Phase 1, 1회성 로컬 실행)

```
HuggingFace heegyu/namuwiki .parquet 다운로드
  → Python(Pandas) 전처리
    - 리다이렉트 문서 → Supabase redirects 테이블
    - 일반 문서 필터링 (1,000바이트↑, 내부 링크 5개↑)
    - 내부 링크 추출 ([[문서명]] 패턴)
  → 본문 JSON → Cloudflare R2 병렬 업로드
  → 메타데이터 → Supabase bulk INSERT
```

---

## 📄 라이선스

본 서비스는 나무위키 데이터를 기반으로 합니다.  
나무위키 덤프 데이터는 **[CC BY-NC-SA 2.0 KR](https://creativecommons.org/licenses/by-nc-sa/2.0/kr/)** 라이선스를 따릅니다.

- 출처 표기 필수
- 비상업적 이용만 허용
- 동일 라이선스 적용

소스코드는 [LICENSE](./LICENSE) 파일을 참고하세요.
