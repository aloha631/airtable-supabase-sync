# Airtable 日期格式設定指南

## 📅 支援的日期格式

增量同步功能支援以下日期格式：

### ✅ 推薦格式：ISO 8601

**最佳選擇：使用 Airtable 的 "Last Modified Time" 欄位類型**

這會自動產生 ISO 8601 格式：
```
2023-02-17T10:30:00.000Z
```

**優點：**
- ✅ 自動更新（無需手動維護）
- ✅ 包含精確時間（小時、分鐘、秒）
- ✅ 包含時區資訊
- ✅ 國際標準格式

---

## 🔧 Airtable 設定步驟

### 方案 1: 使用 Last Modified Time（推薦）

1. 在 Airtable 表格中新增欄位
2. 欄位名稱：`最後更新`（或任何名稱）
3. 欄位類型：選擇 **"Last modified time"**
4. 設定選項：
   - **Time zone**: UTC (推薦)
   - **Date format**: ISO (自動)
   - **Include time**: 是
   - **Field dependencies**: 選擇要追蹤的欄位（或選擇 "All fields"）

**結果範例：**
```
2023-02-17T10:30:00.000Z
```

---

### 方案 2: 手動輸入 ISO 格式（不推薦）

如果必須手動維護：

1. 欄位類型：**"Single line text"**
2. 手動輸入格式：`YYYY-MM-DDTHH:mm:ss.sssZ`

**範例：**
```
2023-02-17T10:30:00.000Z
2024-12-25T15:45:30.123Z
```

**缺點：**
- ❌ 需要手動更新
- ❌ 容易出錯
- ❌ 維護成本高

---

### 方案 3: 簡單日期格式（向下相容）

系統仍支援舊的簡單格式：

```
2023-02-17        ← YYYY-MM-DD 格式
2023/02/17        ← YYYY/MM/DD 格式
```

**注意：**
- ⚠️ 只有日期，無時間資訊
- ⚠️ 無時區資訊
- ⚠️ 精確度較低（只到日）

---

## 🧪 測試日期格式

執行測試腳本來驗證日期格式：

```bash
npm run build && node dist/test-date-format.js
```

**輸出範例：**
```
✅ ISO 8601 with timezone    → 2023-02-17T10:30:00.000Z (AFTER ref)
✅ ISO 8601 without timezone → 2023-02-17T02:30:00.000Z (AFTER ref)
✅ YYYY-MM-DD                → 2023-02-17T00:00:00.000Z (AFTER ref)
❌ Invalid format            → INVALID
```

---

## 📊 支援格式總覽

| 格式 | 範例 | 支援 | 推薦 | 說明 |
|-----|------|------|------|------|
| ISO 8601 (UTC) | `2023-02-17T10:30:00.000Z` | ✅ | ⭐⭐⭐⭐⭐ | 最佳選擇 |
| ISO 8601 (無時區) | `2023-02-17T10:30:00` | ✅ | ⭐⭐⭐ | 會轉為本地時區 |
| ISO 8601 (+時區) | `2023-02-17T10:30:00+08:00` | ✅ | ⭐⭐⭐⭐ | 明確時區 |
| YYYY-MM-DD | `2023-02-17` | ✅ | ⭐⭐ | 向下相容 |
| YYYY/MM/DD | `2023/02/17` | ✅ | ⭐ | 不推薦 |
| Timestamp | `1676628600000` | ❌ | - | 不支援 |
| 其他格式 | `Feb 17, 2023` | ❌ | - | 不支援 |

---

## 🎯 實際應用範例

### 範例 1: 使用 Last Modified Time（自動）

**Airtable 設定：**
- 欄位名稱：`最後更新`
- 欄位類型：Last modified time
- 追蹤欄位：All fields

**增量同步行為：**
```
1. 修改 Airtable 任何欄位
2. "最後更新" 自動變為：2026-01-02T06:39:30.000Z
3. 執行 npm run incremental-sync
4. 系統偵測到：2026-01-02T06:39:30.000Z > 上次同步時間
5. ✅ 記錄被同步到 Supabase
```

---

### 範例 2: 手動維護 ISO 格式

**Airtable 記錄：**
```
Record A:
  客戶名稱: Sappe(泰國)
  最後更新: 2026-01-02T10:00:00.000Z  ← 手動輸入

Record B:
  客戶名稱: Unison(泰國)
  最後更新: 2025-12-01T10:00:00.000Z  ← 舊日期
```

**增量同步結果：**
```
上次同步: 2026-01-01T22:19:36.000Z

Record A: 2026-01-02T10:00:00.000Z > 2026-01-01T22:19:36.000Z
→ ✅ 需要同步

Record B: 2025-12-01T10:00:00.000Z < 2026-01-01T22:19:36.000Z
→ ❌ 跳過（已是最新）
```

---

### 範例 3: 使用簡單日期格式（向下相容）

**Airtable 記錄：**
```
最後更新: 2026-01-02  ← YYYY-MM-DD 格式
```

**解析結果：**
```
解析為: 2026-01-02T00:00:00.000Z  ← 自動補零時間
```

**注意：**
- 如果同一天有多次修改，無法區分
- 建議改用 ISO 格式以獲得更精確的時間

---

## ⚠️ 常見問題

### Q1: 為什麼建議使用 ISO 8601 格式？

**A:** 因為：
1. **精確度高** - 包含到毫秒級
2. **時區明確** - 避免時區混淆
3. **國際標準** - 跨系統相容性好
4. **自動更新** - 使用 Last Modified Time 無需手動維護

### Q2: 如果 Airtable 使用台灣時區 (GMT+8)？

**A:** 使用 ISO 8601 with timezone：
```
2023-02-17T18:30:00+08:00  ← 台灣時間 18:30
等同於 UTC:
2023-02-17T10:30:00.000Z   ← UTC 時間 10:30
```

系統會自動轉換為 UTC 進行比對。

### Q3: 現有的 YYYY-MM-DD 格式資料需要轉換嗎？

**A:** 不需要！系統向下相容：
- 舊資料可以保持 `YYYY-MM-DD` 格式
- 新資料建議使用 ISO 8601 格式
- 兩種格式可以混用

### Q4: Last Modified Time 和手動欄位哪個好？

**A:** 絕對推薦 **Last Modified Time**：

| 比較項目 | Last Modified Time | 手動欄位 |
|---------|-------------------|---------|
| 維護成本 | ✅ 自動 | ❌ 手動 |
| 準確性 | ✅ 100% | ⚠️ 可能忘記更新 |
| 格式正確 | ✅ 自動 ISO | ⚠️ 可能輸入錯誤 |
| 精確度 | ✅ 毫秒級 | ❌ 日級 |

### Q5: 如何驗證日期格式是否正確？

**A:** 執行測試腳本：
```bash
npm run build && node dist/test-date-format.js
```

或手動測試：
```bash
npm run incremental-sync
```

查看日誌中是否有 "Failed to parse date" 警告。

---

## 🔄 遷移指南

### 從 YYYY-MM-DD 遷移到 ISO 8601

**步驟 1:** 在 Airtable 新增 Last Modified Time 欄位

1. 新增欄位：`最後更新時間`
2. 類型：Last modified time
3. 追蹤：All fields
4. 時區：UTC

**步驟 2:** 更新同步腳本（如果欄位名稱改變）

```typescript
// 如果欄位名稱從「最後更新」改為「最後更新時間」
// 修改 src/incremental-sync.ts:
const lastUpdated = record.fields['最後更新時間'];  // 更新欄位名稱
```

**步驟 3:** 執行完整同步

```bash
npm run airtable-export && npm run csv-import
```

**步驟 4:** 驗證

```bash
npm run incremental-sync
```

應該看到：
```
✅ No changes detected. Database is up to date!
```

**步驟 5:** 刪除舊的「最後更新」欄位（可選）

---

## 📝 程式碼說明

### 日期解析邏輯

```typescript
// src/incremental-sync.ts
const lastUpdated = record.fields['最後更新'];
if (lastUpdated) {
  const updateDate = new Date(lastUpdated);  // 支援多種格式

  // 驗證日期有效性
  if (!isNaN(updateDate.getTime()) && updateDate > lastSyncTime) {
    return true;  // 需要同步
  }
}
```

**JavaScript Date 建構子支援的格式：**
- ISO 8601: `2023-02-17T10:30:00.000Z`
- RFC 2822: `Fri, 17 Feb 2023 10:30:00 GMT`
- 簡單格式: `2023-02-17`, `2023/02/17`

---

## 🎯 最佳實踐建議

### ✅ DO（推薦做法）

1. **使用 Last Modified Time 欄位類型**
   ```
   欄位名稱: 最後更新
   欄位類型: Last modified time
   時區: UTC
   追蹤欄位: All fields
   ```

2. **時區統一使用 UTC**
   - 避免夏令時問題
   - 跨時區一致性

3. **定期檢查同步日誌**
   ```bash
   npm run incremental-sync 2>&1 | tee sync.log
   ```

### ❌ DON'T（避免做法）

1. **不要手動輸入日期**（除非必要）
2. **不要使用非標準格式**（如 `Feb 17, 2023`）
3. **不要忘記設定欄位追蹤**
4. **不要混用多種時區**

---

## 📊 總結

| 需求 | 推薦方案 | 格式 |
|-----|---------|------|
| 自動追蹤修改 | Last Modified Time | ISO 8601 (UTC) |
| 手動維護 | Single line text | ISO 8601 |
| 向下相容 | 保持現有 | YYYY-MM-DD |
| 高精確度 | Last Modified Time | 毫秒級 |
| 跨時區 | Last Modified Time (UTC) | 時區標準化 |

**最終建議：立即改用 Airtable 的 "Last Modified Time" 欄位類型！** ⭐

---

**相關文件：**
- `UPDATE-STRATEGY.md` - 更新策略詳解
- `SYNC-GUIDE.md` - 同步操作指南
