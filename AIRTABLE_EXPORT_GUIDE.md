# Airtable 資料導出指南

## 方法一：直接從 Airtable 導出 CSV（推薦）

### 步驟：

1. **開啟 Airtable Base**
   - 登入 [Airtable](https://airtable.com)
   - 開啟「客戶互動」Base（或您的資料表）

2. **選擇要導出的 View**
   - 建立一個新 View 或使用現有 View
   - 篩選出 100 筆測試資料（建議包含各種情境）
   - 確保包含以下欄位：
     - Record ID（在 Airtable 是隱藏欄位，需要透過 API 取得）
     - 客戶
     - 類別
     - 簡述(en)
     - 簡述(cn)
     - 更新內容

3. **導出為 CSV**
   - 點擊右上角 **···** (More options)
   - 選擇 **Download CSV**
   - 儲存檔案為 `test-data/sample.csv`

## 方法二：使用 Airtable API 導出（包含 Record ID）

由於 Airtable UI 導出的 CSV 不包含 `Record ID`，建議使用以下方式：

### 使用 Airtable API：

1. **取得 API 金鑰**
   - 訪問 [Airtable Account](https://airtable.com/account)
   - 點擊 **Generate API key**
   - 複製 API 金鑰

2. **取得 Base ID 和 Table Name**
   - 開啟您的 Base
   - 點擊 **Help** → **API documentation**
   - Base ID 顯示在頁面頂部（例如：`appXXXXXXXXXXXXXX`）
   - Table Name 是您的資料表名稱（例如：`客戶互動`）

3. **使用 curl 導出資料**

```bash
curl "https://api.airtable.com/v0/YOUR_BASE_ID/客戶互動?maxRecords=100" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  > airtable-raw.json
```

4. **轉換為 CSV 格式**

使用以下 Node.js 腳本轉換（或手動轉換）：

```javascript
// convert-to-csv.js
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('airtable-raw.json', 'utf-8'));
const records = data.records;

// CSV header
let csv = 'airtable_id,customer_name,topic,summary_en,summary_cn,interaction_notes\n';

records.forEach(record => {
  const fields = record.fields;
  const row = [
    record.id,
    fields['客戶'] || '',
    fields['類別'] || '',
    fields['簡述(en)'] || '',
    fields['簡述(cn)'] || '',
    (fields['更新內容'] || '').replace(/"/g, '""'), // Escape quotes
  ];

  csv += row.map(v => `"${v}"`).join(',') + '\n';
});

fs.writeFileSync('test-data/sample.csv', csv, 'utf-8');
console.log('CSV created: test-data/sample.csv');
```

## CSV 格式要求

確保 CSV 檔案包含以下欄位（順序必須正確）：

```csv
airtable_id,customer_name,topic,summary_en,summary_cn,interaction_notes
rec123abc,王小明,產品詢價,Product inquiry,產品詢價,"客戶詢問產品..."
```

### 欄位說明：

- **airtable_id**：Airtable Record ID（必填）
- **customer_name**：客戶名稱（必填）
- **topic**：類別/主題（必填）
- **summary_en**：英文簡述（選填）
- **summary_cn**：中文簡述（選填）
- **interaction_notes**：更新內容，Markdown 格式（選填）

## 快速測試

如果您只是想測試功能，可以：

1. 使用範本檔案：
   ```bash
   cp test-data/sample-template.csv test-data/sample.csv
   ```

2. 執行導入：
   ```bash
   npm run csv-import
   ```

## 注意事項

- CSV 檔案必須是 UTF-8 編碼
- 如果欄位包含逗號或換行，必須用雙引號包圍
- 繁體中文、emoji 應正確顯示
- Markdown 格式（例如：`### 標題`、`- 列表`）會被保留
