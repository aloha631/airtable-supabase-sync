-- ================================================
-- Make categories column optional (remove NOT NULL)
-- ================================================

-- Remove NOT NULL constraint from categories column
ALTER TABLE customer_interactions
ALTER COLUMN categories DROP NOT NULL;

-- Verify the change
-- SELECT column_name, is_nullable, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'customer_interactions'
-- AND column_name = 'categories';
