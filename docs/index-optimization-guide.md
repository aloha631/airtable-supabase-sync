# 索引優化指南

## 目標

確保 AI 工具查詢效能符合要求：
- **目標**：複雜 SQL 查詢回應時間 < 2 秒（95th percentile）
- **資料量**：10,000 筆記錄
- **環境**：Supabase Free Tier

---

## 步驟 1：建立優化索引

### 方法 A：使用 Supabase Dashboard（推薦）

1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇你的專案
3. 前往 **SQL Editor**
4. 複製並執行 `sql-queries/optimize-indexes.sql` 的內容
5. 等待索引建立完成（通常幾秒鐘）

### 方法 B：使用 psql 命令列

```bash
# 連接到 Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 執行索引腳本
\i sql-queries/optimize-indexes.sql
```

---

## 步驟 2：驗證索引建立

在 Supabase SQL Editor 中執行：

```sql
-- 查看所有索引
SELECT
  indexname AS "索引名稱",
  indexdef AS "索引定義"
FROM pg_indexes
WHERE tablename = 'customer_interactions'
ORDER BY indexname;
```

### 預期結果

應該看到以下索引：

**基本索引**（B-tree）
- `idx_airtable_id` - airtable_id
- `idx_customer_name` - customer_name
- `idx_categories` - categories
- `idx_summary_en` - summary_en
- `idx_summary_cn` - summary_cn
- `idx_last_synced` - last_synced

**新增優化索引**
- `idx_created_at` - created_at DESC
- `idx_updated_at` - updated_at DESC
- `idx_customer_created` - (customer_name, created_at DESC)
- `idx_categories_created` - (categories, created_at DESC)

**全文搜索索引**（GIN）
- `idx_notes_fulltext` - to_tsvector('simple', interaction_notes)
- `idx_summary_cn_fulltext` - to_tsvector('simple', summary_cn)
- `idx_summary_en_fulltext` - to_tsvector('simple', summary_en)

**部分索引**
- `idx_summary_en_not_null` - summary_en WHERE NOT NULL
- `idx_summary_cn_not_null` - summary_cn WHERE NOT NULL
- `idx_notes_not_null` - interaction_notes WHERE NOT NULL

---

## 步驟 3：執行效能測試

### 方法 A：使用 Node.js 測試腳本（推薦）

```bash
npm run test-query-performance
```

此腳本會：
1. 執行 8 種典型 AI 查詢
2. 測量每個查詢的執行時間
3. 計算平均值和 95th percentile
4. 判斷是否符合 < 2 秒的目標

### 方法 B：手動在 SQL Editor 測試

在 Supabase SQL Editor 中執行 `sql-queries/test-queries.sql` 中的查詢。

每個查詢前面有 `EXPLAIN ANALYZE`，會顯示：
- **Execution Time**: 實際執行時間
- **Planning Time**: 查詢規劃時間
- **Index Scan**: 是否使用索引

---

## 步驟 4：分析查詢計劃

### 使用 EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT *
FROM customer_interactions
WHERE customer_name ILIKE '%公司%'
ORDER BY created_at DESC
LIMIT 100;
```

### 解讀結果

**好的跡象** ✅
- `Index Scan` 或 `Index Only Scan` - 使用索引
- `Bitmap Index Scan` - 使用多個索引
- Execution Time < 2000ms

**壞的跡象** ❌
- `Seq Scan` - 全表掃描（沒使用索引）
- `Sort` 操作佔用大量時間
- Execution Time > 2000ms

---

## 步驟 5：優化建議

### 如果查詢速度仍慢

1. **檢查資料量**
   ```sql
   SELECT COUNT(*) FROM customer_interactions;
   ```

2. **更新統計資訊**
   ```sql
   ANALYZE customer_interactions;
   ```

3. **檢查索引使用情況**
   ```sql
   SELECT
     indexname,
     idx_scan AS "掃描次數"
   FROM pg_stat_user_indexes
   WHERE tablename = 'customer_interactions'
   ORDER BY idx_scan DESC;
   ```

4. **考慮增加計算資源**
   - Supabase Free Tier 有限制
   - 考慮升級到 Pro 方案以獲得更好效能

---

## 常見查詢模式優化

### 1. 客戶名稱搜尋

**慢查詢**（全表掃描）
```sql
SELECT * FROM customer_interactions
WHERE LOWER(customer_name) LIKE '%公司%';
```

**快查詢**（使用索引）
```sql
SELECT * FROM customer_interactions
WHERE customer_name ILIKE '%公司%'
ORDER BY created_at DESC
LIMIT 100;
```

### 2. 全文搜索

**慢查詢**
```sql
SELECT * FROM customer_interactions
WHERE interaction_notes LIKE '%關鍵字%';
```

**快查詢**（使用 GIN 索引）
```sql
SELECT * FROM customer_interactions
WHERE to_tsvector('simple', interaction_notes) @@ to_tsquery('simple', '關鍵字')
LIMIT 100;
```

### 3. 時間範圍查詢

**優化**：使用 `created_at` 索引
```sql
SELECT * FROM customer_interactions
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

---

## 監控與維護

### 定期檢查索引健康度

```sql
-- 查看索引大小
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'customer_interactions'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 定期更新統計資訊

建議每週執行一次：

```sql
ANALYZE customer_interactions;
```

---

## 相關文件

- **AI 查詢場景分析**: `docs/ai-query-scenarios.md`
- **優化索引 SQL**: `sql-queries/optimize-indexes.sql`
- **測試查詢 SQL**: `sql-queries/test-queries.sql`
- **效能測試腳本**: `src/test-query-performance.ts`

---

## 故障排除

### 問題：索引沒有被使用

**可能原因**：
1. 統計資訊過期 → 執行 `ANALYZE`
2. 資料量太小，全表掃描更快
3. 查詢條件包含函數（如 `LOWER()`）

### 問題：查詢仍然很慢

**檢查清單**：
1. ✅ 索引已建立
2. ✅ 統計資訊已更新
3. ✅ 查詢使用了索引（用 EXPLAIN ANALYZE 檢查）
4. ❓ 資料量是否超出預期
5. ❓ 網路延遲問題
6. ❓ Supabase 資源限制

---

## 效能基準

在 Supabase Free Tier 上，10,000 筆記錄的預期效能：

| 查詢類型 | 預期時間 |
|---------|---------|
| 索引查詢（單欄位） | < 100ms |
| 複合索引查詢 | < 200ms |
| 全文搜索 | < 500ms |
| 聚合查詢 | < 1000ms |
| 複雜多條件查詢 | < 2000ms |
