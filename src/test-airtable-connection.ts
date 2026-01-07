/**
 * Test Airtable API connection
 */

import Airtable from 'airtable';
import { config } from './config.js';

async function testAirtableConnection() {
  console.log('🔍 Testing Airtable API Connection\n');
  console.log('='.repeat(80) + '\n');

  console.log('📋 Configuration:');
  console.log(`   Base ID: ${config.airtable.baseId}`);
  console.log(`   Table ID: ${config.airtable.tableId || 'N/A'}`);
  console.log(`   Table Name: ${config.airtable.tableName || 'N/A'}`);
  console.log(`   API Key: ${config.airtable.apiKey.substring(0, 20)}...`);
  console.log('');

  try {
    // Initialize Airtable
    const airtable = new Airtable({ apiKey: config.airtable.apiKey });
    const base = airtable.base(config.airtable.baseId);

    // Try using Table ID first
    const tableIdentifier = config.airtable.tableId || config.airtable.tableName;

    console.log(`🔗 Attempting to connect to table: ${tableIdentifier}\n`);

    // Test 1: Fetch first record
    console.log('Test 1: Fetching first record...');
    const records = await base(tableIdentifier)
      .select({
        maxRecords: 1,
      })
      .firstPage();

    if (records && records.length > 0) {
      console.log('✅ Success! Connection works.');
      console.log(`   Retrieved record ID: ${records[0].id}`);
      console.log(`   Fields: ${Object.keys(records[0].fields).join(', ')}`);
      console.log('');

      // Test 2: Get field details
      console.log('Test 2: Analyzing table schema...');
      const firstRecord = records[0];
      console.log('   Available fields:');
      Object.keys(firstRecord.fields).forEach(field => {
        const value = firstRecord.fields[field];
        const type = Array.isArray(value) ? 'Array' : typeof value;
        console.log(`   - ${field}: ${type}`);
      });
      console.log('');

      // Test 3: Check 客戶 field specifically
      console.log('Test 3: Checking "客戶" (Customer) field...');
      const customerField = firstRecord.fields['客戶'];
      if (customerField) {
        console.log(`   ✅ "客戶" field exists`);
        console.log(`   Type: ${Array.isArray(customerField) ? 'Array (Linked Records)' : typeof customerField}`);
        console.log(`   Value: ${JSON.stringify(customerField)}`);
      } else {
        console.log('   ⚠️  "客戶" field not found in this record');
      }
      console.log('');

      console.log('='.repeat(80));
      console.log('\n✅ Airtable API connection is working!\n');
      return true;
    } else {
      console.log('⚠️  No records found in the table.');
      console.log('   This might mean:');
      console.log('   - The table is empty');
      console.log('   - The table identifier is incorrect');
      console.log('');
      return false;
    }
  } catch (error: any) {
    console.log('❌ Connection failed!\n');
    console.log('Error details:');
    console.log(`   Type: ${error.error || error.name}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Status Code: ${error.statusCode || 'N/A'}`);
    console.log('');

    console.log('🔧 Troubleshooting:');
    if (error.statusCode === 403 || error.error === 'NOT_AUTHORIZED') {
      console.log('   ❌ 403 NOT_AUTHORIZED Error');
      console.log('');
      console.log('   Possible causes:');
      console.log('   1. API Key is invalid or expired');
      console.log('   2. API Key does not have permission to access this base/table');
      console.log('   3. Table ID or name is incorrect');
      console.log('');
      console.log('   Solutions:');
      console.log('   1. Verify your API Key at: https://airtable.com/create/tokens');
      console.log('   2. Check that the API Key has access to this base');
      console.log('   3. Verify Base ID and Table ID/Name are correct');
      console.log('');
      console.log('   How to get correct values:');
      console.log('   - Base ID: Open your base → Help → API documentation');
      console.log('   - Table ID: In the URL or API docs');
    } else if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
      console.log('   ❌ 404 NOT_FOUND Error');
      console.log('');
      console.log('   The base or table does not exist.');
      console.log('   Please check:');
      console.log('   - AIRTABLE_BASE_ID is correct');
      console.log('   - AIRTABLE_TABLE_ID or AIRTABLE_TABLE_NAME is correct');
    } else if (error.statusCode === 401 || error.error === 'AUTHENTICATION_REQUIRED') {
      console.log('   ❌ 401 AUTHENTICATION Error');
      console.log('');
      console.log('   API Key is missing or invalid.');
      console.log('   Please regenerate your API Key at: https://airtable.com/create/tokens');
    }

    console.log('');
    return false;
  }
}

testAirtableConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
