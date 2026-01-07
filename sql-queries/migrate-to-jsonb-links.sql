-- ================================================
-- Migration: Convert customer_id to JSONB array
-- ================================================
-- Purpose: Support multiple linked records from Airtable
-- Converts: customer_id VARCHAR(17) → linked_customers JSONB
-- ================================================

-- Step 1: Add new JSONB column for linked customers
ALTER TABLE customer_interactions
ADD COLUMN linked_customers JSONB;

-- Step 2: Migrate existing data from customer_id to linked_customers
-- Convert single customer_id to JSONB array format
UPDATE customer_interactions
SET linked_customers =
  CASE
    WHEN customer_id IS NOT NULL AND customer_id != ''
    THEN jsonb_build_array(customer_id)
    ELSE '[]'::jsonb
  END
WHERE linked_customers IS NULL;

-- Step 3: Verify migration
-- SELECT
--   airtable_id,
--   customer_id AS old_customer_id,
--   linked_customers AS new_linked_customers
-- FROM customer_interactions
-- LIMIT 10;

-- Step 4: Drop old customer_id column (after verification)
-- IMPORTANT: Only run this after confirming the migration is successful
-- ALTER TABLE customer_interactions DROP COLUMN customer_id;
-- DROP INDEX IF EXISTS idx_customer_id;

-- Step 5: Create GIN index on JSONB column for fast queries
CREATE INDEX idx_linked_customers ON customer_interactions USING GIN(linked_customers);

-- Step 6: Add comment
COMMENT ON COLUMN customer_interactions.linked_customers IS 'Array of Airtable customer record IDs (JSONB format): ["recXXX", "recYYY"]';

-- ================================================
-- Query examples for JSONB array
-- ================================================

-- Example 1: Find records linked to a specific customer
-- SELECT * FROM customer_interactions
-- WHERE linked_customers @> '["recPyRSvgATHNbuoq"]'::jsonb;

-- Example 2: Find records with multiple linked customers
-- SELECT * FROM customer_interactions
-- WHERE jsonb_array_length(linked_customers) > 1;

-- Example 3: Extract all unique customer IDs
-- SELECT DISTINCT jsonb_array_elements_text(linked_customers) AS customer_id
-- FROM customer_interactions
-- WHERE linked_customers IS NOT NULL;

-- Example 4: Count records per customer
-- SELECT
--   jsonb_array_elements_text(linked_customers) AS customer_id,
--   COUNT(*) as interaction_count
-- FROM customer_interactions
-- WHERE linked_customers IS NOT NULL
-- GROUP BY customer_id
-- ORDER BY interaction_count DESC;

-- ================================================
-- Rollback (if needed)
-- ================================================

-- Restore customer_id from linked_customers
-- ALTER TABLE customer_interactions ADD COLUMN customer_id VARCHAR(17);
-- UPDATE customer_interactions
-- SET customer_id = linked_customers->0 ->> 0
-- WHERE linked_customers IS NOT NULL AND jsonb_array_length(linked_customers) > 0;
-- DROP INDEX IF EXISTS idx_linked_customers;
-- ALTER TABLE customer_interactions DROP COLUMN linked_customers;
