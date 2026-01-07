-- ================================================
-- AI 查詢效能測試
-- ================================================
-- 用途：測試各種 AI 查詢場景的效能
-- 執行：在 Supabase SQL Editor 中逐條執行
-- 目標：所有查詢應在 < 2 秒內完成
-- ================================================

-- 查看資料表統計資訊
SELECT
  schemaname,
  relname,
  n_tup_ins AS "插入筆數",
  n_tup_upd AS "更新筆數",
  n_tup_del AS "刪除筆數",
  n_live_tup AS "當前筆數"
FROM pg_stat_user_tables
WHERE relname = 'customer_interactions';

-- ================================================
-- Test 1: 客戶名稱搜尋（使用索引）
-- ================================================
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
WHERE customer_name ILIKE '%公司%'
ORDER BY created_at DESC
LIMIT 100;

-- ================================================
-- Test 2: 類別篩選（使用索引）
-- ================================================
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
WHERE categories ILIKE '%詢價%'
ORDER BY created_at DESC
LIMIT 100;

-- ================================================
-- Test 3: 時間範圍查詢（最近 30 天）
-- ================================================
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- ================================================
-- Test 4: 全文搜索（使用 GIN 索引）
-- ================================================
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
WHERE to_tsvector('simple', COALESCE(interaction_notes, '')) @@ to_tsquery('simple', '報價')
LIMIT 100;

-- ================================================
-- Test 5: 複合條件查詢（客戶 + 時間）
-- ================================================
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
WHERE customer_name ILIKE '%公司%'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- ================================================
-- Test 6: 聚合查詢（統計每個客戶的互動次數）
-- ================================================
EXPLAIN ANALYZE
SELECT
  customer_name,
  COUNT(*) as interaction_count,
  MAX(created_at) as last_interaction
FROM customer_interactions
GROUP BY customer_name
ORDER BY interaction_count DESC
LIMIT 50;

-- ================================================
-- Test 7: 最近同步記錄
-- ================================================
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
ORDER BY last_synced DESC
LIMIT 100;

-- ================================================
-- Test 8: 中文摘要搜尋
-- ================================================
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
WHERE summary_cn ILIKE '%產品%'
ORDER BY created_at DESC
LIMIT 100;

-- ================================================
-- Test 9: 多欄位搜尋（OR 條件）
-- ================================================
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
WHERE interaction_notes ILIKE '%付款%'
   OR summary_cn ILIKE '%付款%'
   OR summary_en ILIKE '%payment%'
ORDER BY created_at DESC
LIMIT 100;

-- ================================================
-- Test 10: 複雜聚合（按類別和月份統計）
-- ================================================
EXPLAIN ANALYZE
SELECT
  categories,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as count
FROM customer_interactions
WHERE created_at > NOW() - INTERVAL '6 months'
GROUP BY categories, DATE_TRUNC('month', created_at)
ORDER BY month DESC, count DESC;

-- ================================================
-- 查看查詢效能統計
-- ================================================
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%customer_interactions%'
ORDER BY mean_time DESC
LIMIT 10;

-- 注意：pg_stat_statements 需要在 Supabase 中啟用
-- 如果上面的查詢失敗，可能需要執行：
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ================================================
-- 查看索引使用情況
-- ================================================
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS "索引掃描次數",
  idx_tup_read AS "透過索引讀取的元組數",
  idx_tup_fetch AS "透過索引獲取的元組數"
FROM pg_stat_user_indexes
WHERE tablename = 'customer_interactions'
ORDER BY idx_scan DESC;

-- ================================================
-- 查看資料表大小
-- ================================================
SELECT
  pg_size_pretty(pg_total_relation_size('customer_interactions')) AS "總大小",
  pg_size_pretty(pg_relation_size('customer_interactions')) AS "資料大小",
  pg_size_pretty(pg_total_relation_size('customer_interactions') - pg_relation_size('customer_interactions')) AS "索引大小";

-- ================================================
-- 查看所有索引及其大小
-- ================================================
SELECT
  indexname AS "索引名稱",
  pg_size_pretty(pg_relation_size(indexrelid)) AS "大小"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname = 'customer_interactions'
ORDER BY pg_relation_size(indexrelid) DESC;
