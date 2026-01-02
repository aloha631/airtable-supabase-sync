-- ================================================
-- Schema Migration: Fix customer_interactions table
-- ================================================

-- Step 1: Rename column 'topic' to 'categories'
ALTER TABLE customer_interactions
RENAME COLUMN topic TO categories;

-- Step 2: Update index name for consistency
DROP INDEX IF EXISTS idx_topic;
CREATE INDEX idx_categories ON customer_interactions(categories);

-- Verify the changes
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'customer_interactions';
