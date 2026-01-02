/**
 * Airtable API Diagnostic Tool
 * Help diagnose API connection and permission issues
 */

import Airtable from 'airtable';
import { config } from './config.js';
import { logger } from './logger.js';

async function diagnose() {
  logger.info('🔍 Airtable API Diagnostic Tool');
  logger.info('================================\n');

  // Step 1: Check configuration
  logger.info('Step 1: Configuration Check');
  console.log(`  API Key: ${config.airtable.apiKey.substring(0, 20)}...`);
  console.log(`  Base ID: ${config.airtable.baseId}`);
  console.log(`  Table Name: ${config.airtable.tableName}`);
  console.log(`  Table ID: ${config.airtable.tableId || 'Not set'}\n`);

  // Step 2: Try to connect to base
  logger.info('Step 2: Base Connection Test');
  try {
    const airtable = new Airtable({ apiKey: config.airtable.apiKey });
    const base = airtable.base(config.airtable.baseId);
    logger.success('  ✅ Base initialized successfully\n');

    // Step 3: Skip - Airtable.js doesn't support listing bases
    logger.info('Step 3: Skipping base listing (not supported by SDK)\n');

    // Step 4: Try to fetch records with Table ID
    logger.info('Step 4: Fetching Records (using Table ID)');
    try {
      const records: any[] = [];
      await base(config.airtable.tableId!)
        .select({ maxRecords: 3 })
        .eachPage((pageRecords, fetchNextPage) => {
          pageRecords.forEach((record) => records.push(record));
          fetchNextPage();
        });

      logger.success(`  ✅ Successfully fetched ${records.length} records using Table ID!`);
      if (records.length > 0) {
        console.log(`  Sample record ID: ${records[0].id}\n`);
      }
    } catch (error: any) {
      logger.error(`  ❌ Failed with Table ID: ${error.error || error.message}`);
      console.log(`  Status: ${error.statusCode}`);
      console.log(`  Message: ${error.message}\n`);
    }

    // Step 5: Try to fetch records with Table Name
    logger.info('Step 5: Fetching Records (using Table Name)');
    try {
      const records: any[] = [];
      await base(config.airtable.tableName)
        .select({ maxRecords: 3 })
        .eachPage((pageRecords, fetchNextPage) => {
          pageRecords.forEach((record) => records.push(record));
          fetchNextPage();
        });

      logger.success(`  ✅ Successfully fetched ${records.length} records using Table Name!`);
      if (records.length > 0) {
        console.log(`  Sample record ID: ${records[0].id}\n`);
      }
    } catch (error: any) {
      logger.error(`  ❌ Failed with Table Name: ${error.error || error.message}`);
      console.log(`  Status: ${error.statusCode}`);
      console.log(`  Message: ${error.message}\n`);
    }

  } catch (error: any) {
    logger.error('Failed to initialize base:', error);
  }

  logger.info('\n=== Diagnostic Complete ===');
  logger.info('\nNext steps:');
  console.log('  1. Check if the Token has "data.records:read" scope');
  console.log('  2. Check if the Token has access to Base: ' + config.airtable.baseId);
  console.log('  3. Verify the Table ID is correct: ' + config.airtable.tableId);
  console.log('  4. Consider manually exporting CSV from Airtable as a workaround');
}

diagnose();
