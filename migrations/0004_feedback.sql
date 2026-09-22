CREATE TABLE IF NOT EXISTS feedback_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  category TEXT NOT NULL CHECK (category IN ('idea', 'confusing', 'bug', 'other')),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 10 AND 800),
  page TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'planned', 'done'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_messages_created_at
ON feedback_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_messages_status
ON feedback_messages (status, created_at DESC);

PRAGMA optimize;
