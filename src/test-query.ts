/**
 * Test query script - verify data can be queried from Supabase
 */

import { supabase } from './supabase-client.js';
import { logger } from './logger.js';

async function main() {
  try {
    logger.info('=== Testing Supabase Query ===');

    // Query all customer interactions
    const { data, error } = await supabase
      .from('customer_interactions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      logger.error('Query failed:', error as any);
      process.exit(1);
    }

    logger.success(`Found ${data?.length || 0} records`);

    // Display results
    console.log('\n📊 Customer Interactions:');
    console.log('========================\n');

    data?.forEach((record, index) => {
      console.log(`${index + 1}. ${record.customer_name_country} - ${record.categories}`);
      console.log(`   Linked Customers: ${record.linked_customers?.join(', ') || 'N/A'}`);
      console.log(`   Summary (EN): ${record.summary_en || 'N/A'}`);
      console.log(`   Summary (CN): ${record.summary_cn || 'N/A'}`);
      console.log(`   Notes: ${record.update_content?.substring(0, 100)}...`);
      console.log('');
    });

    // Analyze data
    logger.info('\n=== AI-Ready Analysis ===');
    console.log(`Total customers: ${data?.length || 0}`);
    console.log(`Categories: ${data?.map(r => r.categories).join(', ')}`);

    logger.success('\n✅ Supabase query successful! Data is ready for AI analysis.');

  } catch (error) {
    logger.error('Test failed:', error as Error);
    process.exit(1);
  }
}

main();
