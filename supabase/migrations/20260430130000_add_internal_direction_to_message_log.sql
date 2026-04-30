-- Add 'internal' direction to message_log for internal notes
-- These are visible only to users (never sent to WhatsApp)
ALTER TABLE message_log DROP CONSTRAINT IF EXISTS message_log_direction_check;
ALTER TABLE message_log ADD CONSTRAINT message_log_direction_check
  CHECK (direction IN ('outgoing', 'incoming', 'auto', 'internal'));
