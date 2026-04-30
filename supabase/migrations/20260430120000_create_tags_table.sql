-- Create tags table with color support
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#5a4a9c',
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, tenant_id)
);

-- Index for fast lookup
CREATE INDEX idx_tags_tenant ON tags(tenant_id);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other tables)
CREATE POLICY "tags_select" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "tags_update" ON tags FOR UPDATE USING (true);
CREATE POLICY "tags_delete" ON tags FOR DELETE USING (true);

-- Create a join table for lead-tag relationships (optional migration path)
-- For now, leads.tags TEXT[] remains the source of truth
-- This table enables color lookups for existing tag strings
