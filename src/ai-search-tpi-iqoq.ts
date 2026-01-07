/**
 * AI Search Demo - Find TPI Thailand IQ OQ Data
 *
 * This demonstrates how AI can intelligently query Supabase
 * to find specific customer information
 */

import { supabase } from './supabase-client.js';
import { logger } from './logger.js';

async function searchTPIIQOQ() {
  try {
    logger.info('🤖 AI Search: Finding TPI Thailand IQ OQ Data\n');

    // Step 1: Search for TPI customer records
    logger.info('Step 1: Searching for TPI customer records...');
    const { data: tpiRecords, error: tpiError } = await supabase
      .from('customer_interactions')
      .select('*')
      .ilike('customer_name_country', '%TPI%');

    if (tpiError) {
      logger.error('Query failed:', tpiError);
      return;
    }

    logger.success(`Found ${tpiRecords?.length || 0} TPI records\n`);

    // Step 2: Filter for IQ OQ related content
    logger.info('Step 2: Filtering for IQ/OQ related content...');
    const iqoqRecords = tpiRecords?.filter(record => {
      const searchText = `${record.summary_en} ${record.summary_cn} ${record.update_content}`.toLowerCase();
      return searchText.includes('iq') || searchText.includes('oq');
    });

    logger.success(`Found ${iqoqRecords?.length || 0} IQ/OQ related records\n`);

    // Step 3: Display detailed results
    if (iqoqRecords && iqoqRecords.length > 0) {
      console.log('📋 TPI Thailand IQ OQ Records:');
      console.log('='.repeat(80));
      console.log('');

      iqoqRecords.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`Customer: ${record.customer_name_country}`);
        console.log(`Linked Customers: ${record.linked_customers?.join(', ')}`);
        console.log(`Category: ${record.categories}`);
        console.log(`Summary (EN): ${record.summary_en || 'N/A'}`);
        console.log(`Summary (CN): ${record.summary_cn || 'N/A'}`);
        console.log('');
        console.log('Interaction Notes:');
        console.log(record.update_content || 'N/A');
        console.log('');
        console.log(`Airtable Record: ${record.airtable_id}`);
        console.log(`${'='.repeat(80)}\n`);
      });

      // Step 4: AI Analysis
      logger.info('🧠 AI Analysis:');
      console.log('');

      iqoqRecords.forEach(record => {
        console.log(`📌 ${record.customer_name_country} - ${record.summary_cn || record.summary_en}`);

        // Extract key information
        const notes = record.update_content || '';

        // Look for dates
        const dateMatch = notes.match(/\d{4}-\d{2}-\d{2}|\d{4}年\d{1,2}月\d{1,2}日/);
        if (dateMatch) {
          console.log(`   📅 Date mentioned: ${dateMatch[0]}`);
        }

        // Look for document types
        if (notes.toLowerCase().includes('iq')) {
          console.log('   📄 Document type: IQ (Installation Qualification)');
        }
        if (notes.toLowerCase().includes('oq')) {
          console.log('   📄 Document type: OQ (Operational Qualification)');
        }

        // Look for links
        const linkMatch = notes.match(/https?:\/\/[^\s)]+/);
        if (linkMatch) {
          console.log(`   🔗 Link found: ${linkMatch[0]}`);
        }

        console.log('');
      });

      // Step 5: Summary
      logger.success('✅ Search Complete!');
      logger.info('\n📊 Summary:');
      console.log(`   Total TPI records: ${tpiRecords?.length || 0}`);
      console.log(`   IQ/OQ related records: ${iqoqRecords.length}`);
      console.log(`   Categories: ${iqoqRecords.map(r => r.categories).join(', ')}`);

    } else {
      logger.warn('No IQ/OQ records found for TPI Thailand');
    }

  } catch (error) {
    logger.error('Search failed:', error as Error);
    process.exit(1);
  }
}

// Run the search
searchTPIIQOQ();
