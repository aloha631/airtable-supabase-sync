# Email 告警功能 - 設置檢查清單

## ✅ 設置步驟

### 1. 註冊 Resend
- [ ] 前往 https://resend.com/ 註冊帳號
- [ ] 取得 API Key（格式：`re_xxxxxxxxxx`）

### 2. 驗證發件人網域

**選項 A：使用自己的網域**（推薦生產環境）
- [ ] 在 Resend 添加你的網域
- [ ] 在 DNS 設置中添加驗證記錄
- [ ] 等待驗證完成

**選項 B：使用測試網域**（開發測試用）
- [ ] 使用 `onboarding@resend.dev` 作為發件人
- [ ] 收件人必須是你註冊 Resend 時使用的 Email

### 3. 配置環境變數

在 `.env` 文件中添加：

```bash
# Resend API Key（必填）
RESEND_API_KEY=re_your_api_key_here

# 發件人 Email（必填，必須是已驗證的網域）
EMAIL_ALERT_FROM=onboarding@resend.dev  # 或 noreply@yourdomain.com

# 收件人 Email（必填）
EMAIL_ALERT_TO=your_email@example.com

# 連續失敗幾次後告警（選填，預設 3）
EMAIL_FAILURE_THRESHOLD=3
```

### 4. 測試 Email 功能

```bash
# 執行測試
npm run test-email
```

預期結果：
- [ ] 收到「Email 測試」郵件
- [ ] 收到「失敗告警」郵件（包含 3 次模擬失敗）
- [ ] 沒有錯誤訊息

### 5. Zeabur 部署設置

在 Zeabur 專案設置中添加環境變數：
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_ALERT_FROM`
- [ ] `EMAIL_ALERT_TO`
- [ ] `EMAIL_FAILURE_THRESHOLD`（選填）

## 📋 功能說明

### 告警觸發條件
- 連續失敗次數 ≥ 設定閾值（預設 3 次）
- 失敗狀態為 `failed`

### 告警郵件內容
- ✉️ 連續失敗次數
- ⏰ 每次失敗的時間
- ❌ 詳細錯誤訊息
- 📊 檢查/失敗記錄數
- 💡 建議處理步驟

### 檢查時機
- 每次同步失敗後自動檢查
- 達到閾值時立即發送告警

## 🔍 疑難排解

### 收不到郵件？
1. 檢查垃圾郵件資料夾
2. 確認 API Key 正確
3. 確認發件人網域已驗證
4. 查看日誌：`npm run check-sync-history`

### 測試失敗？
1. 確認環境變數已設置
2. 確認網路連線正常
3. 查看錯誤訊息

### 想修改告警內容？
編輯 `src/email-service.ts` 中的 Email 模板

## 📚 相關文件
- 詳細設置說明：`docs/email-alert-setup.md`
- 配置管理：`src/config.ts`
- 告警邏輯：`src/alert-checker.ts`
- Email 服務：`src/email-service.ts`

## 🎯 下一步
設置完成後，可以繼續：
- Story 3.3：資料庫索引優化與 AI 查詢驗證
