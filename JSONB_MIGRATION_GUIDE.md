# JSONB 連結記錄遷移指南

**Story 2.3 完整實現** - 支援 Airtable 連結欄位的 JSONB 陣列儲存

---

## 🎯 目標

將 `customer_id` 從單一字串格式升級為 `linked_customers` JSONB 陣列格式，支援多個連結記錄。

### 升級前後對比

| 項目 | 舊版本 | 新版本 |
|-----|--------|--------|
| 欄位名稱 | `customer_id` | `linked_customers` |
| 資料類型 | `VARCHAR(17)` | `JSONB` |
| 儲存格式 | `"recABC123"` | `["recABC123", "recDEF456"]` |
| 支援多個連結 | ❌ 否（只有第一個） | ✅ 是 |
| 索引類型 | B-tree | GIN（更快） |

---

## ⚠️ 重要提醒

**在執行任何操作前，請先備份資料庫！**

---

## 📋 遷移檢查清單

### 步驟 1: 執行資料庫遷移 ⚡

1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇你的專案
3. 前往 **SQL Editor**
4. 複製 `sql-queries/migrate-to-jsonb-links.sql` 的內容
5. 執行腳本

**預期結果**:
```
✅ 新增 linked_customers 欄位
✅ 資料從 customer_id 遷移到 linked_customers
✅ 建立 GIN 索引
```

### 步驟 2: 驗證遷移 ✅

在 SQL Editor 中執行：

```sql
SELECT
  airtable_id,
  customer_id AS "舊格式",
  linked_customers AS "新格式"
FROM customer_interactions
LIMIT 10;
```

**檢查要點**:
- [ ] `linked_customers` 欄位已建立
- [ ] 資料已從 `customer_id` 遷移過來
- [ ] 格式為 JSON 陣列（例如：`["recXXX"]`）

### 步驟 3: 測試 JSONB 功能 🧪

```bash
npm run test-jsonb-links
```

**預期輸出**:
```
✅ Insert single linked customer
✅ Insert multiple linked customers
✅ Query by specific linked customer
✅ Filter records with multiple links
✅ Update linked customers array
✅ Clean up test data
```

### 步驟 4: 執行完整同步測試 🔄

```bash
npm run incremental-sync
```

檢查同步後的資料：

```sql
SELECT
  airtable_id,
  customer_name,
  linked_customers,
  jsonb_array_length(linked_customers) AS link_count
FROM customer_interactions
ORDER BY last_synced DESC
LIMIT 10;
```

### 步驟 5: 移除舊欄位（可選）🗑️

**⚠️ 警告**: 只有在確認一切正常後才執行此步驟！

```sql
-- 刪除舊的 customer_id 欄位
ALTER TABLE customer_interactions DROP COLUMN customer_id;

-- 刪除舊索引
DROP INDEX IF EXISTS idx_customer_id;
```

---

## 📊 功能測試

### 測試案例 1: 單一連結

**Airtable 資料**:
```json
{
  "客戶": ["recABC123456789"]
}
```

**Supabase 儲存**:
```json
{
  "linked_customers": ["recABC123456789"]
}
```

### 測試案例 2: 多個連結

**Airtable 資料**:
```json
{
  "客戶": ["recDEF111111111", "recGHI222222222", "recJKL333333333"]
}
```

**Supabase 儲存**:
```json
{
  "linked_customers": ["recDEF111111111", "recGHI222222222", "recJKL333333333"]
}
```

### 測試案例 3: 繁體中文 + Emoji

**Airtable 資料**:
```json
{
  "客戶": ["rec台灣公司123"],
  "簡述(cn)": "重要客戶 🎉 優先處理"
}
```

**驗證**: 繁體中文和 Emoji 應該完整保留 ✅

---

## 🔍 常用查詢範例

### 1. 查詢特定客戶的所有互動

```sql
-- 查詢與 recABC123456789 相關的所有記錄
SELECT *
FROM customer_interactions
WHERE linked_customers @> '["recABC123456789"]'::jsonb;
```

### 2. 找出有多個連結的記錄

```sql
-- 列出所有關聯多個客戶的記錄
SELECT
  airtable_id,
  customer_name,
  jsonb_array_length(linked_customers) AS customer_count
FROM customer_interactions
WHERE jsonb_array_length(linked_customers) > 1
ORDER BY customer_count DESC;
```

### 3. 統計每個客戶的互動次數

```sql
-- 展開所有連結並統計
SELECT
  jsonb_array_elements_text(linked_customers) AS customer_id,
  COUNT(*) AS interaction_count
FROM customer_interactions
WHERE linked_customers IS NOT NULL
GROUP BY customer_id
ORDER BY interaction_count DESC
LIMIT 20;
```

### 4. TypeScript/Supabase 查詢

```typescript
// 查詢特定客戶
const { data } = await supabase
  .from('customer_interactions')
  .select('*')
  .contains('linked_customers', ['recABC123456789']);

// 檢查連結數量
if (data) {
  data.forEach(record => {
    const linkCount = record.linked_customers?.length || 0;
    console.log(`${record.customer_name}: ${linkCount} 個連結`);
  });
}
```

---

## 📈 效能驗證

### 執行效能測試

```bash
npm run test-query-performance
```

**JSONB 查詢效能目標**:
- 包含查詢 (contains): < 200ms
- 陣列長度篩選: < 300ms
- 展開查詢: < 500ms

### 檢查索引使用

```sql
EXPLAIN ANALYZE
SELECT * FROM customer_interactions
WHERE linked_customers @> '["recABC123"]'::jsonb;
```

應該看到：
```
Index Scan using idx_linked_customers on customer_interactions
```

---

## 🚨 故障排除

### 問題 1: 遷移腳本執行失敗

**錯誤**: `column "linked_customers" already exists`

**解決**:
```sql
-- 檢查欄位是否已存在
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customer_interactions'
  AND column_name = 'linked_customers';
```

如果已存在，跳過步驟 1，直接驗證。

### 問題 2: 資料沒有遷移

**檢查**:
```sql
SELECT COUNT(*) FROM customer_interactions
WHERE customer_id IS NOT NULL
  AND linked_customers IS NULL;
```

如果 > 0，重新執行遷移腳本的步驟 2。

### 問題 3: 查詢很慢

**檢查索引**:
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'customer_interactions'
  AND indexname = 'idx_linked_customers';
```

如果不存在：
```sql
CREATE INDEX idx_linked_customers ON customer_interactions USING GIN(linked_customers);
```

### 問題 4: TypeScript 型別錯誤

確保重新編譯：
```bash
npm run build
```

檢查型別定義：
```typescript
linked_customers?: string[];  // 應該是 string[] 陣列
```

---

## 📚 相關文件

- **詳細使用指南**: `docs/jsonb-linked-records.md`
- **遷移 SQL 腳本**: `sql-queries/migrate-to-jsonb-links.sql`
- **測試腳本**: `src/test-jsonb-links.ts`
- **型別定義**: `src/types.ts`

---

## ✅ 驗收標準

- ✅ Airtable 連結欄位（陣列格式）正確解析
- ✅ 以 JSONB 格式儲存到 `linked_customers` 欄位
- ✅ 資料結構清晰且具備擴展性
- ✅ 繁體中文與 Emoji 100% 正確還原
- ✅ 查詢效能符合要求（< 2 秒）

---

## 🎉 完成後

恭喜！你已經成功實現 Story 2.3，現在系統支援：

- 📊 多個 Airtable 連結記錄
- 🚀 高效的 JSONB 查詢
- 🔍 靈活的資料分析
- 🌏 完整的繁體中文支援

### 下一步

1. 監控同步日誌確認資料正確性
2. 使用 AI 工具分析多客戶互動模式
3. 定期執行效能測試
4. 根據需求擴展其他連結欄位

---

**需要幫助？** 查看 `docs/jsonb-linked-records.md` 獲取詳細使用說明。
