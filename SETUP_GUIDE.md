# 完整設置指南

按照以下步驟完成 Airtable 到 Supabase 同步系統的設置。

## ✅ 已完成

- [x] 專案初始化
- [x] Supabase Schema 建立
- [x] CSV 導入腳本開發

## 📋 接下來的步驟

### 步驟 1：配置環境變數

1. **複製環境變數範本**

```bash
cp .env.example .env
```

2. **取得 Airtable API 資訊**

   a. **API Key**：
   - 訪問 https://airtable.com/account
   - 點擊 **Generate API key**
   - 複製 API 金鑰

   b. **Base ID**：
   - 開啟您的 Airtable Base
   - 點擊 **Help** → **API documentation**
   - Base ID 顯示在頁面頂部（例如：`appXXXXXXXXXXXXXX`）

   c. **Table Name**：
   - 您的資料表名稱（例如：`客戶互動`）

3. **取得 Supabase 資訊**

   a. **Supabase URL 和 Key**：
   - 登入 https://app.supabase.com
   - 選擇您的專案
   - 點擊左側選單 **Settings** → **API**
   - 複製：
     - `URL`（Project URL）
     - `anon/public key`（API Key）

4. **編輯 .env 檔案**

```bash
# Airtable Configuration
AIRTABLE_API_KEY=你的_airtable_api_key
AIRTABLE_BASE_ID=你的_base_id
AIRTABLE_TABLE_NAME=客戶互動

# Supabase Configuration
SUPABASE_URL=https://你的專案.supabase.co
SUPABASE_KEY=你的_supabase_anon_key

# Email Alert Configuration
EMAIL_ALERT_TO=your_email@example.com

# Environment
NODE_ENV=development
```

### 步驟 2：從 Airtable 導出測試資料

**選項 A：自動導出（推薦）**

```bash
npm run airtable-export
```

這會自動從 Airtable 導出 100 筆資料到 `test-data/sample.csv`

**選項 B：使用範本測試**

如果只是想測試功能：

```bash
cp test-data/sample-template.csv test-data/sample.csv
```

### 步驟 3：導入資料到 Supabase

```bash
npm run csv-import
```

**預期輸出：**

```
[2026-01-01T08:00:00.000Z] [INFO] === CSV Import Started ===
[2026-01-01T08:00:00.123Z] [INFO] Current records in Supabase: 0
[2026-01-01T08:00:00.456Z] [INFO] Parsing CSV file...
[2026-01-01T08:00:00.789Z] [INFO] Parsed 100 records from CSV
[2026-01-01T08:00:05.123Z] [SUCCESS] === Import Complete ===
[2026-01-01T08:00:05.456Z] [SUCCESS] Total records processed: 100
[2026-01-01T08:00:05.789Z] [SUCCESS] Successfully imported: 100
[2026-01-01T08:00:06.012Z] [SUCCESS] Records in Supabase: 0 → 100
```

### 步驟 4：驗證資料導入

**在 Supabase Dashboard：**

1. 登入 https://app.supabase.com
2. 選擇您的專案
3. 點擊左側選單 **Table Editor**
4. 選擇 `customer_interactions` 表
5. 確認資料已正確導入（應該看到 100 筆記錄）

### 步驟 5：測試 Claude Code AI 分析（關鍵時刻！🎉）

這是「值得了」的時刻 - 測試 AI 是否能直接查詢和分析資料！

**使用 Claude Code 查詢 Supabase：**

在 Claude Code 中執行以下指令：

```
連接到我的 Supabase PostgreSQL 資料庫：
- URL: [你的 SUPABASE_URL]
- Password: [你的 SUPABASE_KEY]

查詢 customer_interactions 表，給我前 10 筆客戶互動記錄
```

**進階測試 - AI 分析：**

```
分析 customer_interactions 表中的資料，告訴我：
1. 最常見的客戶問題類別（topic）
2. 哪些客戶的互動記錄最詳細
3. 是否有任何客戶需要立即跟進
```

**如果 AI 能成功查詢並分析資料 → 🎉 專案核心價值已驗證！**

## 🔍 驗證清單

完成後，確認以下項目：

- [ ] `.env` 檔案已正確配置（API 金鑰已填入）
- [ ] Supabase 表中有 100 筆測試資料
- [ ] 資料中繁體中文、emoji 正確顯示
- [ ] Claude Code 能成功連接 Supabase
- [ ] Claude Code 能執行 SQL 查詢
- [ ] Claude Code 能分析資料並提供洞察

## ❓ 常見問題

### 1. 導入時出現 "Missing required environment variable" 錯誤

**解決方案：**
- 確認 `.env` 檔案存在
- 確認所有必需的環境變數都已填入
- 重新執行指令

### 2. Airtable API 錯誤

**解決方案：**
- 檢查 `AIRTABLE_API_KEY` 是否正確
- 檢查 `AIRTABLE_BASE_ID` 是否正確
- 確認 Airtable Table Name 拼寫正確（例如：`客戶互動`）

### 3. Supabase 連接錯誤

**解決方案：**
- 檢查 `SUPABASE_URL` 格式（必須包含 `https://`）
- 檢查 `SUPABASE_KEY` 是否使用 `anon/public` key（不是 service_role key）
- 確認 Supabase 專案狀態正常

### 4. CSV 解析錯誤

**解決方案：**
- 確認 CSV 檔案是 UTF-8 編碼
- 確認 CSV 欄位順序正確
- 使用範本檔案測試：`cp test-data/sample-template.csv test-data/sample.csv`

## 🚀 下一步

完成驗證後，可以進入 Phase 1B：開發自動同步服務

**預計完成時間：** 1-2 天

**主要工作：**
- 開發同步服務（每小時自動執行）
- 實作錯誤處理和重試機制
- 部署到 Zeabur
