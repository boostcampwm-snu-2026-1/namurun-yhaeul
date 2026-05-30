# DB 스키마 (Supabase / PostgreSQL)

## 테이블

### articles — 문서 메타데이터

```sql
CREATE TABLE articles (
  title      TEXT PRIMARY KEY,
  links      TEXT[],       -- 내부 링크 목록 ["이순신", "조선", ...]
  byte_size  INTEGER,      -- 본문 바이트 수 (랜덤 문제 가중치, 필터링용)
  created_at TIMESTAMP DEFAULT NOW()
);
```

### redirects — 리다이렉트 매핑

```sql
CREATE TABLE redirects (
  title  TEXT PRIMARY KEY,  -- 리다이렉트 문서명 (예: "NASDAQ")
  target TEXT               -- 실제 이동할 문서명 (예: "나스닥")
);
```

게임 중 링크 클릭 시 이 테이블을 먼저 확인. 리다이렉트면 target으로 이동.  
리다이렉트 문서는 게임 시작/도착점 후보에서 제외 (본문 없음).

### game_records — 게임 기록

```sql
CREATE TABLE game_records (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name        TEXT,
  start_article    TEXT,
  end_article      TEXT,
  click_count      INTEGER,
  elapsed_seconds  INTEGER,
  path             TEXT[],   -- 거쳐온 문서 순서 ["시작", "중간1", ..., "도착"]
  created_at       TIMESTAMP DEFAULT NOW()
);
```

### daily_prompts — 일일 문제

```sql
CREATE TABLE daily_prompts (
  date          DATE PRIMARY KEY,
  start_article TEXT,
  end_article   TEXT
);
```

## 인덱스

```sql
-- 랜덤 문제 추출 시 byte_size 상위 문서 필터링용
CREATE INDEX idx_articles_byte_size ON articles(byte_size DESC);

-- 리더보드: 동일 문제 기준 정렬
CREATE INDEX idx_game_records_articles ON game_records(start_article, end_article);
```

## 데이터 규모 (예상)

- `articles`: ~50만 건 (필터링 후)
- `redirects`: ~수십만 건
- `game_records`: 게임 플레이 누적
- `daily_prompts`: 날짜당 1건
