# 데이터 파이프라인

1회성 로컬 Python 스크립트. 게임 서비스 코드와 완전히 분리.  
실행 후 R2와 Supabase에 데이터가 적재되면 이후 재실행 불필요.

## 데이터 수집 방식 결정 배경

세 가지 방법을 검토 후 덤프 방식으로 결정.

| 방법 | 결과 | 이유 |
|------|------|------|
| iframe 직접 삽입 | ❌ | 나무위키가 X-Frame-Options 헤더로 차단 |
| 서버에서 실시간 크롤링 | ❌ | 나무위키 이용약관 크롤링 금지, IP 차단 위험, 저작권 문제 |
| 덤프 데이터 활용 | ✅ | CC BY-NC-SA 2.0 KR로 비상업적 이용 허용, 서버 부담 없음, 구현 안정적 |

---

## 데이터 소스

- HuggingFace `heegyu/namuwiki` (2022년 3월 기준 덤프)
- 867,024개 문서, `.parquet` 포맷, 약 7.7GB
- 라이선스: CC BY-NC-SA 2.0 KR

**실측 수치:**

| 구분 | 수량 | 비고 |
|------|------|------|
| 전체 문서 | 867,024개 | |
| 리다이렉트 | 295,649개 | 전체의 34% |
| R2/Supabase 적재 대상 | 571,375개 | 리다이렉트 제외 전체 |
| 랜덤 시작/도착 후보 | 약 487,984개 | byte_size↑ + 링크 5개↑ 조건 쿼리로 선택 |

다운로드: HuggingFace 데이터셋 페이지에서 `.parquet` 파일 직접 다운로드  
(`load_dataset` 라이브러리 사용 시 전체를 RAM에 올려야 해서 비효율적)

### parquet 컬럼 구조

| 컬럼 | 사용 여부 | 설명 |
|------|----------|------|
| `title` | ✅ | 문서 제목 |
| `text` | ✅ | 나무마크 본문 |
| `contributors` | ❌ | 기여자 목록 (쉼표 구분) — 게임에 불필요 |
| `namespace` | ❌ | 전체 867,024행이 빈 문자열 — 필터링 불필요 |

읽을 때 필요한 컬럼만 지정해 메모리를 절약한다:

```python
df = pd.read_parquet("namuwiki.parquet", columns=["title", "text"])
```

### 실제 데이터 예시

**리다이렉트 문서:**
```
title : !
text  : #redirect 느낌표\n

title : $
text  : #redirect 달러\n
```

**일반 문서:**
```
title : 0점 플레이
text  : [목차]\n== 개요 ==\n점수를 단 1점도 얻지 않고 '''게임을 클리어'''하는 것.\n
        [[슈팅 게임]], [[아케이드 게임]] 등에서 주로 사용되는 용어이다.\n...

title : (웃음)
text  : [목차]\n== 본래 용법 ==\n잡지나 신문 등에서 인터뷰나 대담 등을 글로 옮길 때\n
        실제 웃음소리 대신 사용하는 표기.\n...
```

리다이렉트는 `text`가 `#redirect 문서명\n` 형식으로 시작한다.
일반 문서는 `[목차]`, `== 섹션명 ==`, `[[내부링크]]` 등 나무마크 문법을 포함한다.

## 실행 환경

```bash
pip install -r scripts/requirements.txt
```

`supabase==2.5.3` 으로 버전 고정 — 이후 버전의 `storage3`이 `pyiceberg`(C 확장)를 의존성으로 추가해 Windows에서 빌드 실패함.

필요 환경변수는 `scripts/.env.example` 참고. `SUPABASE_SERVICE_ROLE_KEY`는 파이프라인에서만 사용, 절대 프론트엔드 노출 금지.

## 전처리 흐름

구현: `scripts/pipeline.py`

**parquet 읽기:** `pd.read_parquet`은 `chunksize`를 지원하지 않으므로 `pyarrow.ParquetFile.iter_batches(batch_size=10_000)`으로 청크 단위 처리.

**리다이렉트 감지:** `text.startswith("#redirect")` → target은 `#redirect ` 이후 텍스트를 `.strip()`으로 추출.

**링크 추출 순서:**
1. `##`으로 시작하는 라인 제거 (렌더링 안 되는 편집자 주석)
2. `\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]` 정규식으로 문서명 추출 (`[[문서명]]`, `[[문서명|표시텍스트]]`, `[[문서명#섹션]]` 모두 처리)
3. `.strip().lstrip(':')` 정규화 (`[[:파일:...]]` 형태 처리)
4. 아래 접두어로 시작하는 링크 제거

**제외 접두어:** `파일:`, `분류:`, `https:`, `http:`, `틀:`, `템플릿:`, `나무위키:`, `사용자:`, `도움말:`

**필터링 없이 모든 일반 문서 적재** (~571,375개) — 시작/도착점 후보 선택은 쿼리에서 처리.

## R2 업로드

구현: `scripts/pipeline.py`

`boto3`로 R2 연결, `ThreadPoolExecutor(max_workers=50)`으로 병렬 업로드.  
저장 형식: `articles/{title}.json` — `{"title": ..., "text": ...}` JSON을 **gzip 압축**해서 저장.  
`ContentEncoding: gzip` 메타데이터를 함께 설정 — 브라우저 Fetch API가 자동으로 압축 해제하므로 프론트엔드 코드 변경 불필요.  
한국어 텍스트는 gzip으로 70~80% 압축 (288KB → ~60KB), fetch 속도 대폭 개선.  
한글 파일명은 boto3가 내부적으로 URL 인코딩 처리.

**실패 처리:**  
업로드 실패 시 지수 백오프(1s/2s)로 최대 3회 재시도. 배치 루프 완료 후 남은 실패 문서를 일괄 재시도(최대 5회). 최종 실패 시 `scripts/failed_uploads.txt`에 제목 목록 저장.

## CLI 플래그

```bash
python scripts/pipeline.py <parquet_file> [옵션]
```

| 플래그 | 설명 |
|--------|------|
| `--dry-run` | 업로드 없이 처리 통계만 출력 |
| `--r2-only` | R2 업로드만 수행 (Supabase INSERT 생략) |
| `--resume` | R2 `list_objects_v2`로 이미 업로드된 문서 건너뜀 |
| `--gzip-fix DATETIME` | 지정 시각 이전에 업로드된 문서만 재업로드 (gzip 소급 적용용). `LastModified` 기준 필터링이므로 HEAD 요청 없이 효율적. 예: `--gzip-fix 2026-06-09T15:41:00+09:00` |

## Supabase INSERT

1,000개 배치 단위로 bulk insert (단건 insert 시 속도 저하).

## R2 CORS 설정 (필수)

프론트엔드(Vercel)에서 R2로 직접 fetch하는 구조이므로 R2 버킷에 CORS 허용 설정 필요.

```json
[{
  "AllowedOrigins": ["https://your-app.vercel.app"],
  "AllowedMethods": ["GET"],
  "AllowedHeaders": ["*"]
}]
```

## 주의사항

- 한글 파일명 인코딩: R2 Key에 한글 사용 시 URL 인코딩 처리 필요
- 전체 처리 시간: 50만 건 기준 수 시간 소요 예상 (병렬 업로드로 단축)
- 리다이렉트 체인: A → B → C 형태의 다단계 리다이렉트는 파이프라인에서 flatten 처리 고려
