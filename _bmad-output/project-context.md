---
project_name: 'airtable syc to Supabase'
user_name: 'Liaosanyi'
date: '2026-01-08'
sections_completed: ['technology_stack', 'critical_rules', 'code_patterns', 'architectural_decisions']
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Language:** TypeScript 5.9.3 (Strict mode, target ES2022)
- **Database/Backend:** Supabase (@supabase/supabase-js 2.89.0)
- **Data Source:** Airtable (airtable 0.12.2)
- **Email Service:** Resend (resend 6.6.0)
- **Data Parsing:** csv-parse 6.1.0, csv-stringify 6.6.0
- **Dev Tools:** ts-node 10.9.2, dotenv 17.2.3

## Critical Implementation Rules

1. **UTF-8 Preservation:** It is CRITICAL to preserve UTF-8 encoding for Traditional Chinese characters and Emojis (e.g., 😊, 👍) during exports, transforms, and imports.
2. **Sync Identification:** Always use the Airtable `Record ID` (stored as `airtable_id` in Supabase) as the unique identifier for `UPSERT` operations.
3. **ESM Usage:** The project uses ES Modules. All imports must include file extensions if required by the runtime, and `package.json` must maintain `"type": "module"`.
4. **Environment Variables:** Secrets (Airtable API Key, Supabase Key, Resend API Key) must never be hardcoded. Use `process.env` and `dotenv` for local development.

## Code Patterns & Conventions

1. **File Naming:** Use `kebab-case` for file names (e.g., `airtable-export-v2.ts`).
2. **Client Modularity:** Database and API clients are centralized in `src/` (e.g., `supabase-client.ts`, `email-service.ts`, `logger.ts`). Use these shared instances instead of recreating clients.
3. **Script Entry Points:** New features should be added as scripts in `src/` and registered in `package.json` under `scripts`.
4. **Error Handling:** Use the `retryWithBackoff` pattern for API calls to handle network instability or rate limits.

## Architectural Decisions

1. **Shadow System:** Supabase acts as a shadow system to Airtable. Sync failures must not affect the source Airtable data.
2. **Minimalist Architecture:** Prefer simple TypeScript scripts over complex frameworks (like Express or NestJS) unless a web serving capability is explicitly required.
3. **Sync History:** All automated sync processes must log to the `sync_history` table for audit and monitoring.
