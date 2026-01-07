/**
 * Airtable Export Script
 *
 * Export Airtable records to CSV format
 *
 * Usage:
 *   npm run airtable-export
 */

import Airtable from 'airtable';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { logger } from './logger.js';
import type { AirtableRecord } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Escape CSV field (handle quotes and commas)
 */
function escapeCSV(value: any): string {
  if (!value) return '';

  // Convert to string if not already
  let strValue = '';
  if (typeof value === 'string') {
    strValue = value;
  } else if (Array.isArray(value)) {
    strValue = value.join(', ');
  } else if (typeof value === 'object') {
    strValue = JSON.stringify(value);
  } else {
    strValue = String(value);
  }

  // Replace double quotes with two double quotes
  const escaped = strValue.replace(/"/g, '""');

  // Wrap in quotes if contains comma, newline, or quotes
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }

  return escaped;
}

/**
 * Convert Airtable records to CSV
 */
function convertToCSV(records: AirtableRecord[]): string {
  // CSV header
  let csv = 'airtable_id,customer_name_country,categories,summary_en,summary_cn,update_content\n';

  // CSV rows
  for (const record of records) {
    const fields = record.fields;

    const row = [
      record.id,
      fields['客戶'] || '',
      fields['類別'] || '',
      fields['簡述(en)'] || '',
      fields['簡述(cn)'] || '',
      fields['更新內容'] || '',
    ].map(escapeCSV);

    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Main export function
 */
async function main() {
  try {
    logger.info('=== Airtable Export Started ===');

    // Initialize Airtable
    const base = new Airtable({ apiKey: config.airtable.apiKey }).base(
      config.airtable.baseId
    );

    // Use Table ID if available, otherwise use Table Name
    const tableIdentifier = config.airtable.tableId || config.airtable.tableName;
    logger.info(`Fetching records from: ${tableIdentifier} (${config.airtable.tableName})`);

    // Fetch records (limit to 100 for testing)
    const records: AirtableRecord[] = [];

    await base(tableIdentifier)
      .select({
        maxRecords: 100,
        // You can add filters here if needed
        // filterByFormula: "...
      })
      .eachPage((pageRecords, fetchNextPage) => {
        pageRecords.forEach((record) => {
          records.push({
            id: record.id,
            fields: record.fields as any,
            createdTime: record.get('createdTime') as string,
          });
        });

        fetchNextPage();
      });

    logger.success(`Fetched ${records.length} records from Airtable`);

    // Convert to CSV
    logger.info('Converting to CSV format...');
    const csv = convertToCSV(records);

    // Write to file
    const outputPath = path.join(__dirname, '../test-data/sample.csv');
    fs.writeFileSync(outputPath, csv, 'utf-8');

    logger.success(`CSV file created: ${outputPath}`);
    logger.success('=== Export Complete ===');

  } catch (error) {
    logger.error('Export failed:', error as Error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

// Run
main();
