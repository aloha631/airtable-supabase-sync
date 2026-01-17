/**
 * Configuration management with environment variables
 */

// Environment variables config shared between client and server
// In browser (Vite): use import.meta.env
// In Node.js: use process.env

// Helper to get env var from both environments
const getEnv = (key: string): string | undefined => {
  // @ts-ignore - import.meta.env might not exist in Node.js context
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

export const config = {
  airtable: {
    apiKey: getEnv('VITE_AIRTABLE_API_KEY') || getEnv('AIRTABLE_API_KEY') || '',
    baseId: getEnv('VITE_AIRTABLE_BASE_ID') || getEnv('AIRTABLE_BASE_ID') || '',
    tableName: getEnv('VITE_AIRTABLE_TABLE_NAME') || getEnv('AIRTABLE_TABLE_NAME') || '客戶互動',
    tableId: getEnv('VITE_AIRTABLE_TABLE_ID') || getEnv('AIRTABLE_TABLE_ID'),
  },
  supabase: {
    url: getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || '',
    key: getEnv('VITE_SUPABASE_KEY') || getEnv('SUPABASE_KEY') || '',
  },
  email: {
    resendApiKey: getEnv('VITE_RESEND_API_KEY') || getEnv('RESEND_API_KEY') || '',
    alertFrom: getEnv('VITE_EMAIL_ALERT_FROM') || getEnv('EMAIL_ALERT_FROM') || 'noreply@yourdomain.com',
    alertTo: getEnv('VITE_EMAIL_ALERT_TO') || getEnv('EMAIL_ALERT_TO') || '',
    failureThreshold: parseInt(getEnv('VITE_EMAIL_FAILURE_THRESHOLD') || getEnv('EMAIL_FAILURE_THRESHOLD') || '3', 10),
  },
  gemini: {
    apiKey: getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY') || '',
  },
  env: getEnv('VITE_NODE_ENV') || getEnv('NODE_ENV') || 'development',
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  // Checks are handled by TypeScript ! assertion or runtime check
  const missing: string[] = [];

  if (!config.airtable.apiKey) missing.push('AIRTABLE_API_KEY');
  if (!config.airtable.baseId) missing.push('AIRTABLE_BASE_ID');
  if (!config.supabase.url) missing.push('SUPABASE_URL');
  if (!config.supabase.key) missing.push('SUPABASE_KEY');
  // GEMINI and RESEND might be used conditionally in some contexts, but required by type
  if (!config.gemini.apiKey) missing.push('GEMINI_API_KEY');

  if (missing.length > 0) {
    // In browser, alert or console error instead of throw to avoid crashing entire app loop if possible
    // But for now, throw is fine
    const msg = `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}`;
    console.error(msg);
    // throw new Error(msg); // Optional: don't throw hard in browser to allow partial functionality?
  }
}

// Validate on module load
validateConfig();
