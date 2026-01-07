-- 1. Add column ONLY if it doesn't exist (using a DO block for safety)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_interactions' AND column_name='notes_idioma') THEN
        ALTER TABLE customer_interactions ADD COLUMN notes_idioma TEXT;
    END IF;
END $$;

-- 2. Drop the problematic B-tree index if it was created
DROP INDEX IF EXISTS idx_notes_idioma;

-- 3. Create GIN index for full-text searching (B-tree is too small for long text)
CREATE INDEX IF NOT EXISTS idx_notes_idioma_fulltext ON customer_interactions 
USING GIN(to_tsvector('simple', COALESCE(notes_idioma, '')));

-- 4. Add comment
COMMENT ON COLUMN customer_interactions.notes_idioma IS 'Customer language interaction notes (mapped from Airtable "更新內容(客戶語言)")';
