-- ================================================
-- Airtable to Supabase Sync - Database Schema
-- Updated: 2026-01-08 (Schema Alignment)
-- ================================================

-- 客戶互動資料表
CREATE TABLE customer_interactions (
  id SERIAL PRIMARY KEY,
  airtable_id TEXT UNIQUE NOT NULL,            -- Airtable Record ID
  linked_customers JSONB,                      -- 客戶 Record IDs (陣列型態)
  customer_name_country TEXT NOT NULL,         -- 客戶名稱+國家 (對應 Airtable「客戶名稱+國家」)
  categories TEXT,                             -- 類別 (對應 Airtable「類別」)
  summary_en TEXT,                             -- 英文簡述 (對應 Airtable「簡述(en)」)
  summary_cn TEXT,                             -- 中文簡述 (對應 Airtable「簡述(cn)」)
  summary_idioma TEXT,                         -- 西文簡述 (對應 Airtable「簡述(Idioma)」)
  update_content TEXT,                         -- 更新內容 (對應 Airtable「更新內容」)
  update_content_idioma TEXT,                  -- 更新內容客語 (對應 Airtable「更新內容(客戶語言)」)
  airtable_last_modified TIMESTAMPTZ,          -- Airtable 原始最後更新時間
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 優化索引 (AI 查詢與效能)
CREATE INDEX idx_customer_name_country ON customer_interactions(customer_name_country);
CREATE INDEX idx_categories ON customer_interactions(categories);
CREATE INDEX idx_airtable_id ON customer_interactions(airtable_id);
CREATE INDEX idx_last_synced ON customer_interactions(last_synced);

-- 全文搜索索引 (GIN)
CREATE INDEX idx_update_content_fulltext ON customer_interactions USING GIN(to_tsvector('simple', COALESCE(update_content, '')));
CREATE INDEX idx_update_content_idioma_fulltext ON customer_interactions USING GIN(to_tsvector('simple', COALESCE(update_content_idioma, '')));

-- 同步歷史追蹤表
CREATE TABLE sync_history (
  id SERIAL PRIMARY KEY,
  sync_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  records_checked INT,
  records_inserted INT,
  records_updated INT,
  records_failed INT,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT
);

CREATE INDEX idx_sync_time ON sync_history(sync_time);
CREATE INDEX idx_sync_status ON sync_history(status);
