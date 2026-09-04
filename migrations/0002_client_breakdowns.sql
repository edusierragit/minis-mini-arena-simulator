CREATE TABLE IF NOT EXISTS analytics_client_daily (
  day TEXT NOT NULL,
  browser TEXT NOT NULL DEFAULT 'other',
  operating_system TEXT NOT NULL DEFAULT 'other',
  device TEXT NOT NULL DEFAULT 'desktop',
  language TEXT NOT NULL DEFAULT 'other',
  viewport TEXT NOT NULL DEFAULT 'standard',
  visit_type TEXT NOT NULL DEFAULT 'unknown',
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (day, browser, operating_system, device, language, viewport, visit_type)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_analytics_client_daily_day
ON analytics_client_daily (day);

PRAGMA optimize;
