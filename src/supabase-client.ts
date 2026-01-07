/**
 * Supabase client wrapper
 */

import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import type { CustomerInteraction, SyncHistory } from './types.js';

// Initialize Supabase client
export const supabase = createClient(config.supabase.url, config.supabase.key);

/**
 * Insert or update customer interactions in batch
 */
export async function upsertCustomerInteractions(
  records: CustomerInteraction[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Batch size: 1000 records per batch (Supabase limit)
  const batchSize = 1000;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    try {
      console.log(`[${new Date().toISOString()}] [INFO] Processing batch ${Math.floor(i / batchSize) + 1}...`);
      const { error } = await supabase
        .from('customer_interactions')
        .upsert(batch, {
          onConflict: 'airtable_id',
        });

      if (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] Batch upsert error details:`, JSON.stringify(error, null, 2));
        failed += batch.length;
      } else {
        success += batch.length;
        console.log(`[${new Date().toISOString()}] [SUCCESS] Batch ${Math.floor(i / batchSize) + 1} synced successfully.`);
      }
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] [ERROR] Batch processing unexpected error:`, error?.message || error);
      failed += batch.length;
    }
  }

  return { success, failed };
}

/**
 * Get total count of records in customer_interactions
 */
export async function getRecordCount(): Promise<number> {
  const { count, error } = await supabase
    .from('customer_interactions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting record count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Record sync history
 */
export async function recordSyncHistory(history: SyncHistory): Promise<void> {
  const { error } = await supabase.from('sync_history').insert([history]);

  if (error) {
    console.error('Error recording sync history:', error);
  }
}

/**
 * Get recent sync failures (last N records with status='failed')
 */
export async function getRecentFailures(limit: number = 3): Promise<SyncHistory[]> {
  const { data, error } = await supabase
    .from('sync_history')
    .select('*')
    .eq('status', 'failed')
    .order('sync_time', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting recent failures:', error);
    return [];
  }

  return data || [];
}
