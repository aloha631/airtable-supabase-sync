-- ================================================
-- Add customer_id column to customer_interactions
-- ================================================

-- Add customer_id column (stores Airtable customer record ID like "recPyRSvgATHNbuoq")
ALTER TABLE customer_interactions
ADD COLUMN customer_id VARCHAR(17);

-- Create index for customer_id for faster lookups
CREATE INDEX idx_customer_id ON customer_interactions(customer_id);

-- Add comment to explain the column
COMMENT ON COLUMN customer_interactions.customer_id IS 'Airtable 客戶 record ID (rec + 14 characters)';

-- Verify the changes
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'customer_interactions'
-- ORDER BY ordinal_position;
