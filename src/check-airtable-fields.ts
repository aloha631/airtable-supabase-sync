/**
 * Check Airtable record fields including metadata
 */

import Airtable from 'airtable';
import { config } from './config.js';
import { logger } from './logger.js';

async function checkFields() {
  try {
    logger.info('=== Checking Airtable Record Fields ===\n');

    const airtable = new Airtable({ apiKey: config.airtable.apiKey });
    const base = airtable.base(config.airtable.baseId);
    const tableIdentifier = config.airtable.tableId || config.airtable.tableName;

    // Fetch just 1 record to inspect
    const records: any[] = [];

    await base(tableIdentifier)
      .select({
        maxRecords: 1,
      })
      .eachPage((pageRecords, fetchNextPage) => {
        records.push(...pageRecords);
        fetchNextPage();
      });

    if (records.length === 0) {
      logger.warn('No records found');
      return;
    }

    const record = records[0];

    logger.info('Sample Record Structure:');
    console.log('─'.repeat(80));
    console.log('\n📋 Record ID:', record.id);
    console.log('\n🕐 Metadata:');
    console.log('  - createdTime:', record._rawJson?.createdTime || 'N/A');

    console.log('\n📝 Fields:');
    Object.keys(record.fields).forEach(fieldName => {
      const value = record.fields[fieldName];
      const type = Array.isArray(value) ? 'array' : typeof value;
      const preview = Array.isArray(value)
        ? `[${value.length} items]`
        : typeof value === 'string' && value.length > 50
          ? value.substring(0, 50) + '...'
          : String(value);

      console.log(`  - ${fieldName} (${type}): ${preview}`);
    });

    console.log('\n🔍 Full Record (JSON):');
    console.log(JSON.stringify(record._rawJson, null, 2));

    logger.success('\n✅ Field inspection complete!');

  } catch (error) {
    logger.error('Check failed:', error as Error);
    process.exit(1);
  }
}

checkFields();
