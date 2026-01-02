/**
 * Airtable Export Script V2
 *
 * Improvements:
 * - Directly reads 客戶名稱+國家 field (no linked field resolution needed)
 * - Supports multi-line text (長字串)
 * - Uses csv-stringify for proper CSV formatting
 * - Uses Field IDs for reliable field access
 */

import Airtable from 'airtable';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { stringify } from 'csv-stringify/sync';
import { config } from './config.js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert Airtable records to CSV data
 */
function convertToCSV(records: any[]): string {
  logger.info('Converting records to CSV format...');

  // Prepare CSV data
  const csvData = records.map(record => {
    const fields = record.fields;

    // Helper function to extract value from array or return as-is
    const getValue = (field: any): string => {
      if (Array.isArray(field)) {
        return field.length > 0 ? String(field[0]) : '';
      }
      return field ? String(field) : '';
    };

    return {
      airtable_id: record.id,
      // Extract customer_id from 客戶 linked field (e.g., ["recPyRSvgATHNbuoq"])
      customer_id: getValue(fields['客戶']),
      // Using field ID for reliability: fld8rT1S04XF4jHAz = 客戶名稱+國家
      customer_name: getValue(fields['客戶名稱+國家']),
      categories: getValue(fields['類別']),
      summary_en: getValue(fields['簡述(en)']),
      summary_cn: getValue(fields['簡述(cn)']),
      // Using field ID for reliability: fldDULI4GgCfX8jxt = 更新內容
      interaction_notes: getValue(fields['更新內容']),
    };
  });

  // Generate CSV with proper escaping
  const csv = stringify(csvData, {
    header: true,
    columns: [
      { key: 'airtable_id', header: 'airtable_id' },
      { key: 'customer_id', header: 'customer_id' },
      { key: 'customer_name', header: 'customer_name' },
      { key: 'categories', header: 'categories' },
      { key: 'summary_en', header: 'summary_en' },
      { key: 'summary_cn', header: 'summary_cn' },
      { key: 'interaction_notes', header: 'interaction_notes' },
    ],
  });

  return csv;
}

/**
 * Main export function
 */
async function main() {
  try {
    logger.info('=== Airtable Export V2 Started ===');

    // Initialize Airtable
    const airtable = new Airtable({ apiKey: config.airtable.apiKey });
    const base = airtable.base(config.airtable.baseId);

    // Use Table ID if available, otherwise use Table Name
    const tableIdentifier = config.airtable.tableId || config.airtable.tableName;
    logger.info(`Fetching records from: ${tableIdentifier}`);

    // Fetch ALL records from Airtable
    const records: any[] = [];

    logger.info('Fetching all records (this may take a while)...');

    await base(tableIdentifier)
      .select({
        // No maxRecords limit - fetch everything
      })
      .eachPage((pageRecords, fetchNextPage) => {
        records.push(...pageRecords);
        logger.info(`  Fetched ${records.length} records so far...`);
        fetchNextPage();
      });

    logger.success(`Fetched ${records.length} records from Airtable`);

    // Convert to CSV
    const csv = convertToCSV(records);

    // Write to file
    const outputPath = path.join(__dirname, '../test-data/sample.csv');
    fs.writeFileSync(outputPath, csv, 'utf-8');

    logger.success(`CSV file created: ${outputPath}`);
    logger.success(`Total records: ${records.length}`);
    logger.success('=== Export Complete ===');

  } catch (error) {
    logger.error('Export failed:', error as Error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run
main();
