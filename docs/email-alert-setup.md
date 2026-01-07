# Email 告警設置說明

此文件說明如何設置 Email 告警功能，當同步連續失敗時自動發送郵件通知。

## 設置步驟

### 1. 註冊 Resend 帳號

1. 前往 [Resend](https://resend.com/) 註冊免費帳號
2. 免費額度：每月 3,000 封郵件，足夠同步服務使用

### 2. 取得 API Key

1. 登入 Resend Dashboard
2. 前往 [API Keys](https://resend.com/api-keys)
3. 點擊 "Create API Key"
4. 複製產生的 API Key（格式：`re_xxxxxxxxxx`）

### 3. 驗證發件人網域（重要）

Resend 要求驗證發件人網域才能發送郵件：

#### 選項 A：使用自己的網域（推薦）

1. 前往 [Domains](https://resend.com/domains)
2. 點擊 "Add Domain"
3. 輸入你的網域（例如：`yourdomain.com`）
4. 按照指示在你的 DNS 設置中添加驗證記錄
5. 等待驗證完成（通常幾分鐘內）

#### 選項 B：使用 Resend 測試網域（開發用）

1. 在開發階段，可以使用 Resend 提供的測試網域
2. 發件人 Email 使用：`onboarding@resend.dev`
3. **注意**：測試網域只能發送到你註冊 Resend 時使用的 Email

### 4. 配置環境變數

在 `.env` 文件中添加以下配置：

```bash
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# 發件人 Email（必須是已驗證的網域）
EMAIL_ALERT_FROM=noreply@yourdomain.com
# 或使用測試網域（僅開發用）：
# EMAIL_ALERT_FROM=onboarding@resend.dev

# 收件人 Email（告警發送到這個地址）
EMAIL_ALERT_TO=your_email@example.com

# 連續失敗幾次後發送告警（預設：3）
EMAIL_FAILURE_THRESHOLD=3
```

### 5. 測試 Email 功能

執行測試腳本確認 Email 設置正確：

```bash
npm run test-email
```

此腳本會：
1. 發送一封測試郵件
2. 發送一封模擬失敗告警郵件

檢查你的收件匣（包括垃圾郵件資料夾）確認收到郵件。

## 告警觸發條件

當滿足以下條件時，系統會自動發送告警郵件：

1. **連續失敗次數** 達到設定的閾值（預設：3 次）
2. **失敗狀態**：`status = 'failed'`
3. 告警郵件包含：
   - 連續失敗次數
   - 每次失敗的時間和錯誤訊息
   - 檢查記錄數和失敗記錄數
   - 建議的處理步驟

## 常見問題

### Q1: 收不到郵件怎麼辦？

1. **檢查垃圾郵件資料夾**
2. **確認 API Key 正確**：
   ```bash
   npm run test-email
   ```
3. **確認發件人網域已驗證**：
   - 登入 Resend Dashboard 查看網域狀態
   - 使用測試網域 `onboarding@resend.dev` 進行測試
4. **查看日誌**：
   ```bash
   npm run check-sync-history
   ```

### Q2: 如何修改告警閾值？

在 `.env` 文件中修改：

```bash
# 改為連續失敗 5 次後才告警
EMAIL_FAILURE_THRESHOLD=5
```

### Q3: 可以使用 Gmail 發送嗎？

Resend 不支援直接使用 Gmail SMTP。建議：
1. 使用 Resend（簡單、免費）
2. 或自行實現 nodemailer + Gmail SMTP（需要額外配置）

### Q4: 如何在 Zeabur 部署時配置？

在 Zeabur 專案設定中添加環境變數：
1. 前往 Zeabur 專案 → Settings → Environment Variables
2. 添加所有必要的環境變數（與 `.env` 相同）
3. 重新部署服務

## 告警郵件範例

當連續 3 次同步失敗時，你會收到類似以下的郵件：

**主旨**：🚨 Airtable 同步失敗告警 - 連續 3 次失敗

**內容**：
```
⚠️ 警告：系統偵測到連續 3 次同步失敗

失敗詳情：
1. 2026-01-04 20:50:07
   錯誤: Airtable API authentication failed
   檢查記錄數: 0
   失敗記錄數: 0

2. 2026-01-04 19:50:05
   錯誤: Network timeout
   檢查記錄數: 100
   失敗記錄數: 100

3. 2026-01-04 18:50:03
   錯誤: Supabase connection error
   檢查記錄數: 100
   失敗記錄數: 100

建議處理步驟：
1. 檢查 Airtable API 金鑰是否有效
2. 確認 Airtable Base ID 和 Table ID 是否正確
3. 檢查 Supabase 連線狀態
4. 查看 Zeabur 部署日誌以獲取更多詳情
5. 執行 npm run check-sync-history 查看完整同步歷史
```

## 相關腳本

```bash
# 測試 Email 功能
npm run test-email

# 查看同步歷史（確認失敗次數）
npm run check-sync-history

# 手動執行同步（觸發告警檢查）
npm run incremental-sync
```

## 技術細節

- **Email 服務**：Resend
- **告警邏輯**：`src/alert-checker.ts`
- **Email 模板**：`src/email-service.ts`
- **配置管理**：`src/config.ts`
- **檢查時機**：每次同步失敗後自動檢查

## 安全性

- API Key 儲存在環境變數中，不會提交到 Git
- 使用 `.env` 文件管理敏感資訊
- Zeabur 部署時使用環境變數注入

## 成本

- Resend 免費額度：每月 3,000 封
- 每次告警發送 1 封郵件
- 即使每小時同步一次，一個月最多約 720 封（遠低於免費額度）
