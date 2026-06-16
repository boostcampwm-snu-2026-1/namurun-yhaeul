-- articles 테이블에 id SERIAL 컬럼 추가
-- 랜덤 문서 선택을 COUNT + random offset 방식으로 전환하기 위해 필요
-- 적용: Supabase SQL Editor 또는 psql에서 실행

ALTER TABLE articles ADD COLUMN IF NOT EXISTS id SERIAL;
