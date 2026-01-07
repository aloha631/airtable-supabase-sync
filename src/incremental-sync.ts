/**
 * Incremental Sync - Only sync changed records
 *
 * Strategy:
 * 1. Get last sync time from Supabase (or use a cutoff date)
 * 2. Fetch Airtable records modified after that time
 * 3. Upsert only changed records to Supabase
 */

import Airtable from 'airtable';
import { config } from './config.js';
import { logger } from './logger.js';
import { supabase, upsertCustomerInteractions, recordSyncHistory } from './supabase-client.js';
import { checkAndSendAlert } from './alert-checker.js';
import type { CustomerInteraction, SyncHistory } from './types.js';

/**
 * Get the latest sync time from Supabase
 */
async function getLastSyncTime(): Promise<Date | null> {
  try {
    // Get the most recent last_synced timestamp
    const { data, error } = await supabase
      .from('customer_interactions')
      .select('last_synced')
      .order('last_synced', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      logger.warn('No previous sync time found, will do full sync');
      return null;
    }

    const lastSynced = data[0].last_synced;
    if (!lastSynced) {
      return null;
    }

    return new Date(lastSynced);
  } catch (error) {
    logger.warn('Failed to get last sync time');
    console.error(error);
    return null;
  }
}

/**
 * Convert Airtable record to CustomerInteraction
 */
function convertRecord(record: any): CustomerInteraction | null {
  const fields = record.fields;

  // Helper function to extract value from array or return as-is
  const getValue = (field: any): string => {
    if (Array.isArray(field)) {
      return field.length > 0 ? String(field[0]) : '';
    }
    return field ? String(field) : '';
  };

  // Helper function to extract linked record IDs as array
  const getLinkedIds = (field: any): string[] => {
    if (Array.isArray(field)) {
      // Filter out empty values and convert to strings
      return field.filter(id => id).map(id => String(id));
    }
    if (field) {
      return [String(field)];
    }
    return [];
  };

  const customerName = getValue(fields['客戶名稱+國家']);

  // Skip records without customer name (internal documents)
  if (!customerName) {
    return null;
  }

  // Extract linked customer IDs
  const linkedCustomers = getLinkedIds(fields['客戶']);

  return {
    airtable_id: record.id,
    linked_customers: getLinkedIds(fields['客戶']),
    customer_name_country: customerName,
    categories: getValue(fields['類別']) || undefined,
    summary_en: getValue(fields['簡述(en)']) || undefined,
    summary_cn: getValue(fields['簡述(cn)']) || undefined,
    summary_idioma: getValue(fields['簡述(Idioma)']) || undefined,
    update_content: getValue(fields['更新內容']) || undefined,
    update_content_idioma: getValue(fields['更新內容(客戶語言)']) || undefined,
    airtable_last_modified: getValue(fields['最後更新']) || undefined,
  };
}

/**
 * Perform incremental sync
 */
export async function incrementalSync() {
  const syncStartTime = new Date();
  let recordsChecked = 0;
  let recordsToSyncCount = 0;
  let syncSuccess = 0;
  let syncFailed = 0;

  try {
    logger.info('=== Incremental Sync Started ===\n');

    // Get last sync time
    const lastSyncTime = await getLastSyncTime();

    if (lastSyncTime) {
      logger.info(`Last sync was at: ${lastSyncTime.toISOString()}`);
      logger.info(`Fetching records modified after: ${lastSyncTime.toISOString()}\n`);
    } else {
      logger.warn('No previous sync found. Performing full sync.\n');
    }

    // Initialize Airtable
    const airtable = new Airtable({ apiKey: config.airtable.apiKey });
    const base = airtable.base(config.airtable.baseId);
    const tableIdentifier = config.airtable.tableId || config.airtable.tableName;

    // Fetch records with progress logging
    const allRecords: any[] = [];
    logger.info('Fetching records from Airtable...');

    await base(tableIdentifier).select({}).eachPage((pageRecords, fetchNextPage) => {
      allRecords.push(...pageRecords);
      logger.info(`  ...Fetched ${allRecords.length} records so far`);
      fetchNextPage();
    });

    recordsChecked = allRecords.length;
    logger.success(`Successfully fetched ${allRecords.length} total records from Airtable\n`);

    // Filter records based on last sync time
    let recordsToSync = allRecords;

    if (lastSyncTime) {
      // Filter by checking "最後更新" field or createdTime
      recordsToSync = allRecords.filter(record => {
        // Check if record has a "最後更新" (Last Updated) field
        // Supports both ISO format (e.g., "2023-02-17T10:30:00.000Z")
        // and simple date format (e.g., "2023-02-17")
        const lastUpdated = record.fields['最後更新'];
        if (lastUpdated) {
          try {
            const updateDate = new Date(lastUpdated);
            // Validate the date is valid
            if (!isNaN(updateDate.getTime()) && updateDate > lastSyncTime) {
              return true;
            }
          } catch (e) {
            // If date parsing fails, include the record to be safe
            logger.warn(`Failed to parse date for record ${record.id}: ${lastUpdated}`);
            return true;
          }
        }

        // Fallback: check createdTime (for newly created records)
        const createdTime = record._rawJson?.createdTime || record.createdTime;
        if (createdTime) {
          const createdDate = new Date(createdTime);
          if (createdDate > lastSyncTime) {
            return true;
          }
        }

        return false;
      });

      logger.info(`Filtered to ${recordsToSync.length} modified/new records\n`);
    }

    recordsToSyncCount = recordsToSync.length;

    if (recordsToSync.length === 0) {
      logger.success('✅ No changes detected. Database is up to date!');

      // Record successful sync with no changes
      await recordSyncHistory({
        records_checked: recordsChecked,
        records_inserted: 0,
        records_updated: 0,
        records_failed: 0,
        status: 'success',
      });

      return;
    }

    // Convert to CustomerInteraction format
    logger.info('Converting records...');
    const interactions: CustomerInteraction[] = [];

    for (const record of recordsToSync) {
      const interaction = convertRecord(record);
      if (interaction) {
        interactions.push(interaction);
      }
    }

    logger.info(`Converted ${interactions.length} valid records\n`);

    if (interactions.length === 0) {
      logger.success('✅ No valid records to sync.');

      // Record sync with no valid records
      await recordSyncHistory({
        records_checked: recordsChecked,
        records_inserted: 0,
        records_updated: 0,
        records_failed: 0,
        status: 'success',
      });

      return;
    }

    // Upsert to Supabase
    logger.info('Syncing to Supabase...');
    const { success, failed } = await upsertCustomerInteractions(interactions);

    syncSuccess = success;
    syncFailed = failed;

    // Summary
    logger.success('\n=== Incremental Sync Summary ===');
    logger.success(`- Total records fetched from Airtable: ${recordsChecked}`);
    logger.success(`- Records modified/new since last sync: ${recordsToSyncCount}`);
    logger.success(`- Valid records processed for sync: ${interactions.length}`);
    logger.success(`- Successfully synced to Supabase: ${syncSuccess}`);

    if (syncFailed > 0) {
      logger.error(`- Failed to sync records: ${syncFailed}`);

      // Record partial failure
      await recordSyncHistory({
        records_checked: recordsChecked,
        records_inserted: 0,
        records_updated: syncSuccess,
        records_failed: syncFailed,
        status: 'partial',
        error_message: `${syncFailed} records failed in Supabase upsert`,
      });

      // Check for consecutive failures and send alert if needed
      await checkAndSendAlert();

      throw new Error(`Sync partially failed: ${syncFailed} records failed.`);
    }

    // Record successful sync
    await recordSyncHistory({
      records_checked: recordsChecked,
      records_inserted: 0,
      records_updated: syncSuccess,
      records_failed: 0,
      status: 'success',
    });

    logger.success('\n✅ Incremental Sync Completed Successfully!');

  } catch (error) {
    logger.error('Incremental sync failed during execution:', error as Error);

    // Record complete failure if not already recorded (e.g., from network error)
    // We use a flag or check if history was already recorded in this run
    // For simplicity, we just record it here if we haven't reached the success block
    await recordSyncHistory({
      records_checked: recordsChecked,
      records_inserted: 0,
      records_updated: syncSuccess,
      records_failed: syncFailed || (recordsToSyncCount > 0 ? recordsToSyncCount : 0),
      status: 'failed',
      error_message: error instanceof Error ? error.message : String(error),
    });

    // Check for consecutive failures and send alert if needed
    await checkAndSendAlert();

    throw error;
  }
}

// Run if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith('incremental-sync.js')) {
  incrementalSync()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
