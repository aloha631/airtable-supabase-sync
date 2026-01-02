# Airtable ↔ Supabase 更新策略說明

## 📋 目錄
1. [核心原則](#核心原則)
2. [UPSERT 策略](#upsert-策略)
3. [時間戳處理](#時間戳處理)
4. [增量同步邏輯](#增量同步邏輯)
5. [邊緣情況處理](#邊緣情況處理)

---

## 🎯 核心原則

### 1. 單向同步
```
Airtable (主資料源) ──→ Supabase (唯讀副本)
```
- **Airtable** = 真實資料來源（Source of Truth）
- **Supabase** = 資料副本，供 AI 查詢使用
- **不會**從 Supabase 寫回 Airtable

### 2. UPSERT 策略（插入或更新）

**行為：**
- 如果記錄**不存在** → **INSERT**（新增）
- 如果記錄**已存在** → **UPDATE**（更新）
- **絕不刪除** Supabase 中的記錄

**識別唯一記錄：**
```sql
-- 使用 airtable_id 作為唯一鍵
ON CONFLICT (airtable_id) DO UPDATE
```

---

## 🔄 UPSERT 策略詳解

### 程式碼實作

```typescript
// src/supabase-client.ts (line 28-32)
const { error } = await supabase
  .from('customer_interactions')
  .upsert(batch, {
    onConflict: 'airtable_id',  // ← 唯一鍵
  });
```

### 行為示例

#### 情境 1: 新記錄（INSERT）

**Airtable 記錄：**
```json
{
  "id": "recNEW12345",
  "fields": {
    "客戶名稱+國家": ["新客戶(日本)"],
    "類別": ["(2.)Machine Quote)"],
    "簡述(en)": "New quotation"
  }
}
```

**Supabase 操作：**
```sql
INSERT INTO customer_interactions (
  airtable_id,
  customer_name,
  categories,
  summary_en,
  created_at,
  updated_at,
  last_synced
) VALUES (
  'recNEW12345',
  '新客戶(日本)',
  '(2.)Machine Quote)',
  'New quotation',
  NOW(),      -- 建立時間
  NOW(),      -- 更新時間
  NOW()       -- 同步時間
);
```

#### 情境 2: 已存在記錄（UPDATE）

**Airtable 記錄（已修改）：**
```json
{
  "id": "rec0ADPnisCipypwI",  // ← 已存在
  "fields": {
    "客戶名稱+國家": ["Sappe(泰國)"],
    "類別": ["(2.)Machine Quote)"],
    "簡述(en)": "SC-100 Quotation (Updated)",  // ← 修改
    "更新內容": "New update details"            // ← 新增
  }
}
```

**Supabase 操作：**
```sql
UPDATE customer_interactions
SET
  customer_name = 'Sappe(泰國)',       -- 保持不變
  categories = '(2.)Machine Quote)',    -- 保持不變
  summary_en = 'SC-100 Quotation (Updated)',  -- ✅ 更新
  interaction_notes = 'New update details',    -- ✅ 更新
  updated_at = NOW(),                   -- ✅ 更新時間戳
  last_synced = NOW()                   -- ✅ 更新同步時間
WHERE airtable_id = 'rec0ADPnisCipypwI';
```

---

## 🕐 時間戳處理

### Supabase 自動維護的時間戳

| 欄位 | 用途 | 更新時機 |
|-----|------|---------|
| `created_at` | 記錄建立時間 | 僅在 **INSERT** 時設定 |
| `updated_at` | 記錄更新時間 | 每次 **UPDATE** 時更新 |
| `last_synced` | 最後同步時間 | 每次**同步**時更新 |

### Airtable 時間欄位（用於判斷是否需要同步）

| 欄位 | 格式 | 來源 |
|-----|------|------|
| `最後更新` | `YYYY-MM-DD` | 手動維護的欄位 |
| `createdTime` | ISO 8601 | Airtable metadata（自動） |

---

## ⚡ 增量同步邏輯

### 完整流程圖

```
開始增量同步
    ↓
查詢 Supabase 最新的 last_synced
    ↓
last_synced = 2026-01-01 22:19:36
    ↓
從 Airtable 取得所有 592 筆記錄
    ↓
過濾記錄：
  ┌─────────────────────────────────┐
  │ IF 最後更新 > last_synced       │ ✅ 需要同步
  │ ELSE IF createdTime > last_synced│ ✅ 需要同步（新記錄）
  │ ELSE                             │ ❌ 跳過（已是最新）
  └─────────────────────────────────┘
    ↓
過濾結果：例如 15 筆需要同步
    ↓
UPSERT 這 15 筆到 Supabase
    ↓
完成
```

### 判斷邏輯（程式碼）

```typescript
// src/incremental-sync.ts (line 106-128)
recordsToSync = allRecords.filter(record => {
  // 1️⃣ 優先：檢查「最後更新」欄位
  const lastUpdated = record.fields['最後更新'];
  if (lastUpdated) {
    const updateDate = new Date(lastUpdated);
    if (updateDate > lastSyncTime) {
      return true;  // ✅ 有更新
    }
  }

  // 2️⃣ 備選：檢查 createdTime（新記錄）
  const createdTime = record._rawJson?.createdTime;
  if (createdTime) {
    const createdDate = new Date(createdTime);
    if (createdDate > lastSyncTime) {
      return true;  // ✅ 新建立
    }
  }

  return false;  // ❌ 不需要同步
});
```

---

## 🎯 實際案例

### 案例 1: 完全無變更

**狀態：**
- Last Sync: `2026-01-01 22:19:36`
- Airtable 592 筆記錄都沒有在此之後更新

**結果：**
```
Fetched 592 total records from Airtable
Filtered to 0 modified/new records
✅ No changes detected. Database is up to date!
```

**執行時間：** ~8 秒（只讀取，無寫入）

---

### 案例 2: 有 10 筆更新

**狀態：**
- Last Sync: `2026-01-01 22:19:36`
- 10 筆記錄的「最後更新」= `2026-01-02`（今天）

**過程：**
```
1. Airtable → 取得 592 筆
2. 過濾 → 10 筆需要同步
3. Supabase UPSERT:
   - 檢查 airtable_id
   - 10 筆都已存在 → UPDATE
   - 更新所有欄位
   - 更新 updated_at, last_synced
```

**結果：**
```
Modified/New records: 10
Successfully synced: 10
✅ Database is now up to date!
```

**執行時間：** ~10 秒

---

### 案例 3: 有 2 筆新記錄

**狀態：**
- Last Sync: `2026-01-01 22:19:36`
- Airtable 新增 2 筆記錄（今天建立）

**過程：**
```
1. Airtable → 取得 594 筆（592 + 2）
2. 過濾 → 2 筆 createdTime > lastSyncTime
3. Supabase UPSERT:
   - 檢查 airtable_id
   - 2 筆不存在 → INSERT
   - 設定 created_at, updated_at, last_synced
```

**結果：**
```
Records in Supabase: 585 → 587
```

---

## 🛡️ 邊緣情況處理

### 1. Airtable 記錄被刪除

**行為：**
- Supabase **不會刪除**對應記錄
- 記錄永久保留在 Supabase

**原因：**
- 保持資料完整性
- 歷史記錄追蹤
- AI 分析可能需要歷史資料

**如需刪除：**
手動在 Supabase 執行：
```sql
DELETE FROM customer_interactions
WHERE airtable_id = 'rec123456';
```

---

### 2. 同一時間多次同步

**情境：** 兩個程序同時執行增量同步

**行為：**
- ✅ 安全 - UPSERT 是冪等操作
- 兩次都會成功
- 最終結果一致

**PostgreSQL UPSERT 保證：**
```sql
-- 原子操作，避免競爭條件
INSERT ... ON CONFLICT DO UPDATE
```

---

### 3. Airtable「最後更新」欄位未維護

**情境：** 記錄有修改，但「最後更新」欄位沒更新

**行為：**
- ❌ **不會被偵測**為變更
- 增量同步會跳過此記錄

**解決方案：**
1. **推薦**：在 Airtable 使用 "Last Modified Time" 欄位類型（自動更新）
2. 定期執行完整同步（每週或每月）
3. 手動更新「最後更新」欄位

---

### 4. 時區問題

**Airtable 時間：**
- `createdTime`: UTC
- `最後更新`: 使用者輸入（無時區）

**Supabase 時間：**
- 所有 timestamp 欄位都是 UTC

**處理：**
```typescript
// 統一轉換為 Date 物件進行比較
const updateDate = new Date(lastUpdated);  // 解析為本地時區
const lastSyncTime = new Date(lastSynced); // UTC
```

---

### 5. 空值與 NULL 處理

**Airtable 空值：**
- 欄位不存在 → `undefined`
- 欄位為空陣列 → `[]`
- 欄位為空字串 → `""`

**轉換規則：**
```typescript
// getValue() 函數處理
const getValue = (field: any): string => {
  if (Array.isArray(field)) {
    return field.length > 0 ? String(field[0]) : '';  // 空陣列 → ''
  }
  return field ? String(field) : '';  // undefined/null → ''
};

// 在 CustomerInteraction 中
categories: getValue(fields['類別']) || undefined  // '' → undefined → NULL
```

**Supabase 儲存：**
- 空字串 `""` → `NULL`（對於 optional 欄位）
- 保持資料庫正規化

---

## 📊 更新原則總結表

| 情境 | Airtable 狀態 | Supabase 操作 | 結果 |
|-----|-------------|--------------|-----|
| 新記錄 | 新建立 | INSERT | 新增一筆 |
| 已存在記錄，有更新 | 「最後更新」有變 | UPDATE | 覆蓋所有欄位 |
| 已存在記錄，無更新 | 無變化 | 無操作 | 跳過 |
| 記錄被刪除 | 已刪除 | 無操作 | Supabase 保留 |
| 欄位變為空 | 欄位清空 | UPDATE 為 NULL | 欄位清空 |
| 完整同步 | 全部 592 筆 | UPSERT ALL | 全部更新 |
| 增量同步（無變更） | 無變更 | 無操作 | 0 筆寫入 |

---

## 🎯 最佳實踐建議

### 1. Airtable 欄位設定

**推薦使用自動更新欄位：**
```
欄位名稱: 最後修改時間
欄位類型: Last Modified Time
追蹤欄位: 所有欄位（或指定重要欄位）
```

這樣每次修改記錄時，時間戳會自動更新。

### 2. 同步頻率建議

| 使用情境 | 推薦頻率 | 命令 |
|---------|---------|------|
| 開發/測試 | 手動執行 | `npm run incremental-sync` |
| 日常生產 | 每小時 | Cron: `0 * * * *` |
| 低頻更新 | 每天一次 | Cron: `0 9 * * *` |
| 資料驗證 | 每週完整同步 | `npm run airtable-export && npm run csv-import` |

### 3. 監控建議

**定期檢查：**
```bash
# 查看最後同步時間
SELECT MAX(last_synced) FROM customer_interactions;

# 查看最近更新的記錄
SELECT airtable_id, customer_name, updated_at, last_synced
FROM customer_interactions
ORDER BY updated_at DESC
LIMIT 10;

# 找出可能不同步的記錄（updated_at >> last_synced）
SELECT COUNT(*)
FROM customer_interactions
WHERE updated_at > last_synced + INTERVAL '1 day';
```

---

## 🔧 進階：自定義同步邏輯

### 如果需要雙向同步

目前**不支援**從 Supabase 寫回 Airtable，但如果需要：

**方案 1: 使用 Airtable API 寫回**
```typescript
// 偵測 Supabase 變更
// 使用 Airtable API 更新記錄
await base(tableId).update(recordId, fields);
```

**方案 2: 使用 Webhook**
```typescript
// Supabase Database Webhooks
// 觸發時呼叫 Airtable API
```

**注意：** 需處理循環同步問題！

---

## ❓ 常見問題

### Q1: 為什麼不使用 Airtable 的 webhook？
A: Airtable webhook 需要付費方案，目前使用輪詢（polling）方式較經濟實惠。

### Q2: 如果 Airtable 記錄被修改但「最後更新」沒變？
A: 增量同步不會偵測到。建議使用 "Last Modified Time" 欄位類型（自動更新）。

### Q3: Supabase 的記錄可以手動編輯嗎？
A: 可以，但下次同步時會被 Airtable 資料覆蓋。Supabase 應視為唯讀副本。

### Q4: 如何強制重新同步特定記錄？
A: 在 Airtable 更新「最後更新」欄位為今天日期，然後執行增量同步。

### Q5: UPSERT 會更新所有欄位嗎？
A: 是的，整筆記錄會被覆蓋（除了 id, created_at）。

---

**總結：目前採用單向、UPSERT 策略，以 Airtable 為主資料源，Supabase 作為 AI 查詢的高效副本。** 🎯
