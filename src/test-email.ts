/**
 * Test email alert functionality
 */

import { sendTestEmail, sendFailureAlert } from './email-service.js';
import type { SyncHistory } from './types.js';

async function testEmail() {
  console.log('Testing email alert service...\n');

  // Test 1: Send test email
  console.log('Test 1: Sending test email...');
  const testResult = await sendTestEmail();

  if (testResult) {
    console.log('✅ Test email sent successfully!\n');
  } else {
    console.log('❌ Failed to send test email\n');
    process.exit(1);
  }

  // Test 2: Send failure alert with mock data
  console.log('Test 2: Sending mock failure alert...');

  const mockFailures: SyncHistory[] = [
    {
      id: 1,
      sync_time: new Date().toISOString(),
      records_checked: 100,
      records_inserted: 0,
      records_updated: 0,
      records_failed: 100,
      status: 'failed',
      error_message: 'Airtable API authentication failed (Test)',
    },
    {
      id: 2,
      sync_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      records_checked: 100,
      records_inserted: 0,
      records_updated: 0,
      records_failed: 100,
      status: 'failed',
      error_message: 'Network timeout (Test)',
    },
    {
      id: 3,
      sync_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      records_checked: 100,
      records_inserted: 0,
      records_updated: 0,
      records_failed: 100,
      status: 'failed',
      error_message: 'Supabase connection error (Test)',
    },
  ];

  const alertResult = await sendFailureAlert(mockFailures);

  if (alertResult) {
    console.log('✅ Failure alert sent successfully!');
  } else {
    console.log('❌ Failed to send failure alert');
    process.exit(1);
  }

  console.log('\n✅ All email tests passed!');
  console.log('\n📧 Please check your inbox at the configured EMAIL_ALERT_TO address.');
}

testEmail()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Email test failed:', error);
    process.exit(1);
  });
