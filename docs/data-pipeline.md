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
- 867,024개 문서, `.parquet` 포맷
- 라이선스: CC BY-NC-SA 2.0 KR

다운로드: HuggingFace 데이터셋 페이지에서 `.parquet` 파일 직접 다운로드  
(`load_dataset` 라이브러리 사용 시 전체를 RAM에 올려야 해서 비효율적)

## 실행 환경

```bash
pip install pandas pyarrow boto3 supabase
```

필요 환경변수:
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=namuwiki-articles
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # 파이프라인에서만 사용, 절대 프론트엔드 노출 금지
```

## 전처리 흐름

```python
import pandas as pd
import re

chunk_size = 10000

for chunk in pd.read_parquet("namuwiki.parquet", chunksize=chunk_size):

    # 1. 리다이렉트 문서 분리
    # "#redirect 문서명" 으로 시작하는 문서
    redirects = chunk[chunk["text"].str.startswith("#redirect")]
    # → Supabase redirects 테이블에 저장 (title, target)

    chunk = chunk[~chunk["text"].str.startswith("#redirect")]

    # 2. 토막글 제거 (1,000바이트 미만)
    chunk = chunk[chunk["text"].str.len() > 1000]

    # 3. 내부 링크 추출
    # [[문서명]] 또는 [[실제명|표시텍스트]] → 실제 문서명만 추출
    def extract_links(text):
        raw = re.findall(r'\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]', text)
        return list(set(raw))

    chunk["links"] = chunk["text"].apply(extract_links)

    # 4. 링크 5개 미만 문서 제거
    chunk = chunk[chunk["links"].apply(len) >= 5]

    # 5. 본문 → R2 업로드, 메타데이터 → Supabase INSERT
```

## R2 업로드

```python
import boto3
from concurrent.futures import ThreadPoolExecutor
import json

r2 = boto3.client("s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY
)

def upload_to_r2(title: str, text: str):
    key = f"articles/{title}.json"
    r2.put_object(
        Bucket="namuwiki-articles",
        Key=key,
        Body=json.dumps({"title": title, "text": text}, ensure_ascii=False),
        ContentType="application/json"
    )

# 50개씩 병렬 업로드
with ThreadPoolExecutor(max_workers=50) as executor:
    executor.map(lambda row: upload_to_r2(row["title"], row["text"]), rows)
```

대안: `rclone copy ./json_files r2:namuwiki-articles --transfers=50`

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
