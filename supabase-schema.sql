-- ================================================
-- Airtable to Supabase Sync - Database Schema
-- ================================================

-- 客戶互動資料表
CREATE TABLE customer_interactions (
  id SERIAL PRIMARY KEY,
  airtable_id TEXT UNIQUE NOT NULL,       -- Airtable Record ID（唯一識別）
  customer_name TEXT NOT NULL,             -- 客戶名稱（對應 Airtable「客戶」）
  topic TEXT NOT NULL,                     -- 類別/主題（對應 Airtable「類別」）
  summary_en TEXT,                         -- 英文主題（對應 Airtable「簡述(en)」）
  summary_cn TEXT,                         -- 中文主題（對應 Airtable「簡述(cn)」）
  interaction_notes TEXT,                  -- 更新內容（對應 Airtable「更新內容」，Markdown 格式）
  created_at TIMESTAMP DEFAULT NOW(),      -- 建立時間
  updated_at TIMESTAMP DEFAULT NOW(),      -- 更新時間
  last_synced TIMESTAMP DEFAULT NOW()      -- 最後同步時間
);

-- 索引（優化 AI 查詢效能）
CREATE INDEX idx_customer_name ON customer_interactions(customer_name);
CREATE INDEX idx_topic ON customer_interactions(topic);
CREATE INDEX idx_summary_en ON customer_interactions(summary_en);
CREATE INDEX idx_summary_cn ON customer_interactions(summary_cn);
CREATE INDEX idx_airtable_id ON customer_interactions(airtable_id);
CREATE INDEX idx_last_synced ON customer_interactions(last_synced);

-- 同步歷史追蹤表（監控用）
CREATE TABLE sync_history (
  id SERIAL PRIMARY KEY,
  sync_time TIMESTAMP DEFAULT NOW(),
  records_checked INT,                     -- 檢查的記錄數
  records_inserted INT,                    -- 新增的記錄數
  records_updated INT,                     -- 更新的記錄數
  records_failed INT,                      -- 失敗的記錄數
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT                       -- 錯誤訊息（如果失敗）
);

-- 為 sync_history 建立索引
CREATE INDEX idx_sync_time ON sync_history(sync_time);
CREATE INDEX idx_sync_status ON sync_history(status);

-- ================================================
-- 欄位對應說明
-- ================================================
--
-- | Airtable 欄位 | Supabase 欄位      | 資料類型 |
-- |--------------|-------------------|---------|
-- | Record ID    | airtable_id       | TEXT    |
-- | 客戶          | customer_name     | TEXT    |
-- | 類別          | topic             | TEXT    |
-- | 簡述(en)      | summary_en        | TEXT    |
-- | 簡述(cn)      | summary_cn        | TEXT    |
-- | 更新內容      | interaction_notes | TEXT    |
--
-- ================================================
