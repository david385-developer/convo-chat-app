CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  room_id TEXT DEFAULT NULL,
  conversation_id TEXT DEFAULT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'TEXT' CHECK(type IN ('TEXT','MARKDOWN','IMAGE','LINK')),
  media_url TEXT DEFAULT NULL,
  status TEXT DEFAULT 'sent' CHECK(status IN ('sent','delivered','read')),
  is_edited INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  read_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES private_conversations(id) ON DELETE CASCADE,
  CHECK (
    (room_id IS NOT NULL AND conversation_id IS NULL) OR
    (room_id IS NULL AND conversation_id IS NOT NULL)
  )
);

/**
 * INDEXING STRATEGY
 * We use DESC index for created_at to optimize for fetching the 
 * latest messages (standard chat behavior). Soft deletion (is_deleted)
 * is used to preserve chat history context while hiding content.
 */
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
