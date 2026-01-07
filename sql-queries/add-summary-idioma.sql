-- ================================================
-- Migration: Add summary_idioma column
-- ================================================

-- Add column
ALTER TABLE customer_interactions
ADD COLUMN summary_idioma TEXT;

-- Create index for faster searching
CREATE INDEX idx_summary_idioma ON customer_interactions(summary_idioma);

-- Add comment
COMMENT ON COLUMN customer_interactions.summary_idioma IS 'Spanish summary (mapped from Airtable "簡述(Idioma)")';
