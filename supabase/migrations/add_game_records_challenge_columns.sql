ALTER TABLE game_records
  ADD COLUMN challenge_type TEXT CHECK (challenge_type IN ('daily', 'random')),
  ADD COLUMN daily_date DATE;

-- challenge_type 기반 리더보드 쿼리용 인덱스
CREATE INDEX idx_game_records_challenge_type ON game_records(challenge_type, daily_date);
