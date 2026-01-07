/**
 * Primary Sync Service Entry Point
 * Executes incremental sync from Airtable to Supabase
 */

import { incrementalSync } from './incremental-sync.js';
import { logger } from './logger.js';

async function runSync() {
    try {
        await incrementalSync();
        process.exit(0);
    } catch (error) {
        logger.error('Sync failed:', error as Error);
        process.exit(1);
    }
}

runSync();
