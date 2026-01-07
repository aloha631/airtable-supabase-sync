-- ================================================
-- Migration: Align Schema with intuitive naming
-- ================================================

-- 1. Rename Columns
ALTER TABLE customer_interactions RENAME COLUMN customer_name TO customer_name_country;
ALTER TABLE customer_interactions RENAME COLUMN interaction_notes TO update_content;
ALTER TABLE customer_interactions RENAME COLUMN notes_idioma TO update_content_idioma;

-- 2. Add airtable_last_modified column
ALTER TABLE customer_interactions ADD COLUMN airtable_last_modified TIMESTAMPTZ;

-- 3. Rename/Update Indexes for clarity (Postgres automatically updates the column reference)
ALTER INDEX IF EXISTS idx_customer_name RENAME TO idx_customer_name_country;
ALTER INDEX IF EXISTS idx_notes_fulltext RENAME TO idx_update_content_fulltext;
ALTER INDEX IF EXISTS idx_notes_not_null RENAME TO idx_update_content_not_null;
ALTER INDEX IF EXISTS idx_notes_idioma_fulltext RENAME TO idx_update_content_idioma_fulltext;

-- 4. Update Comments
COMMENT ON COLUMN customer_interactions.customer_name_country IS 'Airtable 客戶名稱+國家';
COMMENT ON COLUMN customer_interactions.update_content IS 'Airtable 更新內容';
COMMENT ON COLUMN customer_interactions.update_content_idioma IS 'Airtable 更新內容(客戶語言)';
COMMENT ON COLUMN customer_interactions.airtable_last_modified IS 'Airtable 原始最後更新時間';

-- 5. ANALYZE to update stats
ANALYZE customer_interactions;
