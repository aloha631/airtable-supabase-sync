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
import { supabase, upsertCustomerInteractions } from './supabase-client.js';
import type { CustomerInteraction } from './types.js';

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

  const customerName = getValue(fields['客戶名稱+國家']);

  // Skip records without customer name (internal documents)
  if (!customerName) {
    return null;
  }

  return {
    airtable_id: record.id,
    customer_id: getValue(fields['客戶']),
    customer_name: customerName,
    categories: getValue(fields['類別']) || undefined,
    summary_en: getValue(fields['簡述(en)']) || undefined,
    summary_cn: getValue(fields['簡述(cn)']) || undefined,
    interaction_notes: getValue(fields['更新內容']) || undefined,
  };
}

/**
 * Perform incremental sync
 */
export async function incrementalSync() {
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

    // Fetch records
    const allRecords: any[] = [];
    logger.info('Fetching records from Airtable...');

    // Use filterByFormula to get only modified records if we have a last sync time
    const selectOptions: any = {};

    // Note: Airtable doesn't support filtering by createdTime via API
    // We'll fetch all records and filter in-memory, or use a "Last Modified" field if available
    // For now, fetching all and comparing is the most reliable approach

    await base(tableIdentifier)
      .select(selectOptions)
      .eachPage((pageRecords, fetchNextPage) => {
        allRecords.push(...pageRecords);
        if (allRecords.length % 100 === 0) {
          logger.info(`  Fetched ${allRecords.length} records so far...`);
        }
        fetchNextPage();
      });

    logger.success(`Fetched ${allRecords.length} total records from Airtable\n`);

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

    if (recordsToSync.length === 0) {
      logger.success('✅ No changes detected. Database is up to date!');
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
      return;
    }

    // Upsert to Supabase
    logger.info('Syncing to Supabase...');
    const { success, failed } = await upsertCustomerInteractions(interactions);

    // Summary
    logger.success('\n=== Incremental Sync Complete ===');
    logger.success(`Total records checked: ${allRecords.length}`);
    logger.success(`Modified/New records: ${recordsToSync.length}`);
    logger.success(`Valid records to sync: ${interactions.length}`);
    logger.success(`Successfully synced: ${success}`);
    if (failed > 0) {
      logger.warn(`Failed: ${failed}`);
    }

    logger.success('\n✅ Database is now up to date!');

  } catch (error) {
    logger.error('Incremental sync failed:', error as Error);
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
