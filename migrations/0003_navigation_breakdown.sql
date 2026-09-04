CREATE TABLE IF NOT EXISTS analytics_navigation_daily (
  navigation_type TEXT NOT NULL DEFAULT 'unknown',
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (navigation_type, day)
) WITHOUT ROWID;

PRAGMA optimize;
