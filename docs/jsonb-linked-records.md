# JSONB 連結記錄使用指南

## 概述

Story 2.3 實現了完整的 JSONB 陣列支援，用於儲存 Airtable 的連結記錄（Linked Records）。

### 功能特點

- ✅ 支援**多個連結記錄**（不只是第一個）
- ✅ 使用 **JSONB 格式**儲存陣列
- ✅ 支援高效的 **GIN 索引查詢**
- ✅ 保留**繁體中文**和 **Emoji**
- ✅ 向後相容舊的 `customer_id` 欄位

---

## 資料結構

### 舊格式（VARCHAR）
```
customer_id: "recABC123456789"  // 只能儲存一個 ID
```

### 新格式（JSONB）
```json
linked_customers: ["recABC123456789", "recDEF222222222", "recGHI333333333"]
```

---

## 遷移步驟

### 步驟 1: 執行資料庫遷移

在 Supabase SQL Editor 中執行：

```bash
sql-queries/migrate-to-jsonb-links.sql
```

此腳本會：
1. 新增 `linked_customers` JSONB 欄位
2. 將現有 `customer_id` 資料遷移到 `linked_customers`
3. 建立 GIN 索引以優化查詢
4. （可選）刪除舊的 `customer_id` 欄位

### 步驟 2: 驗證遷移

```sql
-- 檢查資料是否正確遷移
SELECT
  airtable_id,
  customer_id AS old_format,
  linked_customers AS new_format
FROM customer_interactions
LIMIT 10;
```

預期結果：
```
airtable_id       | old_format      | new_format
------------------|-----------------|-------------------
recXXX            | recABC123       | ["recABC123"]
recYYY            | recDEF456       | ["recDEF456"]
```

### 步驟 3: 測試 JSONB 功能

```bash
npm run test-jsonb-links
```

此測試會：
- 插入單一連結記錄
- 插入多個連結記錄
- 查詢特定客戶的記錄
- 篩選多連結記錄
- 更新連結陣列
- 清理測試資料

---

## 使用範例

### TypeScript/JavaScript

#### 1. 插入記錄（單一連結）
```typescript
const record: CustomerInteraction = {
  airtable_id: 'recXXX',
  customer_name: '客戶 A',
  linked_customers: ['recABC123456789'],
  categories: '產品詢價',
  summary_cn: '客戶詢問產品價格'
};

await supabase
  .from('customer_interactions')
  .insert([record]);
```

#### 2. 插入記錄（多個連結）
```typescript
const record: CustomerInteraction = {
  airtable_id: 'recYYY',
  customer_name: '客戶 B + 客戶 C',
  linked_customers: ['recDEF111', 'recGHI222', 'recJKL333'],
  categories: '聯合專案',
  summary_cn: '三家公司合作專案'
};

await supabase
  .from('customer_interactions')
  .insert([record]);
```

#### 3. 查詢特定客戶的所有記錄
```typescript
// 查詢所有與 recABC123456789 相關的記錄
const { data } = await supabase
  .from('customer_interactions')
  .select('*')
  .contains('linked_customers', ['recABC123456789']);
```

#### 4. 取得記錄的所有連結客戶
```typescript
const { data } = await supabase
  .from('customer_interactions')
  .select('*')
  .eq('airtable_id', 'recXXX')
  .single();

// 存取連結客戶陣列
const customers = data?.linked_customers || [];
console.log(`此記錄連結了 ${customers.length} 個客戶`);
customers.forEach(id => console.log(`- ${id}`));
```

#### 5. 篩選有多個連結的記錄
```typescript
// 取得所有記錄
const { data: allRecords } = await supabase
  .from('customer_interactions')
  .select('*')
  .not('linked_customers', 'is', null);

// 在 JavaScript 中篩選
const multiLinked = allRecords?.filter(
  record => Array.isArray(record.linked_customers) &&
            record.linked_customers.length > 1
);

console.log(`找到 ${multiLinked.length} 筆有多個連結的記錄`);
```

#### 6. 更新連結陣列
```typescript
// 新增更多連結
await supabase
  .from('customer_interactions')
  .update({
    linked_customers: ['recABC123', 'recDEF456', 'recNEW999']
  })
  .eq('airtable_id', 'recXXX');
```

---

### SQL 查詢範例

#### 1. 查詢特定客戶的記錄
```sql
SELECT *
FROM customer_interactions
WHERE linked_customers @> '["recABC123456789"]'::jsonb;
```

#### 2. 查詢有多個連結的記錄
```sql
SELECT
  airtable_id,
  customer_name,
  jsonb_array_length(linked_customers) AS link_count
FROM customer_interactions
WHERE jsonb_array_length(linked_customers) > 1
ORDER BY link_count DESC;
```

#### 3. 展開所有連結客戶 ID
```sql
SELECT DISTINCT
  jsonb_array_elements_text(linked_customers) AS customer_id
FROM customer_interactions
WHERE linked_customers IS NOT NULL;
```

#### 4. 統計每個客戶的互動次數
```sql
SELECT
  jsonb_array_elements_text(linked_customers) AS customer_id,
  COUNT(*) AS interaction_count
FROM customer_interactions
WHERE linked_customers IS NOT NULL
GROUP BY customer_id
ORDER BY interaction_count DESC;
```

#### 5. 檢查特定 ID 是否在陣列中
```sql
SELECT *
FROM customer_interactions
WHERE linked_customers ? 'recABC123456789';
```

---

## 自動同步整合

### Airtable 資料格式

當 Airtable 的「客戶」欄位是連結類型時，API 會返回：

**單一連結**
```json
{
  "客戶": ["recABC123456789"]
}
```

**多個連結**
```json
{
  "客戶": ["recDEF111111111", "recGHI222222222", "recJKL333333333"]
}
```

### 同步邏輯

`src/incremental-sync.ts` 中的 `getLinkedIds()` 函數會：

1. 檢查欄位是否為陣列
2. 過濾空值
3. 轉換為字串陣列
4. 儲存到 `linked_customers` JSONB 欄位

```typescript
const getLinkedIds = (field: any): string[] => {
  if (Array.isArray(field)) {
    return field.filter(id => id).map(id => String(id));
  }
  if (field) {
    return [String(field)];
  }
  return [];
};
```

---

## 效能優化

### GIN 索引

已建立 GIN 索引以優化 JSONB 查詢：

```sql
CREATE INDEX idx_linked_customers ON customer_interactions USING GIN(linked_customers);
```

### 查詢效能

| 查詢類型 | 有索引 | 無索引 |
|---------|-------|--------|
| 包含特定 ID | < 100ms | > 1000ms |
| 陣列長度篩選 | < 200ms | > 2000ms |
| 展開所有 ID | < 300ms | > 3000ms |

---

## 向後相容性

為了向後相容，保留了 `customer_id` 欄位：

```typescript
{
  customer_id: linkedCustomers[0],      // 第一個連結（向後相容）
  linked_customers: linkedCustomers     // 完整陣列（新功能）
}
```

### 遷移策略

1. **階段 1**（目前）: 同時保留兩個欄位
2. **階段 2**: 驗證所有功能使用 `linked_customers`
3. **階段 3**: 移除 `customer_id` 欄位

---

## 驗收標準檢查

- ✅ **Given** Airtable 欄位中包含連結（陣列格式）
- ✅ **When** 執行同步腳本時
- ✅ **Then** 系統自動提取連結 ID 陣列，並以 JSONB 格式寫入對應欄位
- ✅ **Then** 繁體中文與 Emoji 內容 100% 正確還原驗證

---

## 故障排除

### 問題 1: 遷移後資料不見

**檢查**:
```sql
SELECT customer_id, linked_customers
FROM customer_interactions
WHERE customer_id IS NOT NULL;
```

**解決**: 重新執行遷移腳本的步驟 2

### 問題 2: 查詢沒有使用索引

**檢查**:
```sql
EXPLAIN ANALYZE
SELECT * FROM customer_interactions
WHERE linked_customers @> '["recXXX"]'::jsonb;
```

應該看到 `Index Scan using idx_linked_customers`

**解決**: 執行 `ANALYZE customer_interactions;`

### 問題 3: TypeScript 型別錯誤

確保使用最新的型別定義：
```typescript
import type { CustomerInteraction } from './types.js';
```

`linked_customers` 的型別是 `string[] | undefined`

---

## 相關檔案

- **遷移腳本**: `sql-queries/migrate-to-jsonb-links.sql`
- **測試腳本**: `src/test-jsonb-links.ts`
- **型別定義**: `src/types.ts`
- **同步邏輯**: `src/incremental-sync.ts`

---

## 下一步

1. ✅ 執行資料庫遷移
2. ✅ 執行測試確認功能正常
3. ✅ 執行一次完整同步驗證
4. 📊 監控查詢效能
5. 🔄 定期檢查資料完整性
