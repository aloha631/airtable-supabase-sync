/**
 * Alert checker - checks for consecutive failures and triggers email alerts
 */

import { getRecentFailures } from './supabase-client.js';
import { sendFailureAlert } from './email-service.js';
import { config } from './config.js';
import { logger } from './logger.js';

/**
 * Check if we should send an alert based on consecutive failures
 */
export async function checkAndSendAlert(): Promise<void> {
  try {
    const threshold = config.email.failureThreshold;

    // Get the actual last N sync records (not just failures)
    const { supabase } = await import('./supabase-client.js');
    const { data: recentSyncs, error } = await supabase
      .from('sync_history')
      .select('*')
      .order('sync_time', { ascending: false })
      .limit(threshold);

    if (error) {
      logger.error('Error fetching sync history for alert check:', error);
      return;
    }

    if (!recentSyncs || recentSyncs.length < threshold) {
      logger.info(
        `Not enough sync history yet: ${recentSyncs?.length || 0}/${threshold}`
      );
      return;
    }

    // Check if ALL of these N records are failures
    const allFailed = recentSyncs.every(record => record.status === 'failed');

    if (!allFailed) {
      const failedCount = recentSyncs.filter(r => r.status === 'failed').length;
      logger.info(
        `Consecutive failure check: ${failedCount}/${threshold} are failures, but not all consecutive.`
      );
      return;
    }

    logger.warn(
      `⚠️  Detected ${threshold} consecutive sync failures! Sending alert...`
    );

    // Send alert email
    const emailSent = await sendFailureAlert(recentSyncs);

    if (emailSent) {
      logger.success('✅ Alert email sent successfully');
    } else {
      logger.error('❌ Failed to send alert email');
    }
  } catch (error) {
    logger.error('Error checking for alerts:', error as Error);
  }
}

/**
 * Check if the last N syncs are all failures (truly consecutive)
 */
export async function areLastSyncsAllFailures(
  count: number
): Promise<boolean> {
  const { supabase } = await import('./supabase-client.js');

  const { data, error } = await supabase
    .from('sync_history')
    .select('status')
    .order('sync_time', { ascending: false })
    .limit(count);

  if (error || !data || data.length < count) {
    return false;
  }

  // Check if all are failures
  return data.every(record => record.status === 'failed');
}
