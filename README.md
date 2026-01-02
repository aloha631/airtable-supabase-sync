# Airtable to Supabase 同步系統

> 將 Airtable 客戶聯絡記錄同步到 Supabase，供 AI 工具進行高效查詢和分析

## 🚀 快速開始

### 增量同步（日常使用，推薦）
```bash
npm run incremental-sync
```
只同步有變更的記錄，快速高效（~8-10 秒）

### 完整同步（首次設置）
```bash
npm run airtable-export && npm run csv-import
```
同步所有記錄到 Supabase（~20 秒）

---

## 📊 系統狀態

- **Airtable 記錄**: 592 筆
- **Supabase 記錄**: 585 筆（有效記錄）
- **不重複客戶**: 152 家
- **資料品質**: 99.5%+ 完整度

---

## 🎯 主要功能

### ✅ 已實作功能

1. **完整同步**
   - 導出所有 Airtable 記錄
   - 通過 CSV 中介格式
   - 批次導入到 Supabase

2. **增量同步** ⚡
   - 智能偵測變更記錄
   - 只同步有更新的資料
   - 支援 ISO 8601 和簡單日期格式

3. **AI 查詢整合**
   - 直接查詢 Supabase 資料
   - 結構化資料分析
   - 示範：TPI IQ OQ 資料搜尋

4. **資料品質保證**
   - 自動欄位驗證
   - 支援長文字內容
   - UPSERT 避免重複

---

## 📋 資料對應

| Airtable 欄位 | Supabase 欄位 | 說明 |
|-------------|--------------|------|
| Record ID | airtable_id | 唯一識別碼 |
| 客戶（連結欄位） | customer_id | 客戶 record ID |
| 客戶名稱+國家 | customer_name | 格式：「名稱(國家)」 |
| 類別 | categories | 記錄類型（可選） |
| 簡述(en) | summary_en | 英文摘要 |
| 簡述(cn) | summary_cn | 中文摘要 |
| 更新內容 | interaction_notes | 詳細內容 |
| 最後更新 | - | 用於增量同步判斷 |

---

## 🔧 環境設定

### 必要設定

1. **複製環境變數範本**
   ```bash
   cp .env.example .env
   ```

2. **填入 API 金鑰**
   ```env
   # Airtable
   AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
   AIRTABLE_BASE_ID=applXXXXXXXXXXXX
   AIRTABLE_TABLE_ID=tblXXXXXXXXXXXX

   # Supabase
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_KEY=eyJXXXXXXXXXXXXX
   ```

3. **安裝依賴**
   ```bash
   npm install
   ```

4. **編譯 TypeScript**
   ```bash
   npm run build
   ```

---

## 📚 完整文檔

| 文檔 | 說明 |
|-----|------|
| [SYNC-GUIDE.md](SYNC-GUIDE.md) | 同步操作完整指南 |
| [UPDATE-STRATEGY.md](UPDATE-STRATEGY.md) | 更新策略詳細說明 |
| [DATE-FORMAT-GUIDE.md](DATE-FORMAT-GUIDE.md) | 日期格式設定指南 |

---

## 🎨 常用命令

### 同步命令
```bash
# 增量同步（推薦）
npm run incremental-sync

# 完整同步
npm run airtable-export
npm run csv-import

# 查看資料統計
npm run build && node dist/data-statistics.js
```

### 測試命令
```bash
# 查詢所有資料
npm run build && node dist/test-query.js

# AI 搜尋示範（TPI IQ OQ）
npm run build && node dist/ai-search-tpi-iqoq.js

# 檢查 Airtable 欄位
npm run build && node dist/check-airtable-fields.js

# 測試日期格式
npm run build && node dist/test-date-format.js
```

---

## 📊 資料統計

### Top 5 客戶（互動次數）
1. Sriprasit(泰國) - 34 次
2. TPI(泰國) - 27 次
3. Unison(泰國) - 26 次
4. Genepharm(希臘) - 26 次
5. Biomedica(捷克) - 25 次

### 類別分布
- (2.)Machine Quote) - 198 筆 (33.8%)
- (4.) Information) - 136 筆 (23.2%)
- (1.)Parts Quote) - 70 筆 (12.0%)
- (3.)Drawing) - 57 筆 (9.7%)
- (9.)Reply) - 42 筆 (7.2%)

---

## 🎯 更新原則

### 同步方向
```
Airtable (主資料源) ──→ Supabase (AI 查詢副本)
```

### UPSERT 策略
- **新記錄** → INSERT（新增）
- **已存在** → UPDATE（覆蓋更新）
- **絕不刪除** Supabase 記錄

### 增量同步邏輯
```
IF Airtable「最後更新」> Supabase last_synced
   → 同步 ✅
ELSE IF Airtable createdTime > Supabase last_synced
   → 同步 ✅（新記錄）
ELSE
   → 跳過 ❌（已是最新）
```

---

## 📅 日期格式

### ✅ 推薦：使用 Airtable "Last Modified Time"

**設定：**
- 欄位類型：Last modified time
- 時區：UTC
- 追蹤欄位：All fields

**結果格式：**
```
2023-02-17T10:30:00.000Z  ← ISO 8601 格式（自動）
```

### ⚠️ 支援但不推薦：簡單日期

```
2023-02-17  ← YYYY-MM-DD（向下相容）
```

**詳細說明：** 參見 [DATE-FORMAT-GUIDE.md](DATE-FORMAT-GUIDE.md)

---

## 🛠️ 技術架構

### Tech Stack
- **TypeScript** - 類型安全
- **Node.js** - 執行環境
- **Airtable.js** - Airtable API SDK
- **Supabase.js** - PostgreSQL 客戶端
- **csv-parse/stringify** - CSV 處理

### 資料流程
```
Airtable API
    ↓
TypeScript 轉換
    ↓
CSV 中介格式
    ↓
Supabase PostgreSQL
    ↓
AI 工具查詢
```

---

## 🔍 AI 查詢範例

### 查詢 TPI 的 IQ OQ 資料
```bash
npm run build && node dist/ai-search-tpi-iqoq.js
```

**輸出：**
```
📋 TPI Thailand IQ OQ Records:
Customer: TPI(泰國)
Category: (7.)Document)
Summary: YC 2022 設備 IQ OQ 文件

IQ 簽名日期: 2023-06-29
OQ 簽名日期: 2023-07-17
```

### 自定義查詢
```typescript
// 查詢特定客戶
const { data } = await supabase
  .from('customer_interactions')
  .select('*')
  .ilike('customer_name', '%Genepharm%');

// 按類別篩選
const { data } = await supabase
  .from('customer_interactions')
  .select('*')
  .eq('categories', '(2.)Machine Quote)');
```

---

## 📈 效能指標

| 操作 | 記錄數 | 執行時間 | 網路 |
|-----|-------|---------|-----|
| 完整同步 | 592 | ~20 秒 | 高 |
| 增量同步（無變更） | 0 | ~8 秒 | 低 |
| 增量同步（10筆變更） | 10 | ~10 秒 | 極低 |
| AI 查詢 | 585 | <1 秒 | 極低 |

---

## 🤝 最佳實踐

### ✅ DO（推薦）
1. 日常使用 `npm run incremental-sync`
2. 在 Airtable 使用 "Last Modified Time" 欄位
3. 定期執行完整同步（每週/每月）
4. 監控同步日誌

### ❌ DON'T（避免）
1. 不要手動編輯 Supabase 資料
2. 不要忘記執行 `unset AIRTABLE_API_KEY`
3. 不要使用非標準日期格式
4. 不要在 Airtable 刪除記錄後期望 Supabase 自動刪除

---

## 📝 版本歷史

- **v1.0** (2026-01-01)
  - ✅ 完整同步功能
  - ✅ CSV 導入/導出
  - ✅ 基本資料驗證

- **v2.0** (2026-01-02)
  - ✅ 增量同步功能
  - ✅ ISO 8601 日期支援
  - ✅ AI 查詢示範
  - ✅ 完整文檔

---

## 🆘 故障排除

### 常見問題

**Q: 增量同步沒偵測到變更？**
```bash
# 檢查「最後更新」欄位是否正確更新
npm run build && node dist/check-airtable-fields.js
```

**Q: Airtable API 403 錯誤？**
```bash
# 清除系統環境變數
unset AIRTABLE_API_KEY AIRTABLE_BASE_ID
# 重新執行
npm run incremental-sync
```

**Q: 部分記錄被跳過？**
- 檢查是否缺少 `customer_name` 欄位
- 查看同步日誌中的 WARN 訊息

---

## 📧 聯絡方式

- **專案路徑**: `628 ) AI tool() - Claude Code 專案/airtable syc to Supabase`
- **文檔**: 查看本目錄中的詳細指南

---

## 🎉 成就解鎖

- ✅ 585 筆客戶互動記錄已同步
- ✅ 152 家客戶資料可供 AI 分析
- ✅ 增量同步效率提升 60%
- ✅ 資料品質 99.5%+ 完整度

**🚀 系統已就緒，開始使用 AI 分析客戶資料吧！**
