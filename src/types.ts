/**
 * Type definitions for Airtable sync to Supabase
 */

// Airtable Record structure
export interface AirtableRecord {
  id: string;
  fields: {
    客戶: string[] | string;  // Can be array of record IDs (linked field) or string
    類別: string;
    '簡述(en)'?: string;
    '簡述(cn)'?: string;
    更新內容?: string;
    // Expanded fields for linked records
    '客戶名稱'?: string;  // Customer name from linked record
    '國家'?: string;      // Country from linked record
  };
  createdTime: string;
}

// Supabase customer_interactions table structure
export interface CustomerInteraction {
  id?: number;
  airtable_id: string;
  customer_id?: string;   // Airtable 客戶 record ID (e.g., "recPyRSvgATHNbuoq")
  customer_name: string;  // Format: "客戶名稱 + 國家"
  categories?: string;    // Renamed from 'topic' to 'categories' (optional)
  summary_en?: string;
  summary_cn?: string;
  interaction_notes?: string;
  created_at?: string;
  updated_at?: string;
  last_synced?: string;
}

// Sync history record
export interface SyncHistory {
  id?: number;
  sync_time?: string;
  records_checked: number;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
}

// CSV import row structure
export interface CSVRow {
  airtable_id: string;
  customer_id?: string;   // Airtable 客戶 record ID
  customer_name: string;
  categories?: string;    // Renamed from 'topic' to 'categories' (optional)
  summary_en?: string;
  summary_cn?: string;
  interaction_notes?: string;
}
