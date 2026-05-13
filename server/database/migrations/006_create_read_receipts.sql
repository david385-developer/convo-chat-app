-- CREATE READ RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS read_receipts (
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CREATE INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON read_receipts(user_id);
