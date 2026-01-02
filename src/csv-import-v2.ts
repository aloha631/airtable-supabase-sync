/**
 * CSV Import Script V2
 *
 * Improvements:
 * - Uses csv-parse for proper multi-line text support
 * - Updated to use 'categories' instead of 'topic'
 * - Better error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { logger } from './logger.js';
import { upsertCustomerInteractions, getRecordCount } from './supabase-client.js';
import type { CustomerInteraction } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse CSV file using csv-parse library
 */
function parseCSV(filePath: string): CustomerInteraction[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Parse CSV with proper support for quoted fields and multi-line text
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  });

  logger.info(`Parsed ${records.length} records from CSV`);

  // Convert to CustomerInteraction format
  const interactions: CustomerInteraction[] = [];

  for (const record of records) {
    const r = record as any;

    // Validate required fields (only airtable_id and customer_name are required)
    if (!r.airtable_id || !r.customer_name) {
      logger.warn(`Skipping record with missing required fields: ${JSON.stringify(record)}`);
      continue;
    }

    interactions.push({
      airtable_id: r.airtable_id,
      customer_id: r.customer_id || undefined,
      customer_name: r.customer_name,
      categories: r.categories || undefined,
      summary_en: r.summary_en || undefined,
      summary_cn: r.summary_cn || undefined,
      interaction_notes: r.interaction_notes || undefined,
    });
  }

  return interactions;
}

/**
 * Main import function
 */
async function main() {
  try {
    logger.info('=== CSV Import V2 Started ===');

    // CSV file path
    const csvPath = path.join(__dirname, '../test-data/sample.csv');

    if (!fs.existsSync(csvPath)) {
      logger.error(`CSV file not found: ${csvPath}`);
      logger.info('Please run: npm run airtable-export');
      process.exit(1);
    }

    // Get current record count
    const beforeCount = await getRecordCount();
    logger.info(`Current records in Supabase: ${beforeCount}`);

    // Parse CSV
    logger.info('Parsing CSV file...');
    const records = parseCSV(csvPath);

    if (records.length === 0) {
      logger.warn('No valid records to import');
      process.exit(0);
    }

    // Sample first record (for verification)
    logger.info('Sample record:');
    console.log(JSON.stringify(records[0], null, 2));

    // Import to Supabase
    logger.info('Importing to Supabase...');
    const { success, failed } = await upsertCustomerInteractions(records);

    // Get new record count
    const afterCount = await getRecordCount();

    // Summary
    logger.success('=== Import Complete ===');
    logger.success(`Total records processed: ${records.length}`);
    logger.success(`Successfully imported: ${success}`);
    if (failed > 0) {
      logger.warn(`Failed: ${failed}`);
    }
    logger.success(`Records in Supabase: ${beforeCount} → ${afterCount}`);

  } catch (error) {
    logger.error('Import failed:', error as Error);
    process.exit(1);
  }
}

// Run
main();
