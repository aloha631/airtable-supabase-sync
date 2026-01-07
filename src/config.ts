/**
 * Configuration management with environment variables
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ override: true });

export const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY!,
    baseId: process.env.AIRTABLE_BASE_ID!,
    tableName: process.env.AIRTABLE_TABLE_NAME || '客戶互動',
    tableId: process.env.AIRTABLE_TABLE_ID, // Optional: use Table ID instead of name
  },
  supabase: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY!,
    alertFrom: process.env.EMAIL_ALERT_FROM || 'noreply@yourdomain.com',
    alertTo: process.env.EMAIL_ALERT_TO!,
    failureThreshold: parseInt(process.env.EMAIL_FAILURE_THRESHOLD || '3', 10),
  },
  env: process.env.NODE_ENV || 'development',
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  const required = [
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID',
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'RESEND_API_KEY',
    'EMAIL_ALERT_TO',
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}`
    );
  }
}

// Validate on module load
validateConfig();
