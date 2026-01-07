/**
 * Check sync history records
 */

import { supabase } from './supabase-client.js';

async function checkSyncHistory() {
  console.log('Fetching sync history...\n');

  const { data, error } = await supabase
    .from('sync_history')
    .select('*')
    .order('sync_time', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching sync history:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No sync history records found.');
    return;
  }

  console.log(`Found ${data.length} sync history records:\n`);

  data.forEach((record, index) => {
    console.log(`[${index + 1}] Sync Time: ${record.sync_time}`);
    console.log(`    Status: ${record.status}`);
    console.log(`    Records Checked: ${record.records_checked}`);
    console.log(`    Records Inserted: ${record.records_inserted}`);
    console.log(`    Records Updated: ${record.records_updated}`);
    console.log(`    Records Failed: ${record.records_failed}`);
    if (record.error_message) {
      console.log(`    Error: ${record.error_message}`);
    }
    console.log('');
  });
}

checkSyncHistory()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
