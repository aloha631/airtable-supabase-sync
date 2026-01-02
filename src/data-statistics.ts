/**
 * Data Statistics - Analyze imported data
 */

import { supabase } from './supabase-client.js';
import { logger } from './logger.js';

async function analyzeData() {
  try {
    logger.info('📊 Data Import Statistics\n');
    logger.info('='.repeat(80));

    // Get total count
    const { data: allData, error } = await supabase
      .from('customer_interactions')
      .select('*');

    if (error || !allData) {
      logger.error('Failed to fetch data:', error);
      return;
    }

    const total = allData.length;
    logger.success(`✅ Total records in Supabase: ${total}`);
    console.log('');

    // Category distribution
    const categoryCount: Record<string, number> = {};
    allData.forEach(record => {
      const cat = record.categories || 'Unknown';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    console.log('📋 Category Distribution:');
    console.log('─'.repeat(80));
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        console.log(`  ${category.padEnd(30)} ${count.toString().padStart(4)} (${percentage}%)`);
      });
    console.log('');

    // Customer distribution (top 20)
    const customerCount: Record<string, number> = {};
    allData.forEach(record => {
      const name = record.customer_name || 'Unknown';
      customerCount[name] = (customerCount[name] || 0) + 1;
    });

    console.log('🏢 Top 20 Customers by Interaction Count:');
    console.log('─'.repeat(80));
    Object.entries(customerCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([customer, count], index) => {
        console.log(`  ${(index + 1).toString().padStart(2)}. ${customer.padEnd(40)} ${count} interactions`);
      });
    console.log('');

    // Data quality check
    console.log('✅ Data Quality Check:');
    console.log('─'.repeat(80));
    const withCustomerId = allData.filter(r => r.customer_id).length;
    const withSummaryEN = allData.filter(r => r.summary_en).length;
    const withSummaryCN = allData.filter(r => r.summary_cn).length;
    const withNotes = allData.filter(r => r.interaction_notes).length;

    console.log(`  Records with Customer ID:     ${withCustomerId} / ${total} (${((withCustomerId/total)*100).toFixed(1)}%)`);
    console.log(`  Records with Summary (EN):    ${withSummaryEN} / ${total} (${((withSummaryEN/total)*100).toFixed(1)}%)`);
    console.log(`  Records with Summary (CN):    ${withSummaryCN} / ${total} (${((withSummaryCN/total)*100).toFixed(1)}%)`);
    console.log(`  Records with Notes:           ${withNotes} / ${total} (${((withNotes/total)*100).toFixed(1)}%)`);
    console.log('');

    // Unique customers
    const uniqueCustomers = new Set(allData.map(r => r.customer_id).filter(Boolean));
    console.log(`📇 Unique Customers: ${uniqueCustomers.size}`);
    console.log('');

    logger.info('='.repeat(80));
    logger.success('✅ Analysis Complete!');

  } catch (error) {
    logger.error('Analysis failed:', error as Error);
    process.exit(1);
  }
}

analyzeData();
