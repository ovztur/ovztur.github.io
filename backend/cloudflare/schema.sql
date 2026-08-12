CREATE TABLE IF NOT EXISTS event_counters (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  version TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day,event,version)
);
