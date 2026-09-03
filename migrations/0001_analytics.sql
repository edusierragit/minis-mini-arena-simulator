CREATE TABLE IF NOT EXISTS analytics_daily (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  class_id TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT '',
  rounds INTEGER NOT NULL DEFAULT 0,
  country TEXT NOT NULL DEFAULT 'XX',
  referrer TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (day, event, class_id, difficulty, rounds, country, referrer, source, campaign)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS analytics_daily_event_day
ON analytics_daily (event, day);
