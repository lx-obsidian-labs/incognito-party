-- Add temp_client_id for optimistic DM reconciliation
ALTER TABLE direct_messages
  ADD COLUMN IF NOT EXISTS temp_client_id TEXT;
