-- ================================================
-- AI 查詢優化索引
-- ================================================
-- 用途：優化 AI 工具查詢效能，確保複雜查詢 < 2 秒
-- 執行：在 Supabase SQL Editor 中執行此腳本
-- ================================================

-- 1. 時間欄位索引（降序，因為通常查詢最新的記錄）
CREATE INDEX IF NOT EXISTS idx_created_at ON customer_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_updated_at ON customer_interactions(updated_at DESC);

-- 2. 複合索引（客戶 + 時間）- 優化「查詢特定客戶的最近互動」
CREATE INDEX IF NOT EXISTS idx_customer_created ON customer_interactions(customer_name, created_at DESC);

-- 3. 複合索引（類別 + 時間）- 優化「查詢特定類別的最近互動」
CREATE INDEX IF NOT EXISTS idx_categories_created ON customer_interactions(categories, created_at DESC);

-- 4. 全文搜索索引（GIN）- 優化關鍵字搜尋
-- 注意：使用 'simple' 配置以支援繁體中文
CREATE INDEX IF NOT EXISTS idx_notes_fulltext ON customer_interactions
USING GIN(to_tsvector('simple', COALESCE(interaction_notes, '')));

CREATE INDEX IF NOT EXISTS idx_summary_cn_fulltext ON customer_interactions
USING GIN(to_tsvector('simple', COALESCE(summary_cn, '')));

CREATE INDEX IF NOT EXISTS idx_summary_en_fulltext ON customer_interactions
USING GIN(to_tsvector('simple', COALESCE(summary_en, '')));

-- 5. 部分索引（只索引有內容的記錄）- 節省空間並提升效能
CREATE INDEX IF NOT EXISTS idx_summary_en_not_null ON customer_interactions(summary_en)
WHERE summary_en IS NOT NULL AND summary_en != '';

CREATE INDEX IF NOT EXISTS idx_summary_cn_not_null ON customer_interactions(summary_cn)
WHERE summary_cn IS NOT NULL AND summary_cn != '';

CREATE INDEX IF NOT EXISTS idx_notes_not_null ON customer_interactions(interaction_notes)
WHERE interaction_notes IS NOT NULL AND interaction_notes != '';

-- ================================================
-- 查看所有索引
-- ================================================
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename = 'customer_interactions'
-- ORDER BY indexname;

-- ================================================
-- 查看索引大小
-- ================================================
-- SELECT
--   indexrelname AS index_name,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND relname = 'customer_interactions'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ================================================
-- 分析資料表以更新統計資訊（建議執行）
-- ================================================
ANALYZE customer_interactions;
