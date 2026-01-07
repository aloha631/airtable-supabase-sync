/**
 * Check existing JSONB linked_customers data
 */

import { supabase } from './supabase-client.js';

async function checkJSONBData() {
  console.log('🔍 Checking JSONB linked_customers in existing data\n');
  console.log('='.repeat(80) + '\n');

  // Get total count
  const { count } = await supabase
    .from('customer_interactions')
    .select('*', { count: 'exact', head: true });

  console.log(`Total records in database: ${count || 0}\n`);

  // Get records with linked_customers data
  const { data: records, error } = await supabase
    .from('customer_interactions')
    .select('airtable_id, customer_name, customer_id, linked_customers')
    .not('linked_customers', 'is', null)
    .order('last_synced', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Records with linked_customers: ${records?.length || 0}\n`);
  console.log('-'.repeat(80));

  if (records && records.length > 0) {
    records.forEach((record, index) => {
      console.log(`\n[${index + 1}] ${record.customer_name}`);
      console.log(`    Airtable ID: ${record.airtable_id}`);
      console.log(`    Old customer_id: ${record.customer_id || 'N/A'}`);
      console.log(`    New linked_customers: ${JSON.stringify(record.linked_customers)}`);

      if (Array.isArray(record.linked_customers)) {
        console.log(`    ✅ Format: JSONB Array`);
        console.log(`    📊 Count: ${record.linked_customers.length} link(s)`);

        if (record.linked_customers.length > 1) {
          console.log(`    🎯 Multiple links detected!`);
        }
      } else {
        console.log(`    ⚠️  Format: Not an array`);
      }
    });
  } else {
    console.log('\n⚠️  No records with linked_customers found.');
    console.log('This is expected if migration just completed and no sync has run yet.');
  }

  console.log('\n' + '='.repeat(80));

  // Check for records with multiple links
  const allRecords = await supabase
    .from('customer_interactions')
    .select('airtable_id, customer_name, linked_customers')
    .not('linked_customers', 'is', null);

  if (allRecords.data) {
    const multiLinked = allRecords.data.filter(
      r => Array.isArray(r.linked_customers) && r.linked_customers.length > 1
    );

    console.log(`\n📊 Statistics:`);
    console.log(`   Total records: ${count || 0}`);
    console.log(`   Records with linked_customers: ${allRecords.data.length}`);
    console.log(`   Records with multiple links: ${multiLinked.length}`);

    if (multiLinked.length > 0) {
      console.log('\n🎯 Records with multiple links:');
      multiLinked.forEach(r => {
        console.log(`   - ${r.customer_name}: ${r.linked_customers?.length} links`);
      });
    }
  }

  console.log('\n✅ JSONB data check completed!\n');
}

checkJSONBData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
