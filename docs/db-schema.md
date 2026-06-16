# DB 스키마 (Supabase / PostgreSQL)

## 테이블

### articles — 문서 메타데이터

```sql
CREATE TABLE articles (
  id         SERIAL,       -- 랜덤 offset 선택용 (마이그레이션: supabase/migrations/add_articles_id_serial.sql)
  title      TEXT PRIMARY KEY,
  links      TEXT[],       -- 내부 링크 목록 ["이순신", "조선", ...]
  byte_size  INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

랜덤 시작/도착점 후보 선택: `ORDER BY RANDOM()`은 인덱스를 타지 않아 571K 건에서 느림. `COUNT(*)`로 전체 문서 수를 구한 뒤 클라이언트에서 랜덤 정수 생성 → `WHERE id >= $random_id LIMIT 1`으로 단건 fetch.

```sql
-- 마운트 시 1회 (전체 문서 수)
SELECT COUNT(*) FROM articles;

-- 시작 문서 (random offset)
SELECT title FROM articles
WHERE id >= $random_id
LIMIT 1;

-- 도착 문서 (다른 random offset, '/' 포함 문서 제외)
SELECT title FROM articles
WHERE id >= $random_id
  AND title NOT LIKE '%/%'
LIMIT 1;
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
  elapsed_ms       INTEGER,
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
-- 랜덤 offset 선택용
CREATE INDEX idx_articles_id ON articles(id);

-- 리더보드: 동일 문제 기준 정렬
CREATE INDEX idx_game_records_articles ON game_records(start_article, end_article);
```

## RLS 정책

`articles`, `redirects`는 프론트엔드에서 anon key로 읽어야 하므로 SELECT 허용 정책 적용.

```sql
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON articles FOR SELECT USING (true);
CREATE POLICY "public read" ON redirects FOR SELECT USING (true);
```

`game_records`, `daily_prompts`는 필요 시 추가.

## 데이터 규모 (실측)

- `articles`: 571,375건
- `redirects`: 295,649건
- `game_records`: 게임 플레이 누적
- `daily_prompts`: 날짜당 1건
