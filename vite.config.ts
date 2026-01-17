import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            tailwindcss(),
        ],
        define: {
            // Polyfill process.env for the config.ts file
            'process.env': {
                AIRTABLE_API_KEY: JSON.stringify(env.AIRTABLE_API_KEY),
                AIRTABLE_BASE_ID: JSON.stringify(env.AIRTABLE_BASE_ID),
                AIRTABLE_TABLE_NAME: JSON.stringify(env.AIRTABLE_TABLE_NAME),
                SUPABASE_URL: JSON.stringify(env.SUPABASE_URL),
                SUPABASE_KEY: JSON.stringify(env.SUPABASE_KEY),
                GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY),
                RESEND_API_KEY: JSON.stringify(env.RESEND_API_KEY),
                EMAIL_ALERT_TO: JSON.stringify(env.EMAIL_ALERT_TO),
                NODE_ENV: JSON.stringify(mode),
            }
        },
        resolve: {
            alias: {
                // Handle node modules that might be imported by backend code shared with frontend
            }
        }
    };
});
