/**
 * CSV Import Script
 *
 * Usage:
 *   npm run csv-import
 *
 * CSV format expected:
 *   airtable_id,customer_id,customer_name,categories,summary_en,summary_cn,interaction_notes
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
import { upsertCustomerInteractions, getRecordCount } from './supabase-client.js';
import type { CustomerInteraction } from './types.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse CSV file manually (simple implementation)
 */
function parseCSV(filePath: string): CustomerInteraction[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim());
  logger.info(`CSV Header: ${header.join(', ')}`);

  // Parse rows
  const records: CustomerInteraction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Handle CSV with quoted fields (simple parser)
    const values = parseCSVLine(line);

    if (values.length !== header.length) {
      logger.warn(`Line ${i + 1} has ${values.length} fields, expected ${header.length}. Skipping.`);
      continue;
    }

    const record: CustomerInteraction = {
      airtable_id: values[0] || '',
      customer_id: values[1] || undefined,
      customer_name: values[2] || '',
      categories: values[3] || '',
      summary_en: values[4] || undefined,
      summary_cn: values[5] || undefined,
      interaction_notes: values[6] || undefined,
    };

    // Validate required fields (only airtable_id and customer_name are required)
    if (!record.airtable_id || !record.customer_name) {
      logger.warn(`Line ${i + 1} missing required fields. Skipping.`);
      continue;
    }

    records.push(record);
  }

  return records;
}

/**
 * Simple CSV line parser (handles quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push last value
  values.push(current.trim());

  return values;
}

/**
 * Main import function
 */
async function main() {
  try {
    logger.info('=== CSV Import Started ===');

    // CSV file path
    const csvPath = path.join(__dirname, '../test-data/sample.csv');

    if (!fs.existsSync(csvPath)) {
      logger.error(`CSV file not found: ${csvPath}`);
      logger.info('Please create test-data/sample.csv with your Airtable export');
      process.exit(1);
    }

    // Get current record count
    const beforeCount = await getRecordCount();
    logger.info(`Current records in Supabase: ${beforeCount}`);

    // Parse CSV
    logger.info('Parsing CSV file...');
    const records = parseCSV(csvPath);
    logger.info(`Parsed ${records.length} records from CSV`);

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
