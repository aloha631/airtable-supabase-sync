/**
 * AI Analysis Demo
 *
 * This demonstrates how AI tools (like Claude Code) can directly
 * query and analyze Supabase data
 */

import { supabase } from './supabase-client.js';
import { logger } from './logger.js';

async function analyzeCustomerInteractions() {
  logger.info('🤖 AI Analysis: Customer Interaction Insights\n');

  // Fetch all customer interactions
  const { data, error } = await supabase
    .from('customer_interactions')
    .select('*');

  if (error || !data) {
    logger.error('Failed to fetch data:', error as any);
    return;
  }

  logger.success(`✅ Successfully fetched ${data.length} customer interactions\n`);

  // AI Analysis 1: Category Distribution
  console.log('📊 Analysis 1: Category Distribution');
  console.log('====================================');
  const categoryCounts = data.reduce((acc, record) => {
    acc[record.categories] = (acc[record.categories] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count} interaction(s)`);
  });
  console.log('');

  // AI Analysis 2: Customer Engagement Level
  console.log('📈 Analysis 2: Customer Engagement Analysis');
  console.log('==========================================');
  data.forEach(record => {
    const noteLength = record.update_content?.length || 0;
    const engagementLevel = noteLength > 200 ? '🔥 High' :
      noteLength > 100 ? '⚡ Medium' : '📝 Low';
    console.log(`  ${record.customer_name_country} (${record.categories}): ${engagementLevel}`);
    console.log(`    Note length: ${noteLength} characters`);
  });
  console.log('');

  // AI Analysis 3: Actionable Insights
  console.log('💡 Analysis 3: AI-Generated Insights');
  console.log('===================================');
  console.log('Based on the customer interaction data:');
  console.log('');
  console.log('  1. 客戶需求分析:');
  data.forEach(record => {
    if (record.categories === '產品詢價') {
      console.log(`     - ${record.customer_name_country} 正在評估產品，建議主動提供報價`);
    } else if (record.categories === '技術支援') {
      console.log(`     - ${record.customer_name_country} 需要技術協助，已成功解決問題`);
    } else if (record.categories === '合作洽談') {
      console.log(`     - ${record.customer_name_country} 是潛在合作夥伴，需要準備提案`);
    }
  });
  console.log('');

  console.log('  2. 下一步行動建議:');
  console.log('     ✅ 跟進王小明的產品報價需求');
  console.log('     ✅ 確認李小華的問題是否完全解決');
  console.log('     ✅ 準備張大同的合作提案文件');
  console.log('');

  logger.success('🎉 AI Analysis Complete! This is what "Data Freedom" feels like!');
  logger.success('');
  logger.success('With Supabase + AI tools, you can:');
  logger.success('  - Query data using natural language');
  logger.success('  - Perform complex analysis without manual work');
  logger.success('  - Generate insights automatically');
  logger.success('  - Ask follow-up questions and get instant answers');
}

analyzeCustomerInteractions();
