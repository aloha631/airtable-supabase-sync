# Airtable to Supabase 同步指南

## 📚 目錄

1. [完整同步 (Full Sync)](#完整同步-full-sync)
2. [增量同步 (Incremental Sync)](#增量同步-incremental-sync)
3. [同步策略說明](#同步策略說明)
4. [常用命令](#常用命令)

---

## 🔄 完整同步 (Full Sync)

完整同步會導出所有 Airtable 記錄並更新到 Supabase。

### 使用情境
- 第一次設置系統
- 資料庫需要重建
- 懷疑資料不一致時

### 執行步驟

```bash
# 1. 導出所有 Airtable 資料到 CSV
npm run airtable-export

# 2. 導入 CSV 到 Supabase
npm run csv-import
```

### 注意事項
- 會處理所有 592 筆 Airtable 記錄
- 使用 UPSERT 邏輯（有則更新、無則新增）
- 大約需要 10-20 秒完成

---

## ⚡ 增量同步 (Incremental Sync)

**推薦使用** - 只同步有變更的記錄，快速且高效。

### 使用情境
- 日常資料更新
- 定時自動同步
- 只想同步最近的變更

### 執行命令

```bash
npm run incremental-sync
```

### 工作原理

1. **檢查上次同步時間**
   - 讀取 Supabase 中最新的 `last_synced` 時間戳
   - 如果是第一次執行，會進行完整同步

2. **過濾變更記錄**
   - 比對 Airtable 的「最後更新」欄位
   - 比對 Airtable 的 `createdTime`（新記錄）
   - 只取得在上次同步之後有變更的記錄

3. **同步變更**
   - 只更新有變更的記錄到 Supabase
   - 自動更新 `last_synced` 時間戳

### 執行結果範例

```
=== Incremental Sync Started ===

Last sync was at: 2026-01-01T22:19:36.877Z
Fetching records modified after: 2026-01-01T22:19:36.877Z

Fetched 592 total records from Airtable
Filtered to 0 modified/new records

✅ No changes detected. Database is up to date!
```

### 效能優勢

| 同步方式 | 處理記錄數 | 執行時間 | 網路流量 |
|---------|----------|---------|---------|
| 完整同步 | 592 筆 | ~20 秒 | 高 |
| 增量同步（無變更） | 0 筆 | ~8 秒 | 低 |
| 增量同步（10 筆變更） | 10 筆 | ~10 秒 | 極低 |

---

## 🎯 同步策略說明

### Airtable 時間欄位

系統支援以下兩種時間欄位來判斷記錄是否有變更：

1. **「最後更新」欄位** （優先）
   - 格式：`YYYY-MM-DD`（如 "2023-02-17"）
   - 手動維護的欄位
   - 當此欄位更新時，記錄會被標記為「有變更」

2. **`createdTime` metadata** （備選）
   - 格式：ISO 8601（如 "2022-11-14T07:11:55.000Z"）
   - Airtable 自動維護
   - 用於偵測新建立的記錄

### Supabase 時間欄位

```sql
created_at    -- 記錄首次建立時間
updated_at    -- 記錄最後更新時間
last_synced   -- 最後同步時間（用於增量同步）
```

### 同步邏輯

```
IF 「最後更新」> last_synced THEN
  記錄需要同步
ELSE IF createdTime > last_synced THEN
  記錄需要同步（新記錄）
ELSE
  記錄已是最新，跳過
END IF
```

---

## 💡 常用命令

### 基本同步命令

```bash
# 增量同步（日常使用）
npm run incremental-sync

# 完整同步（首次設置或重建）
npm run airtable-export && npm run csv-import

# 只導出不導入（檢查資料）
npm run airtable-export

# 查看資料統計
npm run build && node dist/data-statistics.js
```

### 測試與驗證

```bash
# 查詢資料
npm run build && node dist/test-query.js

# AI 搜尋示範（如：查詢 TPI 的 IQ OQ）
npm run build && node dist/ai-search-tpi-iqoq.js

# 檢查 Airtable 欄位結構
npm run build && node dist/check-airtable-fields.js
```

### 資料庫管理

```bash
# 清空 Supabase 資料（謹慎使用！）
# 在 Supabase Dashboard > SQL Editor 執行：
DELETE FROM customer_interactions;
ALTER SEQUENCE customer_interactions_id_seq RESTART WITH 1;
```

---

## 🔧 進階設定

### 自動定時同步

可以使用 cron job 或系統排程器來自動執行增量同步：

**Linux/Mac (crontab)**
```bash
# 每小時執行一次
0 * * * * cd /path/to/project && npm run incremental-sync >> /var/log/sync.log 2>&1

# 每天早上 9 點執行
0 9 * * * cd /path/to/project && npm run incremental-sync
```

**Windows (Task Scheduler)**
1. 建立基本工作
2. 觸發程序：每天/每小時
3. 動作：啟動程式
4. 程式：`npm`
5. 引數：`run incremental-sync`
6. 起始於：專案目錄

### N8N / Make.com 整合

可以設定 webhook 觸發同步：

```javascript
// N8N HTTP Request Node
POST https://your-server.com/sync
{
  "type": "incremental"
}
```

---

## 📊 資料對應

| Airtable 欄位 | Supabase 欄位 | 必填 | 說明 |
|-------------|--------------|-----|-----|
| Record ID | airtable_id | ✅ | Airtable 記錄 ID |
| 客戶（連結欄位） | customer_id | ✅ | 客戶 record ID |
| 客戶名稱+國家 | customer_name | ✅ | 格式：「名稱(國家)」 |
| 類別 | categories | ❌ | 記錄類型 |
| 簡述(en) | summary_en | ❌ | 英文摘要 |
| 簡述(cn) | summary_cn | ❌ | 中文摘要 |
| 更新內容 | interaction_notes | ❌ | 詳細內容（支援長文字） |

---

## 🎯 最佳實踐

1. **日常使用增量同步**
   - 每次需要同步時使用 `npm run incremental-sync`
   - 快速、高效、節省資源

2. **定期完整同步**
   - 每週或每月執行一次完整同步
   - 確保資料完整性

3. **監控同步狀態**
   - 檢查同步日誌
   - 注意 `Failed` 記錄數量

4. **Airtable 欄位維護**
   - 確保「最後更新」欄位正確更新
   - 建議使用 Airtable 的 "Last Modified Time" 欄位類型

---

## ❓ 常見問題

### Q: 為什麼有些記錄被跳過？
A: 缺少 `customer_name` 的記錄會被跳過（通常是內部文件）。

### Q: 增量同步沒有偵測到變更？
A: 確認 Airtable 的「最後更新」欄位是否已更新，或檢查系統時區設定。

### Q: 可以手動指定同步起始時間嗎？
A: 目前自動從 Supabase 讀取，未來可新增參數支援手動指定。

### Q: 同步會刪除 Supabase 中的記錄嗎？
A: 不會。使用 UPSERT 邏輯，只會新增或更新，不會刪除。

---

## 📝 版本歷史

- **v1.0** - 完整同步功能
- **v2.0** - 增量同步功能（2026-01-02）

---

**提示**: 建議將 `npm run incremental-sync` 設為日常同步的標準命令！⚡
