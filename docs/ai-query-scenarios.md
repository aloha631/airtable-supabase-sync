# AI 查詢場景分析

## 典型 AI 查詢場景

### 1. 客戶互動歷史查詢
**場景**：「查詢所有與客戶 ABC 的互動記錄」
```sql
SELECT * FROM customer_interactions
WHERE customer_name LIKE '%ABC%'
ORDER BY created_at DESC;
```
**索引需求**：`customer_name` 欄位（已有 idx_customer_name）

---

### 2. 主題/類別篩選
**場景**：「找出所有關於『技術支援』的互動記錄」
```sql
SELECT * FROM customer_interactions
WHERE categories LIKE '%技術支援%'
ORDER BY created_at DESC;
```
**索引需求**：`categories` 欄位（已有 idx_categories）

---

### 3. 全文搜索（關鍵字搜尋）
**場景**：「搜尋所有提到『付款問題』的記錄」
```sql
SELECT * FROM customer_interactions
WHERE interaction_notes ILIKE '%付款問題%'
   OR summary_cn ILIKE '%付款問題%'
   OR summary_en ILIKE '%付款問題%'
ORDER BY created_at DESC;
```
**索引需求**：PostgreSQL 全文搜索索引（GIN 索引）

---

### 4. 時間範圍查詢
**場景**：「查詢最近 30 天的所有互動記錄」
```sql
SELECT * FROM customer_interactions
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```
**索引需求**：`created_at` 欄位索引

---

### 5. 複合條件查詢
**場景**：「找出客戶 XYZ 在最近 7 天關於『產品詢價』的記錄」
```sql
SELECT * FROM customer_interactions
WHERE customer_name = 'XYZ'
  AND categories LIKE '%產品詢價%'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```
**索引需求**：複合索引 `(customer_name, created_at)`

---

### 6. 聚合統計查詢
**場景**：「統計每個客戶的互動次數」
```sql
SELECT customer_name, COUNT(*) as interaction_count
FROM customer_interactions
GROUP BY customer_name
ORDER BY interaction_count DESC;
```
**索引需求**：`customer_name` 欄位（已有 idx_customer_name）

---

### 7. 最近更新記錄
**場景**：「查看最近同步的記錄」
```sql
SELECT * FROM customer_interactions
ORDER BY last_synced DESC
LIMIT 100;
```
**索引需求**：`last_synced` 欄位（已有 idx_last_synced）

---

## 索引優化建議

### 現有索引（已實現）
✅ `idx_customer_name` - B-tree 索引
✅ `idx_categories` - B-tree 索引
✅ `idx_summary_en` - B-tree 索引
✅ `idx_summary_cn` - B-tree 索引
✅ `idx_airtable_id` - B-tree 索引
✅ `idx_last_synced` - B-tree 索引

### 建議新增索引

#### 1. 時間欄位索引
```sql
CREATE INDEX idx_created_at ON customer_interactions(created_at DESC);
CREATE INDEX idx_updated_at ON customer_interactions(updated_at DESC);
```

#### 2. 複合索引（客戶 + 時間）
```sql
CREATE INDEX idx_customer_created ON customer_interactions(customer_name, created_at DESC);
```

#### 3. 全文搜索索引（GIN）
```sql
-- 為 interaction_notes 建立全文搜索索引
CREATE INDEX idx_notes_fulltext ON customer_interactions
USING GIN(to_tsvector('simple', interaction_notes));

-- 為 summary_cn 建立全文搜索索引
CREATE INDEX idx_summary_cn_fulltext ON customer_interactions
USING GIN(to_tsvector('simple', summary_cn));
```

#### 4. 部分索引（只索引有內容的記錄）
```sql
-- 只索引有 summary_en 的記錄
CREATE INDEX idx_summary_en_not_null ON customer_interactions(summary_en)
WHERE summary_en IS NOT NULL AND summary_en != '';
```

---

## 效能目標

根據 Story 3.3 驗收標準：
- **目標**：複雜 SQL 查詢回應時間 < 2 秒（95th percentile）
- **資料量**：10,000 筆記錄
- **測試環境**：Supabase Free Tier

---

## 查詢最佳化建議

1. **使用 EXPLAIN ANALYZE** 分析查詢計劃
2. **避免 SELECT *** - 只選擇需要的欄位
3. **使用 LIMIT** - 限制返回結果數量
4. **利用索引** - WHERE 條件使用索引欄位
5. **避免函數包裝索引欄位** - 例如 `LOWER(customer_name)` 會無法使用索引
