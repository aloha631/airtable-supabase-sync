---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ['prd.md']
workflowType: 'architecture'
project_name: 'airtable syc to Supabase'
user_name: 'Liaosanyi'
date: '2026-01-01'
lastStep: 4
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Input Context

**PRD 已載入：** `_bmad-output/planning-artifacts/prd.md`

**專案概述：**
- **專案名稱：** airtable syc to Supabase
- **核心目標：** 建立自動化同步系統，將 20,000 筆 Airtable 資料同步到 Supabase (PostgreSQL)
- **Phase 1 目標：** 資料備份與 AI Agent 整合準備（0-3 個月）
- **技術棧：** Node.js + TypeScript, Airtable.js SDK, @supabase/supabase-js, Zeabur 部署

**關鍵技術挑戰：**
1. Airtable API 整合（20,000 筆資料，分頁處理，速率限制）
2. Rich text 資料轉換（Markdown 格式，最多 10,000 字元/筆）
3. 連結資料提取和結構化儲存
4. UTF-8 編碼處理（繁體中文、特殊符號、emoji）
5. 每小時自動同步機制（Zeabur Cron Job）
6. Claude Code / AI Agent 整合能力

---

## Project Context Analysis

### Requirements Overview

**Phase 1 實際範圍（MVP - 0-3個月）：**

基於與團隊的深入討論（Mary 業務分析師、Murat 測試架構師、Amelia 開發者），我們確認 Phase 1 的實際範圍為：

**資料範圍：**
- **目標資料：** 客戶互動資料
- **資料量：** 10,000 筆以下（而非 PRD 願景中的 20,000 筆）
- **策略：** 先專注於最關鍵的客戶資料，成功後再擴展到其他資料

**資料結構（簡化）：**
- **客戶名稱** (VARCHAR)
- **互動記錄** (TEXT) - Markdown 格式純文字，約 10,000 字元/筆
  - Airtable rich text 欄位儲存的是 Markdown 格式
  - 可直接作為純文字儲存到 Supabase（保留 Markdown 語法）
  - 包含繁體中文、特殊符號、emoji（UTF-8 編碼）
  - 無複雜的 Markdown Link、無格式標記需要特殊處理

**Functional Requirements：**

**Phase 1A - CSV 初始化（一次性，手動輔助）：**

1. **初始資料導入**
   - 從 Airtable 導出 CSV（10,000 筆客戶互動資料）
   - 開發 Node.js 導入腳本（約 50 行代碼）
   - 批次導入到 Supabase（使用 `INSERT` 或 `COPY`）
   - 驗證資料完整性（筆數對比 + 隨機抽樣）
   - **預估時間：1-2 小時**

2. **資料驗證機制**
   - 驗證總筆數（Airtable CSV vs Supabase）
   - 隨機抽樣 5-10 筆資料內容比對
   - UTF-8 編碼正確性檢查（繁體中文、emoji）
   - Markdown 格式保留驗證

**Phase 1B - 自動同步（每小時執行）：**

1. **全量同步策略**（簡化架構）
   - 每小時從 Airtable 讀取全部客戶互動資料
   - 10,000 筆 ÷ 100（每頁）= 100 次 API 呼叫
   - 速率限制每秒 5 次 = 約 20 秒完成讀取
   - 使用 Airtable Record ID 作為唯一識別
   - 比對並 `UPSERT` 到 Supabase（只更新變更的記錄）
   - **預期變更量：< 100 筆/小時**

2. **同步狀態追蹤**
   - 記錄每次同步時間戳
   - 記錄同步筆數（檢查、新增、更新）
   - 記錄成功/失敗狀態
   - 簡單日誌系統（便於除錯）

3. **監控和告警（簡化）**
   - 每次同步後驗證筆數（Airtable vs Supabase）
   - 連續 3 次同步失敗 → Email 告警
   - （可選）每週手動抽查 5 筆資料內容
   - **不需要每日驗證或每月全量重新同步**（簡化版監控）

4. **Claude Code / AI Agent 整合**
   - Supabase 提供 PostgreSQL 標準連接
   - 支援複雜 SQL 查詢（WHERE、JOIN、聚合、窗口函數）
   - 基本索引配置（`customer_name`、`last_synced`）
   - AI 工具能直接查詢並分析 Markdown 格式的互動記錄

**Phase 2/3 未來擴展（成功後考慮）：**

5. **擴展資料範圍**
   - 如果 Phase 1 成功，再同步其他資料（訂單、產品等）
   - 逐步達到 PRD 願景的 20,000 筆完整資料
   - 保持相同的架構模式（CSV 初始化 + 自動同步）

6. **流程遷移（選擇性）**
   - 將部分 Make.com/n8n 自動化流程遷移到 Supabase API
   - 驗證並發查詢效能
   - 建立 AI Agent 自動化工作流程

**Non-Functional Requirements：**

1. **可靠性（Reliability）：**
   - 同步成功率 ≥ 99%（連續 1 個月）
   - 自動重試機制（指數退避，最多 3 次）
   - 失敗時不影響 Airtable 正常運作（影子系統）
   - Email 告警（連續 3 次失敗觸發）

2. **效能（Performance）：**
   - 全量讀取時間：< 30 秒（10,000 筆）
   - Supabase Upsert 時間：< 1 分鐘（批次處理）
   - AI 查詢回應時間：< 2 秒（95 百分位）
   - 支援並發 AI 查詢（多個 Claude Code 視窗同時存取）

3. **資料完整性（Data Integrity）：**
   - 10,000 筆資料 100% 同步準確率
   - Markdown 格式文字完整保留（無截斷、無格式錯亂）
   - 繁體中文、特殊符號、emoji 無亂碼（UTF-8 編碼）
   - 往返一致性：Airtable → Supabase → 讀取 = 100% 相同

4. **可維護性（Maintainability）：**
   - 清楚的錯誤訊息和日誌
   - 同步歷史可追蹤（`sync_history` 表）
   - 簡單的監控介面（日誌查詢）
   - 代碼簡潔（CSV 導入 50 行 + 同步服務 150 行）

5. **成本效益（Cost）：**
   - Zeabur 部署成本：$7-12/月
   - 不增加 Airtable 費用
   - Supabase Free Tier 足夠（10,000 筆資料）

6. **安全性（Security）：**
   - API 金鑰安全管理（Zeabur 環境變數）
   - Supabase Row Level Security（未來考慮，Phase 1 可跳過）

**Scale & Complexity：**

- **Primary domain:** Backend / Data Integration / API Service
- **Complexity level:** Low-Medium（大幅簡化後）
- **Data volume:** 10,000 筆客戶互動資料，每筆約 10,000 字元
- **Estimated architectural components:**
  - CSV 導入腳本（一次性）
  - Airtable API Client（Airtable.js SDK）
  - Data Transformer（Markdown 純文字，UTF-8）
  - Supabase API Client（@supabase/supabase-js）
  - Sync Scheduler（Zeabur Cron Job，每小時觸發）
  - Data Validator（筆數驗證）
  - Monitoring & Alerting（Email 通知）
  - Logger（同步狀態追蹤）

### Technical Constraints & Dependencies

**API 限制：**
- Airtable API 速率限制：每秒 5 次請求
- Airtable 分頁大小：每頁最多 100 筆記錄
- Rich text 欄位格式：Markdown（可直接儲存為 TEXT）

**技術棧約束：**
- 語言：Node.js + TypeScript（已確定）
- Airtable 整合：Airtable.js SDK
- Supabase 整合：@supabase/supabase-js
- 部署平台：Zeabur（已確定）
- 排程機制：Zeabur Cron Job（每小時觸發）

**相容性要求：**
- 必須零干擾現有 Airtable 運作
- CSV 導入期間 Airtable 會繼續編輯（需處理資料一致性）
- Supabase 作為「影子系統」，失敗不能影響正常工作

**未來擴展考量：**
- Phase 2/3 擴展到其他資料（訂單、產品等 10,000+ 筆）
- AI Agent 整合（Claude Code、OpenAI API 等）
- 可能的流程遷移到 Supabase API
- PostgreSQL 標準工具整合（Metabase、Grafana 等）

**資料模型設計約束：**
- Airtable Record ID 作為唯一識別（`airtable_id`）
- 需要 `last_synced` 欄位追蹤同步時間
- 未來擴展時可能需要多 Table 設計（但 Phase 1 單一 Table 即可）

### Cross-Cutting Concerns Identified

1. **錯誤處理和重試策略**
   - 影響所有 API 整合組件（Airtable + Supabase）
   - 需要指數退避重試機制（1 秒、2 秒、4 秒）
   - 網路失敗、速率限制、資料異常的統一處理
   - 最多重試 3 次，失敗後發送 Email 告警

2. **資料驗證和完整性**
   - CSV 導入後：驗證筆數 + 隨機抽樣內容
   - 每次同步後：驗證筆數一致性
   - （可選）每週手動抽查：5 筆資料內容比對
   - 往返驗證：Airtable → Supabase → 讀取 = 100% 相同

3. **UTF-8 編碼處理**
   - 所有資料轉換點必須正確處理繁體中文
   - 特殊符號、emoji 的保留（例如：😊、👍、💯）
   - PostgreSQL 資料庫編碼配置：`UTF8`
   - Node.js 預設 UTF-8，無需額外處理

4. **日誌和可觀察性**
   - 統一日誌格式：`[timestamp] [level] [message]`
   - 同步狀態追蹤（時間戳、筆數、成功/失敗）
   - 錯誤日誌詳細記錄（便於除錯）
   - （可選）Zeabur 日誌查看介面

5. **效能優化**
   - Airtable API 批次處理（分頁邏輯，每頁 100 筆）
   - Supabase 批次 Upsert（減少 API 呼叫次數）
   - 針對 AI 查詢場景的索引設計（`customer_name`、`last_synced`）
   - （未來）針對常用查詢模式建立額外索引

6. **監控和告警（簡化）**
   - 同步失敗即時通知（Email，連續 3 次失敗觸發）
   - 健康檢查端點（可選，供外部監控）
   - 簡單的同步狀態查詢（讀取 `sync_history` 表）

7. **環境配置管理**
   - API 金鑰和 secrets 安全儲存（Zeabur 環境變數）
   - 不同環境配置（開發、測試、生產）
   - `.env` 檔案範本（供本機開發）

8. **可測試性（Murat 的建議）**
   - **UTF-8 繁體中文測試：** 測試資料包含「客戶名稱：王小明，互動記錄：今天討論了產品需求...」
   - **Emoji 測試：** 測試資料包含「客戶反饋：😊 非常滿意！👍」
   - **長文本測試：** 測試 10,000 字元的互動記錄（無截斷）
   - **並發 AI 查詢測試：** 3 個 Claude Code 視窗同時查詢（驗證查詢效能）
   - **往返一致性測試：** Airtable → Supabase → 讀取 = 100% 相同

### Architecture Principles (AI 整合優先)

基於 Mary 的洞察，我們確立以下架構原則：

1. **AI 整合優先**
   - 資料結構設計必須優化「讓 AI 工具輕鬆連接」
   - PostgreSQL 標準連接（不依賴專有 API）
   - 支援複雜 SQL 查詢（AI 工具的核心需求）
   - Markdown 格式保留（AI 能理解和分析）

2. **漸進式擴展**
   - Phase 1 專注於最關鍵的客戶互動資料
   - 成功後再擴展到其他資料
   - 每個階段都有獨立的價值（不依賴未來階段）

3. **簡單優於複雜**
   - CSV 初始化（一次性手動）優於複雜的批次同步
   - 全量同步（10,000 筆，20 秒）優於複雜的增量邏輯
   - 簡化監控（筆數驗證 + Email 告警）優於複雜的監控系統

4. **務實的風險管理**
   - Supabase 作為「影子系統」，失敗不影響 Airtable
   - 簡化的監控策略（連續 3 次失敗才告警）
   - 手動抽查作為備援（每週 5 筆）

### Technical Debt & Trade-offs (Amelia 的提醒)

**Phase 1 的技術取捨：**

1. **全量同步 vs 增量同步**
   - ✅ **選擇：全量同步**（每小時讀取 10,000 筆）
   - 理由：10,000 筆只需 20 秒，複雜度遠低於增量邏輯
   - 技術債務：未來擴展到 100,000+ 筆時，需要改用增量同步

2. **CSV 初始化 vs 自動化初始化**
   - ✅ **選擇：CSV 手動導入**（一次性）
   - 理由：快速驗證可行性，降低初期開發複雜度
   - 技術債務：未來需要自動化完整同步（如果定期需要重新初始化）

3. **簡化監控 vs 完整監控**
   - ✅ **選擇：簡化監控**（筆數驗證 + Email 告警）
   - 理由：Phase 1 MVP，專注核心功能
   - 技術債務：未來可能需要儀表板、Slack 整合、更詳細的日誌

4. **單一 Table vs 正規化設計**
   - ✅ **選擇：單一 Table**（`customer_interactions`）
   - 理由：Phase 1 只有客戶互動資料，無需複雜關聯
   - 技術債務：Phase 2/3 擴展時，需要設計多 Table 結構（訂單、產品等）

**明確的實作限制：**

1. **Airtable Rich Text 格式**
   - Airtable rich text 實際上是 Markdown 格式純文字
   - 可直接儲存為 PostgreSQL `TEXT` 欄位
   - 無需複雜的解析器或轉換邏輯

2. **Airtable 無 `lastModified` 欄位**
   - 不依賴 Airtable 的 `lastModified`（可能不存在）
   - 使用全量同步 + Supabase 端判斷 Upsert
   - 每次同步約 20 秒，可接受

3. **Supabase 批次寫入大小限制**
   - 需要驗證 `@supabase/supabase-js` 的 `upsert()` 批次大小限制
   - 如果有限制，分批 Upsert（例如每批 1,000 筆）
   - 預估 10,000 筆分 10 批，總時間 < 1 分鐘

---

## Starter Template Evaluation

### Primary Technology Domain

**Backend / Data Integration / API Service**

基於專案需求分析，這是一個簡單的資料同步服務：
- CSV 導入腳本（約 50 行代碼）
- 自動同步服務（約 150 行代碼）
- Cron Job 觸發（每小時執行）
- 無 UI 需求，無複雜業務邏輯

### Starter Options Considered

評估了以下 Starter Template 選項：

**選項 1：TypeScript Node.js Starter Template**
- 範例：`npm create typescript-app` 或類似 starter
- 提供完整的 TypeScript 配置和專案結構
- 包含 ESLint、Prettier、測試框架
- **評估結果：** 對於 200 行代碼的專案過於複雜，會引入不需要的依賴和配置

**選項 2：Minimal Setup（從頭建立）**
- 手動初始化 Node.js + TypeScript 專案
- 只安裝必需的依賴（Airtable.js、Supabase.js）
- 自定義專案結構（符合專案需求）
- **評估結果：** 最適合此專案的簡單性和靈活性

### Selected Approach: Minimal Setup（從頭建立）

**選擇理由：**

1. **專案規模小**
   - CSV 導入腳本：50 行代碼
   - 同步服務：150 行代碼
   - 不需要複雜的 starter template 架構

2. **技術棧明確且簡單**
   - 只需要 TypeScript + 2 個 SDK（Airtable.js、Supabase.js）
   - 無需框架（Express、NestJS 等）
   - 無需複雜的建置工具

3. **完全掌控和靈活性**
   - 理解每個配置的作用
   - 未來擴展時不受 starter 限制
   - 易於維護和除錯

4. **避免過度工程**
   - 不引入不需要的依賴
   - 保持代碼庫簡潔
   - 符合「簡單優於複雜」的架構原則

**初始化命令和步驟：**

```bash
# 1. 建立專案目錄
mkdir airtable-sync-to-supabase
cd airtable-sync-to-supabase

# 2. 初始化 Node.js 專案
npm init -y

# 3. 安裝 TypeScript 和類型定義
npm install -D typescript @types/node ts-node

# 4. 安裝核心依賴
npm install airtable @supabase/supabase-js

# 5. 安裝開發工具（可選）
npm install -D eslint prettier

# 6. 初始化 TypeScript 配置
npx tsc --init
```

**專案結構：**

```
airtable-sync-to-supabase/
├── src/
│   ├── csv-import.ts       # CSV 導入腳本（Phase 1A）
│   ├── sync-service.ts     # 同步服務主邏輯（Phase 1B）
│   ├── airtable-client.ts  # Airtable API Client 封裝
│   ├── supabase-client.ts  # Supabase API Client 封裝
│   ├── validator.ts        # 資料驗證邏輯
│   ├── logger.ts           # 日誌工具
│   └── types.ts            # TypeScript 類型定義
├── .env.example            # 環境變數範本
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Architectural Decisions Provided by Minimal Setup

**Language & Runtime:**
- **TypeScript 5.x**（使用最新穩定版）
- **Node.js 18+**（LTS 版本，Zeabur 支援）
- **ES Modules**（`"type": "module"` in package.json）
- **Strict Mode**（`"strict": true` in tsconfig.json）

**Build Tooling:**
- **TypeScript Compiler (tsc)**：編譯 TypeScript 到 JavaScript
- **ts-node**（開發環境）：直接執行 TypeScript
- **無需打包工具**（Webpack、Rollup 等）：專案簡單，直接用 tsc 編譯即可

**Code Organization:**
- **模組化設計**：每個功能獨立為一個檔案
- **清晰的職責分離**：
  - `airtable-client.ts` - 只負責 Airtable API 呼叫
  - `supabase-client.ts` - 只負責 Supabase API 呼叫
  - `sync-service.ts` - 協調同步邏輯
  - `validator.ts` - 資料驗證
  - `logger.ts` - 日誌記錄
- **類型安全**：所有類型定義集中在 `types.ts`

**Development Experience:**
- **本機開發**：使用 `ts-node` 直接執行
- **環境變數管理**：使用 `.env` 檔案（不提交到 Git）
- **代碼格式化**：ESLint + Prettier（可選）
- **簡單的除錯**：使用 `console.log` 和日誌檔案

**Testing Strategy (簡化版 - Murat 的建議):**

**Phase 1：手動測試（足夠）**
- **本機小規模測試**：100 筆測試資料
- **「黃金資料集」測試**：
  - 繁體中文：「客戶名稱：王小明，互動記錄：今天討論了產品需求...」
  - Emoji：「客戶反饋：😊 非常滿意！👍」
  - 長文本：10,000 字元的互動記錄
- **CSV 導入驗證**：筆數對比 + 隨機抽樣 5-10 筆
- **往返一致性測試**：Airtable → Supabase → 讀取 = 100% 相同

**Phase 2：考慮自動化測試（如果專案擴展）**
- 如果代碼量超過 1,000 行
- 再引入 Jest 或其他測試框架
- 針對關鍵邏輯寫單元測試

**避免「過度測試」陷阱：**
- ❌ 不要為 200 行代碼寫 500 行測試
- ❌ 不要因為「有測試框架」就感覺「應該寫測試」
- ✅ 專注於手動測試覆蓋關鍵場景
- ✅ 保持簡單，避免過度工程

**Configuration Management:**

**環境變數**（`.env` 檔案）：
```
AIRTABLE_API_KEY=your_api_key
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=客戶互動
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
EMAIL_ALERT_TO=your_email@example.com
```

**TypeScript 配置**（`tsconfig.json`）：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Deployment Configuration (Zeabur):**
- **Build Command**：`npm run build`（執行 `tsc`）
- **Start Command**：`node dist/sync-service.js`
- **Cron Job 設置**：Zeabur 控制台配置（每小時觸發）
- **環境變數**：在 Zeabur 控制台設置（不使用 `.env`）

**Dependencies:**

**Production Dependencies:**
```json
{
  "airtable": "^0.12.x",
  "@supabase/supabase-js": "^2.x.x"
}
```

**Development Dependencies:**
```json
{
  "typescript": "^5.x.x",
  "@types/node": "^20.x.x",
  "ts-node": "^10.x.x"
}
```

**注意事項：**
- 版本號會在實際初始化時確定（使用最新穩定版）
- Phase 1 保持最小依賴，Phase 2/3 擴展時再添加

### Why Minimal Setup Over Starter Templates

**團隊評估共識（Party Mode 討論成果）：**

**💻 Amelia (開發者) 的分析：**

1. **實測建立時間對比**
   - Minimal Setup：15 分鐘（`npm init` → 安裝依賴 → 寫 `tsconfig.json`）
   - 調整 Starter：30-60 分鐘（理解 starter → 移除不需要的 → 調整配置）

2. **代碼量對比**
   - 典型 TypeScript Starter：50+ 檔案，20+ 依賴
   - 我們的需求：7 個檔案，2 個核心依賴
   - **結論：移除不需要的 > 建立需要的**（時間浪費）

3. **實作簡潔性**
   - CSV 導入：`fs.readFileSync()` + `supabase.from().insert()`
   - 同步服務：`airtable.select()` + `supabase.from().upsert()`
   - 不需要 Express、NestJS 等框架

**唯一風險及解決方案：**
- 風險：TypeScript 配置錯誤
- 解決：提供正確的 `tsconfig.json` 範本（架構文件中已包含）

**🧪 Murat (測試架構師) 的品質風險評估：**

1. **Starter Template 的測試陷阱**
   - 預設測試框架可能不適合（例如：Jest 配置複雜）
   - 有測試框架 → 感覺「應該寫測試」→ 浪費時間
   - 200 行代碼寫 500 行測試 = 過度工程

2. **Minimal Setup 的測試優勢**
   - 避免「為了測試而測試」
   - Phase 1 手動測試足夠（本機測試 + 黃金資料集）
   - Phase 2 擴展時再引入測試框架（務實決策）

3. **手動測試覆蓋率策略**
   - UTF-8 繁體中文測試
   - Emoji 支援測試
   - 長文本測試（10,000 字元）
   - 並發 AI 查詢測試（3 個 Claude Code 視窗）
   - 往返一致性測試

**🚀 Barry (Quick Flow Solo Dev) 的快速驗證策略：**

**這是關鍵洞察！Barry 指出 Phase 1 的真正目標是「快速驗證 AI 整合可行性」**

**Starter Template 拖慢節奏：**
- Day 1：研究 starter 選項（2 小時）
- Day 1-2：調整 starter 配置（4 小時）
- Day 2：開始寫實際代碼
- **總計：浪費 6 小時在「準備工作」上**

**Minimal Setup 的快速節奏：**
- Hour 1：`npm init` + 安裝依賴（15 分鐘）
- Hour 1-2：寫 CSV 導入腳本（45 分鐘）
- Hour 2-3：測試導入，驗證資料
- Hour 3-4：用 Claude Code 測試 AI 分析
- **Day 1 結束：已經驗證核心價值**

### Phase 1A 快速驗證實施順序（Barry 優化版）

**這是最重要的策略調整！**

傳統實施順序可能是：
1. 建立完整專案結構
2. 開發 CSV 導入
3. 開發同步服務
4. 部署到 Zeabur
5. 最後才測試 AI 整合

**Barry 的優化順序（專注於快速驗證核心價值）：**

**Day 1, Hour 1-2：最小可行設置**
1. 建立專案（`npm init` + 安裝依賴）
2. 寫 CSV 導入腳本（50 行）
3. 從 Airtable 手動導出 **100 筆測試資料**（CSV）
   - 不需要全部 10,000 筆
   - 小規模測試更快

**Day 1, Hour 2-3：驗證核心價值**
1. 執行 CSV 導入到 Supabase
2. 驗證資料完整性（筆數 + 隨機抽樣 5 筆）
3. **立即測試 Claude Code 查詢**
   - 連接到 Supabase PostgreSQL
   - 執行簡單查詢：`SELECT * FROM customer_interactions LIMIT 10;`
   - 驗證繁體中文、Markdown 格式正確顯示

**Day 1, Hour 3-4：「值得了」時刻**
1. 用 Claude Code 執行第一次 AI 分析
2. 範例查詢：
   ```
   分析這 100 筆客戶互動記錄，找出：
   1. 最常提到的問題或需求
   2. 客戶情緒趨勢（正面/負面）
   3. 建議的跟進行動
   ```
3. **體驗 AI 與資料對話的能力**
4. **這就是 PRD 中「值得了」的時刻！**

**Day 2+：開發自動同步（有信心後再做）**
1. 此時你已經知道「這個方向是對的」
2. 有了信心，再花時間開發同步服務
3. 開發過程中，隨時可以用 Claude Code 測試新功能

**這個策略的核心價值：**
- ✅ **最快驗證 AI 整合**（Phase 1 的真正目標）
- ✅ **降低風險**（如果 AI 分析不如預期，可以早期調整方向）
- ✅ **建立信心**（看到實際效果後，更有動力繼續開發）
- ✅ **符合 PRD 願景**（AI Agent 整合才是核心，同步只是手段）

**第一個 commit 應該是：**
```
feat: CSV import + Supabase initialization + Claude Code AI analysis test

- CSV import script (50 lines)
- Supabase schema creation
- Test with 100 sample records
- Verified Claude Code can query and analyze data
- RESULT: AI integration works! 🎉
```

**技術債務考量：**

使用 Starter Template 的技術債務：
- ❌ 引入不需要的依賴（增加專案複雜度）
- ❌ 學習和調整 starter 的配置（時間成本）
- ❌ 未來需要移除或重構 starter 提供的功能

使用 Minimal Setup 的優勢：
- ✅ 只有必需的依賴（保持簡潔）
- ✅ 完全理解每個配置（易於維護）
- ✅ 未來擴展時靈活調整（無歷史包袱）
- ✅ **Day 1 就能驗證核心價值**（Barry 的關鍵洞察）

**實作里程碑：**
1. ✅ **Milestone 1**（Day 1）：CSV 導入 + AI 分析驗證（「值得了」時刻）
2. ✅ **Milestone 2**（Day 2-3）：開發同步服務
3. ✅ **Milestone 3**（Day 4-5）：本機測試（完整 10,000 筆）
4. ✅ **Milestone 4**（Day 6-7）：部署到 Zeabur + Cron Job 設置
5. ✅ **Milestone 5**（Week 2-4）：監控穩定性（連續 1 個月 99% 成功率）

**注意：專案初始化使用此 Minimal Setup 應該是第一個實施任務。**

---

## Core Architectural Decisions

### Decision Summary

所有關鍵架構決策已通過協作確定，基於專案的簡單性（200 行代碼的資料同步服務），我們採用務實的決策策略。

**已確定的決策類別：**
1. ✅ Data Architecture（資料架構）
2. ✅ Error Handling & Retry Strategy（錯誤處理和重試策略）
3. ✅ Configuration & Logging（配置和日誌管理）

**跳過的決策類別（不適用於此專案）：**
- ❌ Authentication & Security（無需複雜認證，使用環境變數管理 API 金鑰）
- ❌ API & Communication（內部同步服務，無需對外 API）
- ❌ Frontend Architecture（無 UI 需求）

---

### Decision 1: Data Architecture（資料架構）

**決策：Supabase PostgreSQL Schema 設計**

**Rationale（決策理由）：**
- 單一資料表設計（符合 Phase 1 簡單性）
- 完整欄位映射（Airtable → Supabase）
- 索引優化（支援 AI 查詢場景）
- 同步歷史追蹤（監控和除錯）

**Implementation（實作）：**

```sql
-- 客戶互動資料表
CREATE TABLE customer_interactions (
  id SERIAL PRIMARY KEY,
  airtable_id TEXT UNIQUE NOT NULL,       -- Airtable Record ID（唯一識別）
  customer_name TEXT NOT NULL,             -- 客戶名稱（對應 Airtable「客戶」）
  topic TEXT NOT NULL,                     -- 類別/主題（對應 Airtable「類別」）
  summary_en TEXT,                         -- 英文主題（對應 Airtable「簡述(en)」，查找用）
  summary_cn TEXT,                         -- 中文主題（對應 Airtable「簡述(cn)」，查找用）
  interaction_notes TEXT,                  -- 更新內容（對應 Airtable「更新內容」，Markdown 格式）
  created_at TIMESTAMP DEFAULT NOW(),      -- 建立時間
  updated_at TIMESTAMP DEFAULT NOW(),      -- 更新時間
  last_synced TIMESTAMP DEFAULT NOW()      -- 最後同步時間
);

-- 索引（優化 AI 查詢效能）
CREATE INDEX idx_customer_name ON customer_interactions(customer_name);
CREATE INDEX idx_topic ON customer_interactions(topic);
CREATE INDEX idx_summary_en ON customer_interactions(summary_en);
CREATE INDEX idx_summary_cn ON customer_interactions(summary_cn);
CREATE INDEX idx_airtable_id ON customer_interactions(airtable_id);
CREATE INDEX idx_last_synced ON customer_interactions(last_synced);

-- 同步歷史追蹤表（監控用）
CREATE TABLE sync_history (
  id SERIAL PRIMARY KEY,
  sync_time TIMESTAMP DEFAULT NOW(),
  records_checked INT,                     -- 檢查的記錄數
  records_inserted INT,                    -- 新增的記錄數
  records_updated INT,                     -- 更新的記錄數
  records_failed INT,                      -- 失敗的記錄數
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT                       -- 錯誤訊息（如果失敗）
);
```

**Airtable → Supabase 欄位對應：**

| Airtable 欄位 | Supabase 欄位 | 資料類型 | 必填 | 索引 | 說明 |
|--------------|--------------|---------|------|------|------|
| Record ID | airtable_id | TEXT | ✅ | ✅ UNIQUE | 唯一識別，用於 Upsert |
| 客戶 | customer_name | TEXT | ✅ | ✅ | 客戶名稱，AI 查詢常用 |
| 類別 | topic | TEXT | ✅ | ✅ | 主題分類，AI 查詢常用 |
| 簡述(en) | summary_en | TEXT | ❌ | ✅ | 英文主題，搜尋和索引用 |
| 簡述(cn) | summary_cn | TEXT | ❌ | ✅ | 中文主題，搜尋和索引用 |
| 更新內容 | interaction_notes | TEXT | ❌ | ❌ | Markdown 格式，約 10,000 字元 |

**Key Design Decisions（關鍵設計決策）：**

1. **`airtable_id` 作為唯一識別**
   - 用於 Upsert 操作（`ON CONFLICT (airtable_id) DO UPDATE`）
   - 避免重複記錄
   - 支援增量同步

2. **`interaction_notes` 使用 TEXT 類型**
   - 支援 Markdown 格式（Airtable rich text）
   - 無長度限制（支援 10,000+ 字元）
   - 繁體中文、emoji 完整保留（UTF-8）

3. **多重索引優化 AI 查詢**
   - `customer_name`：「查找特定客戶的所有互動」
   - `topic`：「分析特定類別的客戶需求」
   - `summary_en` / `summary_cn`：「搜尋包含特定關鍵字的記錄」
   - `last_synced`：除錯和驗證同步狀態

4. **`sync_history` 獨立追蹤表**
   - 監控同步成功率
   - 記錄失敗原因（`error_message`）
   - 支援同步狀態查詢和告警

**Affects（影響的組件）：**
- CSV 導入腳本（需要對應欄位）
- 同步服務（Upsert 邏輯）
- 資料驗證邏輯
- AI 查詢效能

---

### Decision 2: Error Handling & Retry Strategy（錯誤處理和重試策略）

**決策：指數退避重試機制 + Email 告警**

**Rationale（決策理由）：**
- 網路不穩定時自動重試（避免單次失敗導致同步中斷）
- 指數退避避免過度重試（保護 API 速率限制）
- Email 告警確保關鍵失敗被及時發現

**Implementation（實作）：**

**重試機制（指數退避）：**

```typescript
/**
 * 指數退避重試邏輯
 * @param fn 要執行的函數
 * @param maxRetries 最大重試次數（預設 3 次）
 * @returns 函數執行結果
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // 最後一次重試失敗，拋出錯誤
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // 計算延遲時間：1秒、2秒、4秒
      const delayMs = Math.pow(2, attempt) * 1000;
      console.log(`[RETRY] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }

  // TypeScript 類型安全（不應該到達這裡）
  throw new Error('Retry logic error');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**使用範例：**

```typescript
// Airtable API 呼叫（帶重試）
const records = await retryWithBackoff(async () => {
  return await airtableClient.select().all();
});

// Supabase Upsert（帶重試）
await retryWithBackoff(async () => {
  return await supabase.from('customer_interactions').upsert(data);
});
```

**錯誤分類和處理策略：**

| 錯誤類型 | 處理策略 | 重試次數 | 告警 |
|---------|---------|---------|------|
| 網路錯誤（Network Error） | 重試 | 3 次 | 連續 3 次失敗 → Email |
| API 速率限制（Rate Limit） | 延遲後重試 | 3 次 | 連續 3 次失敗 → Email |
| 資料格式錯誤（Data Format） | 記錄並跳過 | 0 次 | 立即 Email（資料問題） |
| 認證失敗（Auth Error） | 不重試 | 0 次 | 立即 Email（配置問題） |

**Email 告警觸發條件：**

1. **連續 3 次同步失敗**
   - 觸發條件：`sync_history` 表中連續 3 筆 `status = 'failed'`
   - Email 內容：包含最後一次的 `error_message`
   - 行動建議：檢查 API 金鑰、網路連接、Zeabur 日誌

2. **資料完整性驗證失敗**
   - 觸發條件：Airtable 筆數 ≠ Supabase 筆數（誤差 > 5 筆）
   - Email 內容：Airtable 筆數 vs Supabase 筆數
   - 行動建議：手動檢查資料差異

**Email 發送實作（簡化版）：**

```typescript
// 使用 Nodemailer 或 Zeabur Email Service
async function sendAlert(subject: string, message: string) {
  // TODO: 實作 Email 發送邏輯
  console.error(`[ALERT] ${subject}: ${message}`);
  // 實際部署時使用 Nodemailer 或其他 Email 服務
}
```

**Affects（影響的組件）：**
- Airtable API Client（所有 API 呼叫）
- Supabase API Client（所有 Upsert 操作）
- 同步服務主邏輯（錯誤處理流程）
- 監控和告警模組

---

### Decision 3: Configuration & Logging（配置和日誌管理）

**決策：環境變數配置 + 簡化日誌（console.log）**

**Rationale（決策理由）：**
- 環境變數分離（本機開發 vs 生產環境）
- 簡化日誌（Phase 1 不需要複雜日誌框架）
- 保持代碼簡潔（避免過度工程）

**Implementation（實作）：**

**環境變數配置：**

**本機開發（`.env` 檔案）：**
```bash
# Airtable 配置
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=客戶互動

# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Email 告警配置
EMAIL_ALERT_TO=your_email@example.com

# 環境
NODE_ENV=development
```

**生產環境（Zeabur 控制台設置）：**
- 在 Zeabur 專案設置中配置相同的環境變數
- 不使用 `.env` 檔案（安全性考量）

**環境變數載入（TypeScript）：**

```typescript
// src/config.ts
export const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY!,
    baseId: process.env.AIRTABLE_BASE_ID!,
    tableName: process.env.AIRTABLE_TABLE_NAME || '客戶互動',
  },
  supabase: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
  },
  email: {
    alertTo: process.env.EMAIL_ALERT_TO!,
  },
  env: process.env.NODE_ENV || 'development',
};

// 驗證必需的環境變數
function validateConfig() {
  const required = [
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID',
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'EMAIL_ALERT_TO',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

validateConfig();
```

**日誌策略（簡化版）：**

**Phase 1 使用簡單的 console.log：**

```typescript
// src/logger.ts
export const logger = {
  info: (message: string) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`);
  },

  success: (message: string) => {
    console.log(`[${new Date().toISOString()}] [SUCCESS] ${message}`);
  },

  warn: (message: string) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`);
  },

  error: (message: string, error?: Error) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`);
    if (error) {
      console.error(error.stack);
    }
  },
};
```

**使用範例：**

```typescript
import { logger } from './logger';

// 同步開始
logger.info('開始同步客戶互動資料...');

// 同步成功
logger.success(`同步完成：新增 ${insertCount} 筆，更新 ${updateCount} 筆`);

// 同步警告
logger.warn('部分記錄格式異常，已跳過 3 筆');

// 同步失敗
logger.error('同步失敗：Airtable API 連接超時', error);
```

**日誌輸出範例：**

```
[2026-01-01T10:00:00.000Z] [INFO] 開始同步客戶互動資料...
[2026-01-01T10:00:05.123Z] [INFO] 從 Airtable 讀取資料中...
[2026-01-01T10:00:25.456Z] [SUCCESS] 讀取完成：10,000 筆記錄
[2026-01-01T10:00:30.789Z] [INFO] 寫入 Supabase...
[2026-01-01T10:01:15.234Z] [SUCCESS] 同步完成：新增 50 筆，更新 100 筆
```

**Zeabur 日誌查看：**
- Zeabur 控制台提供即時日誌查看
- 可以搜尋和過濾日誌（ERROR、WARN 等）
- 保留最近 7 天日誌

**Phase 2 考慮升級（如果需要）：**
- 引入 Winston 或 Pino 日誌框架
- 日誌等級配置（DEBUG、INFO、WARN、ERROR）
- 日誌檔案輸出（而非只有 console）
- 結構化日誌（JSON 格式）

**Affects（影響的組件）：**
- 所有模組（統一使用 logger）
- 部署配置（Zeabur 環境變數設置）
- 本機開發環境（`.env` 檔案）

---

### Decision Impact Analysis（決策影響分析）

**Implementation Sequence（實作順序）：**

基於決策的依賴關係，建議的實作順序：

1. **環境配置設置**（Decision 3）
   - 建立 `.env.example` 範本
   - 實作 `config.ts`（環境變數載入和驗證）
   - 實作 `logger.ts`（簡化日誌）

2. **資料庫 Schema 建立**（Decision 1）
   - 在 Supabase 執行 SQL 建立 `customer_interactions` 表
   - 建立 `sync_history` 表
   - 建立所有索引

3. **錯誤處理工具**（Decision 2）
   - 實作 `retryWithBackoff` 函數
   - 實作 Email 告警邏輯（簡化版）

4. **CSV 導入腳本**（使用上述決策）
   - 讀取 CSV
   - 驗證欄位對應
   - 寫入 Supabase（使用 retry 機制）

5. **同步服務**（使用上述決策）
   - Airtable API Client（使用 retry 機制）
   - Supabase Upsert（使用 retry 機制）
   - 同步狀態記錄（寫入 `sync_history`）

**Cross-Component Dependencies（跨組件依賴）：**

```
config.ts
  ↓
  ├─→ airtable-client.ts（依賴 Airtable 配置）
  ├─→ supabase-client.ts（依賴 Supabase 配置）
  └─→ logger.ts（依賴環境判斷）

logger.ts
  ↓
  └─→ 所有模組（統一日誌輸出）

retryWithBackoff
  ↓
  ├─→ airtable-client.ts（API 呼叫重試）
  └─→ supabase-client.ts（Upsert 重試）

Schema (customer_interactions)
  ↓
  ├─→ csv-import.ts（欄位對應）
  ├─→ sync-service.ts（Upsert 目標）
  └─→ validator.ts（資料驗證）
```

**Critical Path（關鍵路徑）：**

```
環境配置 → Schema 建立 → 錯誤處理 → CSV 導入 → 同步服務
```

所有決策都是**關鍵決策**（必須在實作前確定），無法延遲或跳過。

---

