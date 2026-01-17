-- Migration: Add separate customer_name and country columns
-- Date: 2026-01-17
-- Purpose: Split customer_name_country into two separate columns for better querying

-- Step 1: Add new columns
ALTER TABLE customer_interactions
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_name
ON customer_interactions(customer_name);

CREATE INDEX IF NOT EXISTS idx_customer_interactions_country
ON customer_interactions(country);

-- Step 3: (Optional) Migrate existing data from customer_name_country
-- This assumes the format is "客戶名稱 (國家)" or "客戶名稱（國家）"
-- Run this only if you want to backfill existing records
/*
UPDATE customer_interactions
SET
  customer_name = TRIM(REGEXP_REPLACE(customer_name_country, '\s*[（(][^)）]+[)）]\s*$', '')),
  country = TRIM(SUBSTRING(customer_name_country FROM '[（(]([^)）]+)[)）]'))
WHERE customer_name IS NULL AND customer_name_country IS NOT NULL;
*/

-- Step 4: Verify the migration
SELECT
  COUNT(*) as total_records,
  COUNT(customer_name) as records_with_customer_name,
  COUNT(country) as records_with_country
FROM customer_interactions;
