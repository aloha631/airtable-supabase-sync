/**
 * Full Sync - Update all records with customer_name and country fields
 *
 * This script fetches all records from Airtable and updates Supabase
 * with the separated customer_name and country fields.
 */

import 'dotenv/config';
import Airtable from 'airtable';
import { config } from './config.js';
import { logger } from './logger.js';
import { supabase } from './supabase-client.js';

async function fullSyncNames() {
  logger.info('=== Full Sync (customer_name & country) Started ===\n');

  try {
    // Initialize Airtable
    const airtable = new Airtable({ apiKey: config.airtable.apiKey });
    const base = airtable.base(config.airtable.baseId);
    const tableIdentifier = config.airtable.tableId || config.airtable.tableName;

    // Fetch all records
    logger.info('Fetching all records from Airtable...');
    const allRecords: any[] = [];

    await base(tableIdentifier).select({}).eachPage((records, fetchNextPage) => {
      allRecords.push(...records);
      logger.info(`  ...Fetched ${allRecords.length} records so far`);
      fetchNextPage();
    });

    logger.success(`Total records fetched: ${allRecords.length}\n`);

    // Helper function
    const getValue = (field: any): string => {
      if (Array.isArray(field)) {
        return field.length > 0 ? String(field[0]) : '';
      }
      return field ? String(field) : '';
    };

    // Convert records - only extract name fields for update
    const interactions = allRecords
      .map(record => {
        const fields = record.fields;
        const customerNameCountry = getValue(fields['客戶名稱+國家']);
        const customerName = getValue(fields['客戶名稱']);
        const country = getValue(fields['國家']);

        if (!customerNameCountry && !customerName) return null;

        return {
          airtable_id: record.id,
          customer_name_country: customerNameCountry || `${customerName} (${country})`,
          customer_name: customerName || null,
          country: country || null,
        };
      })
      .filter(Boolean);

    logger.info(`Valid records to update: ${interactions.length}`);
    logger.info('Updating Supabase...\n');

    // Batch upsert
    const batchSize = 500;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < interactions.length; i += batchSize) {
      const batch = interactions.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;

      const { error } = await supabase
        .from('customer_interactions')
        .upsert(batch as any[], { onConflict: 'airtable_id' });

      if (error) {
        logger.error(`Batch ${batchNum} failed: ${error.message}`);
        failed += batch.length;
      } else {
        success += batch.length;
        logger.success(`Batch ${batchNum} completed (${success}/${interactions.length})`);
      }
    }

    logger.success('\n=== Full Sync Complete ===');
    logger.success(`Successfully updated: ${success} records`);
    if (failed > 0) {
      logger.error(`Failed: ${failed} records`);
    }

  } catch (error) {
    logger.error('Full sync failed:', error as Error);
    throw error;
  }
}

// Run
fullSyncNames()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
