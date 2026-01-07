stepsCompleted: [1, 2, 3]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md']
workflowType: 'epics'
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
FR9: Provide standard PostgreSQL connection for Claude Code/AI tools to query and analyze data.

### NonFunctional Requirements

NFR1: Reliability: Sync success rate ≥ 99% over 1 month.
NFR2: Performance: Full read of 10,000 records < 30 seconds.
NFR3: Performance: Supabase upsert < 1 minute for 10,000 records.
NFR4: Performance: AI query response time < 2 seconds (95th percentile).
NFR5: Error Handling: Exponential backoff for API retries (max 3 retries).
NFR6: Monitoring: Email alert after 3 consecutive sync failures.
NFR7: Security: Manage API keys securely via Zeabur environment variables.
NFR8: Cost: Maintain Zeabur deployment costs within $7-12/month.

### Additional Requirements

- **Setup**: Minimalist Node.js + TypeScript environment (no heavy frameworks).
- **Data Model**: specific `customer_interactions` table with indexes for `customer_name`, `topic`, `summary_en`, `summary_cn`, `airtable_id`, and `last_synced`.
- **Deployment**: Configured as a Zeabur Cron Job (scheduling every hour).
- **Constraint**: Phase 1 is backend-only; ignore UI/UX requirements.
- **Support**: Must use Supabase Free Tier for up to 10,000 records.

### FR Coverage Map

FR1: Epic 1 - Initialize Supabase from CSV [DONE]
FR2: Epic 1 - Node.js import script [DONE]
FR3: Epic 2 - Hourly automated sync [DONE]
FR4: Epic 2 - Airtable API pagination/limits [DONE]
FR5: Epic 2 - Supabase Upsert logic [DONE]
FR6: Epic 2 - Markdown format preservation [DONE]
FR7: Epic 1 & 2 - UTF-8 Support [DONE]
FR8: Epic 3 - Sync history & logs [REQUIRED]
FR9: Epic 3 - AI-ready indexes & connection [REQUIRED]

## Epic List

### Epic 1: 數據奠基與初始搬家 (Project Foundation & Initial Migration) [DONE]
Liaosanyi 可以立即在 Supabase 中查詢到現有的全量客戶數據，開始體驗「數據自由」。
**FRs covered:** FR1, FR2, FR7

### Epic 2: 自動化持續同步 (Continuous Data Synchronization) [DONE]
Airtable 中的新數據會每小時自動出現在 Supabase，無需手動維護。
**FRs covered:** FR3, FR4, FR5, FR6, FR7

### Epic 3: 監控告警與 AI 準備 (Monitoring, Alerting & AI Readiness) [DONE]
Liaosanyi 可以確信數據是新鮮且正確的，並能流暢地使用 AI Agent 進行複雜分析。
**FRs covered:** FR8, FR9

## Epic 1: 數據奠基與初始搬家 (Project Foundation & Initial Migration) [DONE]

Liaosanyi 可以立即在 Supabase 中查詢到現有的全量客戶數據，開始體驗「數據自由」。

### Story 1.1: 建立極簡開發環境與 Supabase Schema [DONE]
As a 開發者,
I want 建立一個最小化的 TypeScript 開發環境並配置 Supabase 資料表,
So that 我可以開始進行數據導入工作。

**Acceptance Criteria:**
- **Given** 項目資料夾已建立
- **When** 執行 `npm init` 並安裝 `typescript` 與 `supabase-js`
- **Then** `tsconfig.json` 配置正確且 `customer_interactions` 資料表在 Supabase 中建立成功。

### Story 1.2: 開發 CSV 導入腳本並完成初始搬家 [DONE]
As a Liaosanyi,
I want 透過腳本將 Airtable 導出的 CSV 快速導入 Supabase,
So that 我可以立即擁有自主掌控的數據庫。

**Acceptance Criteria:**
- **Given** 包含客戶互動數據的 CSV 檔案已備妥
- **When** 執行導入腳本
- **Then** 全量數據成功寫入 Supabase，且筆數與 CSV 一致。

## Epic 2: 自動化持續同步 (Continuous Data Synchronization) [DONE]

Airtable 中的新數據會每小時自動出現在 Supabase，無需手動維護。

### Story 2.1: 實現 Airtable API 抓取與分頁邏輯 [DONE]
As a 系統服務,
I want 穩定地從 Airtable 抓取分頁數據,
So that 不會因為單次抓取過多或速率限制而失敗。

**Acceptance Criteria:**
- **Given** Airtable API 金鑰已配置
- **When** 讀取 10,000 筆數據
- **Then** 系統能正確處理每頁 100 筆的分頁，且每秒請求不超過 5 次。

### Story 2.2: 實現基於 ID 的增量 Upsert 同步 [DONE]
As a Liaosanyi,
I want 系統只更新有變動或新增的記錄,
So that 同步過程高效且不會造成數據重複。

**Acceptance Criteria:**
- **Given** Airtable 與 Supabase 數據已存在
- **When** 同步服務執行時
- **Then** 系統利用 `airtable_id` 進行比對，成功執行 `UPSERT` 操作，保留最新內容，且保留 Airtable 原有的 Markdown 格式。

### Story 2.3: 處理 Airtable 連結欄位 (Link Data) [TO DO]
As a 系統服務,
I want 將 Airtable 的連結欄位（Linked Records）正確解析並儲存為 JSONB,
So that 數據結構在 Supabase 中保持清晰且具備擴展性。

**Acceptance Criteria:**
- **Given** Airtable 欄位中包含連結（陣列格式）
- **When** 執行同步腳本時
- **Then** 系統自動提取連結 ID 陣列，並以 JSONB 格式寫入 `customer_interactions` 資料表的對應欄位。
- **Then** 驗收需包含對「繁體中文」與「Emoji」內容的 100% 正確還原驗證。

### Story 2.4: 部署至 Zeabur 並設置 Cron Job [DONE]
As a Liaosanyi,
I want 同步服務在雲端穩定運行並按時觸發,
So that 我不需要開著電腦也能保持數據同步。

**Acceptance Criteria:**
- **Given** 代碼已處理好環境變數並上傳 Github
- **When** 在 Zeabur 部署為排程任務 (Cron Service)
- **Then** 服務在 Zeabur 成功啟動，且能按設定的間隔自動運行。

## Epic 3: 監控告警與 AI 準備 (Monitoring, Alerting & AI Readiness) [IN PROGRESS]

Liaosanyi 可以確信數據是新鮮且正確的，並能流暢地使用 AI Agent 進行複雜分析。

### Story 3.1: 實現同步歷史記錄表與日誌系統 [DONE]
As a Liaosanyi,
I want 系統自動記錄每次同步的狀態與筆數,
So that 我可以隨時查閱同步是否正常運行。

**Acceptance Criteria:**
- **Given** Supabase 中已有 `sync_history` 資料表
- **When** 同步任務執行結束後
- **Then** 系統自動寫入一筆包含時間、成功筆數、失敗原因的記錄。

### Story 3.2: 實現關鍵失敗 Email 自動告警 [DONE]
As a Liaosanyi,
I want 在同步連續失敗時收到郵件通知,
So that 我能在第一時間發現問題並修復。

**Acceptance Criteria:**
- **Given** 已配置發件服務與收件郵箱
- **When** 系統記錄到連續 3 次同步失敗
- **Then** 自動發送一封包含具體錯誤訊息的 Email 給 Liaosanyi。

### Story 3.3: 數據索引優化與 AI 查詢驗證 [DONE]
As a AI 分析師,
I want 資料庫具備針對查詢優化的索引,
So that Claude Code 能在大規模數據下快速返回分析結果。

**Acceptance Criteria:**
- **Given** Supabase 資料庫已運行
- **When** 在 `customer_name` 與 `categories` 等欄位建立索引後
- **Then** 執行複雜 SQL 查詢的回應時間小於 2 秒 (95th percentile)。
