/**
 * Sync Scheduler Service
 * Runs incremental sync every 2 hours
 */

import { incrementalSync } from './incremental-sync.js';
import { logger } from './logger.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
// const TEST_INTERVAL_MS = 10 * 1000; // 10 seconds for testing

async function startScheduler() {
    logger.info('=== Sync Scheduler Service Started ===');
    logger.info(`Interval: ${TWO_HOURS_MS / (60 * 60 * 1000)} hours`);

    // Run immediately on start
    try {
        await incrementalSync();
    } catch (error) {
        logger.error('Initial sync failed, service continuing...');
    }

    logger.info(`Next sync scheduled in ${TWO_HOURS_MS / (60 * 60 * 1000)} hours...\n`);

    setInterval(async () => {
        try {
            logger.info(`[${new Date().toISOString()}] Scheduled Sync Triggered`);
            await incrementalSync();
            logger.info(`Sync complete. Next sync in ${TWO_HOURS_MS / (60 * 60 * 1000)} hours...\n`);
        } catch (error) {
            logger.error('Scheduled sync failed, will retry in next interval');
        }
    }, TWO_HOURS_MS);
}

// Handle termination
process.on('SIGINT', () => {
    logger.info('\nScheduler service stopping...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('\nScheduler service stopping...');
    process.exit(0);
});

startScheduler();
