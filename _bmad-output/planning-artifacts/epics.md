stepsCompleted: [1, 2, 3]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md']
lastStep: 3
---

# airtable syc to Supabase - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for airtable syc to Supabase, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Initialize Supabase data from Airtable CSV (Phase 1A).
FR2: Develop Node.js script for manual CSV data import into Supabase.
FR3: Perform automated incremental sync from Airtable to Supabase every hour (Node.js + Zeabur Cron).
FR4: Implement Airtable API integration with handling for pagination (100 records/page) and rate limits (5 req/sec).
FR5: Implement Supabase integration for record upsert using Airtable Record ID as the unique identifier.
FR6: Preserve rich text Markdown format during sync (up to 10,000 characters).
FR7: Support UTF-8 encoding for Traditional Chinese, special characters, and emojis.
FR8: Track sync status (timestamp, count, success/failure) in a `sync_history` table.
FR9: Provide standard PostgreSQL connection for Gemini/AI tools to query and analyze data.
FR10: 多使用者 Email 與密碼認證：整合 Supabase Auth 提供每位使用者獨立登入憑證。
FR11: 首頁混合式佈局：上方顯示查詢框，下方顯示前 10 筆 AI 推薦聯繫名單。
FR12: 國家篩選功能：允許使用者在首頁依據國家過濾客戶與分析結果。
FR13: 浮動式互動視窗 (Popup UI)：支援電腦與手機瀏覽的彈出式對話視窗。
FR14: 「Sync Now」立即同步：提供手動觸發按鈕，立即執行增量同步並回饋進度。
FR15: 行動追蹤 (To-Do)：允許對推薦名單標記「已處理/未處理」，紀錄決策回饋。
FR16: 自動化郵件草稿 (中英對照)：根據洞察生成英文郵件，並附帶繁體中文翻譯。
FR17: 熱絡度智能分析 (權重排序)：優先分析機器規格與報價討論，降級零件報價。
FR18: 資訊一致性偵測：AI 自動比對歷史紀錄，偵測客戶需求轉向或說法矛盾並警示。
FR19: 引用標註 (Citation)：AI 的所有洞察與判斷必須引用原始 `update_content` 資料點。

### NonFunctional Requirements

NFR1: Reliability: Sync success rate ≥ 99% over 1 month.
NFR2: Performance: Full read of 10,000 records < 30 seconds.
NFR3: Performance: Supabase upsert < 1 minute for 10,000 records.
NFR4: Performance: AI query response time < 2 seconds (95th percentile).
NFR5: Error Handling: Exponential backoff for API retries (max 3 retries).
NFR6: Monitoring: Email alert after 3 consecutive sync failures.
NFR7: Security: Manage API keys securely via Zeabur environment variables.
NFR8: Cost: Maintain Zeabur deployment costs within $7-12/month.
NFR9: 同步失敗 UI 紅色告警：連續 3 次增量同步失敗後，首頁顯示顯眼警告標示。
NFR10: AI 洞察準確率評分系統：提供 1-5 星或讚/踩機制供使用者回饋 AI 品質，目標準確率 > 60%。
NFR11: 斷點續傳韌性：同步失敗後能從最後一個 Checkpoint 恢復，確保大容量資料穩定性。

### Additional Requirements

- **UI Framework**: Recommended Next.js/React with Tailwind for the floating popup UI.
- **Authentication**: Use Supabase Auth for Email/Password logic.
- **Database Extension**: Add `actions_tracking` table to store "Processed" states.
- **Incremental Sync**: Implementation must handle `Checkpointing` for reliability.
- **Language**: AI must respond in the same language as the query; email drafts are EN + TW translation.

### FR Coverage Map

FR1: Epic 1 - Initialize Supabase from CSV
FR2: Epic 1 - CSV Import Script
FR3: Epic 2 - Hourly Automated Sync
FR4: Epic 2 - Airtable API Pagination/Limits
FR5: Epic 2 - Robust Upsert Logic
FR6: Epic 2 - Markdown Format Preservation
FR7: Epic 1 & 2 - UTF-8 Support
FR8: Epic 2 - Sync History Tracking
FR9: Epic 1 - SQL Access for AI Tools
FR10: Epic 5 - Multi-user Auth (Supabase Auth)
FR11: Epic 3 - Interactive Home Layout
FR12: Epic 5 - Country Filter Integration
FR13: Epic 3 - Floating Popup UI
FR14: Epic 5 - "Sync Now" Button & Feedback
FR15: Epic 4 - Action Tracking (To-Do)
FR16: Epic 3 - Automated Email (EN+TW)
FR17: Epic 4 - Hotness Analysis (Weighted)
FR18: Epic 4 - Consistency Detection
FR19: Epic 3 - Citation (Source Attribution)

## Epic List

### Epic 1: 資料基礎與起始搬家 (Data Foundation & Initial Migration) [DONE]
讓使用者能立即在自主掌控的 Supabase 中查詢並分析全量歷史資料，整合 Gemini 分析。
**FRs covered:** FR1, FR2, FR7, FR9

### Epic 2: 強韌自動同步引擎 (Robust Automated Sync Engine) [DONE]
確保 Airtable 異動能自動反映至 Supabase，支援 Markdown 與增量同步。
**FRs covered:** FR3, FR4, FR5, FR6, FR7, FR8

### Epic 3: 智能互動介面 (AI Interactive Workspace) [IN PROGRESS]
建立隨時待命的浮動視窗，讓使用者能透過自然語言直接篩選 Supabase 資料，並獲得帶有引用與翻譯的草稿回覆。
**FRs covered:** FR11, FR13, FR16, FR19

### Epic 4: 業務洞察與主動推薦 (Advanced Business Insights)
利用 AI 分析 **「最近一個月內」** 的互動紀錄，主動生成重點推薦名單並偵測需求一致性。
**FRs covered:** FR15, FR17, FR18

## Epic 3: 智能互動介面 (AI Interactive Workspace)

建立隨時待命的浮動視窗，讓使用者能透過自然語言直接篩選 Supabase 資料，並獲得帶有引用與翻譯的草稿回覆。

### Story 3.1: 極簡浮動介面實作 (Floating UI Shell)
As a Liaosanyi,
I want 在頁面上有一個可隨時喚起或隱藏的浮動對話框,
So that 我可以在不離開當前工作流的情況下開始 AI 查詢。

**Acceptance Criteria:**
- **Given** 使用者已進入應用程式
- **When** 點擊懸浮按鈕
- **Then** 顯示包含「客戶名稱、國家、查詢事項」輸入框與「國家篩選」選單的對話視窗。
- **And** 介面佈局符合 PRD 的「上方輸入、下方推薦」結構。

### Story 3.2: 基於 Supabase 資料的 AI 語義查詢
As a Liaosanyi,
I want 輸入客戶名稱或問題後，AI 直接查詢 Supabase 資料庫,
So that 我能獲得基於真實互動歷史的總結，而不是 AI 的隨機猜測。

**Acceptance Criteria:**
- **Given** Supabase 中已有更新內容 (update_content)
- **When** 使用者提交查詢事項
- **Then** 系統檢索相關紀錄，AI 產出與查詢語系一致的內容總結。
- **And** 每個回覆必須透過「💡」或小標註引用原始資料來源。

### Story 3.3: 自動生成中英對照郵件草稿
As a Liaosanyi,
I want AI 幫我寫完英文郵件草稿後，下方自動附上繁體中文翻譯,
So that 我能快速核對郵件內容的精準度，並一鍵複製發送。

**Acceptance Criteria:**
- **Given** AI 已產出查詢總結與行動建議
- **When** 點擊「生成後續郵件」按鈕
## Epic 4: 業務洞察與主動推薦 (Advanced Business Insights)

利用 AI 分析 **「最近一個月內」** 的互動紀錄，主動生成重點推薦名單並偵測需求一致性。

### Story 4.1: 基於熱絡度權重的「今日推薦名單」(一個月內限定)
As a Liaosanyi,
I want 系統每天自動篩選「最近一個月有互動」且包含「設備規格/報價」討論的客戶,
So that 我能專注在最有希望成交的高價值機會，而不是浪費時間在低權重的零件詢價。

**Acceptance Criteria:**
- **Given** Supabase 資料庫中有歷史互動紀錄
- **When** 啟動推薦引擎
- **Then** 系統檢索 `NOW() - INTERVAL '1 month'` 內的資料，並根據「設備規格 > 設備報價 > 一般諮詢 > 零件報價」的權重進行排序。
- **And** 在首頁下方顯示 Top 10 名單，並附上由 AI 總結的「行動理由」。

### Story 4.2: 資訊一致性偵測與警示
As a Liaosanyi,
I want AI 主動提醒我客戶說法是否前後矛盾,
So that 我能識別潛在的訂單風險或客戶需求轉向。

**Acceptance Criteria:**
- **Given** 同一客戶在一個月內有多筆互動紀錄
- **When** 進行 AI 查詢或產出推薦名單時
- **Then** AI 自動比對歷史紀錄，若發現客戶在不同時間點對「預算、交期、規格」有顯著矛盾，則顯示黃色警示標籤並說明原因。

### Story 4.3: 推薦名單的標記與決策回饋 (Action Tracking)
As a Liaosanyi,
I want 點擊推薦名單旁的按鈕標記「已處理/未處理」，
So that 我能管理每日追蹤進度，並讓系統知道這次推薦是否對我有用。

**Acceptance Criteria:**
- **Given** 首頁顯示推薦名單
- **When** 點擊處理按鈕
- **Then** `actions_tracking` 資料表即時更新該紀錄狀態。
- **And** 介面即時反應視覺狀態（如：變淡或顯示勾選圖標）。

## Epic 5: 安全管理與監控體系 (Security, Management & Monitoring)

提供多人安全登入、區域化篩選、以及即時同步狀態監測。

### Story 5.1: 多使用者登入與權限隔離 (Supabase Auth)
As a 管理員,
I want 使用 Email 和密碼進行登入，並確保每個人只能看到各自區域的資料,
So that 系統能安全地提供給不同國家的業務代表使用。

**Acceptance Criteria:**
- **Given** 已進入系統入口頁面
- **When** 使用者登入
- **Then** 透過 Supabase Auth 進行驗證。
- **And** 登入後首頁根據使用者帳號權限或「國家篩選 (FR12)」設定，自動載入對應區域的客戶資料。

### Story 5.2: 全域「同步失敗」紅色告警與手動控制
As a Liaosanyi,
I want 在同步連續失敗時看到顯眼的警告，並能一鍵手動嘗試修復,
So that 我不會在資料過期的情況下做出錯誤決策。

**Acceptance Criteria:**
- **Given** `sync_history` 顯示連續 3 次同步失敗 (Status: Failed)
- **When** 進入應用程式首頁
- **Then** 頂部顯示紅色警告列「連線同步失敗，資料可能非最新」。
- **And** 紅色警告列旁提供「Sync Now」按鈕，點擊後觸發 `incremental-sync.ts` 運行並顯示進度條。
