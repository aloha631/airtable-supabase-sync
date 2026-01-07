/**
 * Email alert service using Resend
 */

import { Resend } from 'resend';
import { config } from './config.js';
import { logger } from './logger.js';
import type { SyncHistory } from './types.js';

const resend = new Resend(config.email.resendApiKey);

/**
 * Send alert email for sync failures
 */
export async function sendFailureAlert(
  consecutiveFailures: SyncHistory[]
): Promise<boolean> {
  try {
    const failureCount = consecutiveFailures.length;
    const latestFailure = consecutiveFailures[0];

    // Format failure details
    const failureDetails = consecutiveFailures
      .map(
        (failure, index) =>
          `${index + 1}. ${new Date(failure.sync_time || '').toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei',
          })}\n   錯誤: ${failure.error_message || '未知錯誤'}\n   檢查記錄數: ${failure.records_checked}\n   失敗記錄數: ${failure.records_failed}`
      )
      .join('\n\n');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { padding: 20px; font-size: 12px; color: #6b7280; }
    .alert-box { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
    .failure-list { background-color: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
    pre { background-color: #1f2937; color: #f9fafb; padding: 10px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Airtable 同步失敗告警</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <strong>⚠️ 警告：</strong> 系統偵測到連續 ${failureCount} 次同步失敗
      </div>

      <h2>失敗詳情</h2>
      <div class="failure-list">
        <pre>${failureDetails}</pre>
      </div>

      <h2>最新錯誤訊息</h2>
      <p><code>${latestFailure.error_message || '未知錯誤'}</code></p>

      <h2>建議處理步驟</h2>
      <ol>
        <li>檢查 Airtable API 金鑰是否有效</li>
        <li>確認 Airtable Base ID 和 Table ID 是否正確</li>
        <li>檢查 Supabase 連線狀態</li>
        <li>查看 Zeabur 部署日誌以獲取更多詳情</li>
        <li>執行 <code>npm run check-sync-history</code> 查看完整同步歷史</li>
      </ol>

      <p><strong>同步服務時間：</strong> ${new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
      })}</p>
    </div>
    <div class="footer">
      此郵件由 Airtable to Supabase 同步服務自動發送<br>
      專案位置: airtable syc to Supabase
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
🚨 Airtable 同步失敗告警

警告：系統偵測到連續 ${failureCount} 次同步失敗

失敗詳情：
${failureDetails}

最新錯誤訊息：
${latestFailure.error_message || '未知錯誤'}

建議處理步驟：
1. 檢查 Airtable API 金鑰是否有效
2. 確認 Airtable Base ID 和 Table ID 是否正確
3. 檢查 Supabase 連線狀態
4. 查看 Zeabur 部署日誌以獲取更多詳情
5. 執行 npm run check-sync-history 查看完整同步歷史

同步服務時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
    `;

    const { data, error } = await resend.emails.send({
      from: config.email.alertFrom,
      to: config.email.alertTo,
      subject: `🚨 Airtable 同步失敗告警 - 連續 ${failureCount} 次失敗`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      logger.error('Failed to send alert email:', error as Error);
      console.error('Resend error details:', error);
      return false;
    }

    logger.success(`Alert email sent successfully! Email ID: ${data?.id}`);
    return true;
  } catch (error) {
    logger.error('Error sending alert email:', error as Error);
    console.error(error);
    return false;
  }
}

/**
 * Test email sending (for development/testing)
 */
export async function sendTestEmail(): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: config.email.alertFrom,
      to: config.email.alertTo,
      subject: '✅ Airtable 同步服務 - Email 測試',
      html: '<h1>測試成功！</h1><p>Email 告警服務已正確配置。</p>',
      text: '測試成功！Email 告警服務已正確配置。',
    });

    if (error) {
      console.error('Test email failed:', error);
      return false;
    }

    console.log('Test email sent successfully! Email ID:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}
