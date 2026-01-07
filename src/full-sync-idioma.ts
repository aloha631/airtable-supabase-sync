import Airtable from 'airtable';
import { config } from './config.js';
import { supabase, upsertCustomerInteractions, recordSyncHistory } from './supabase-client.js';
import { logger } from './logger.js';
import { CustomerInteraction } from './types.js';

/**
 * Helper function to extract value from Airtable field
 */
function getValue(field: any): string {
    if (Array.isArray(field)) {
        return field.length > 0 ? String(field[0]) : '';
    }
    return field ? String(field) : '';
}

/**
 * Helper function to extract linked record IDs as array
 */
function getLinkedIds(field: any): string[] {
    if (Array.isArray(field)) {
        return field.filter(id => id && typeof id === 'string');
    }
    if (field && typeof field === 'string') {
        return [field];
    }
    return [];
}

/**
 * Convert Airtable record to Supabase format
 */
function convertRecord(record: any): CustomerInteraction | null {
    const fields = record.fields;

    // Basic validation: must have customer info
    if (!fields['客戶'] && !fields['客戶名稱']) {
        return null;
    }

    // Handle customer name (Airtable uses "客戶名稱 + 國家" lookup)
    let customerName = getValue(fields['客戶名稱+國家']);
    if (!customerName) {
        customerName = getValue(fields['客戶名稱']);
    }

    return {
        airtable_id: record.id,
        linked_customers: getLinkedIds(fields['客戶']),
        customer_name_country: customerName,
        categories: getValue(fields['類別']) || undefined,
        summary_en: getValue(fields['簡述(en)']) || undefined,
        summary_cn: getValue(fields['簡述(cn)']) || undefined,
        summary_idioma: getValue(fields['簡述(Idioma)']) || undefined,
        update_content: getValue(fields['更新內容']) || undefined,
        update_content_idioma: getValue(fields['更新內容(客戶語言)']) || undefined,
        airtable_last_modified: getValue(fields['最後更新']) || undefined,
    };
}

/**
 * Full Sync specifically for Idioma field
 */
async function fullSync() {
    logger.info('=== Full Sync (Airtable -> Supabase) Started ===');
    logger.info('Objective: Syncing all records including "簡述(Idioma)" field\n');

    try {
        // Initialize Airtable
        const airtable = new Airtable({ apiKey: config.airtable.apiKey });
        const base = airtable.base(config.airtable.baseId);
        const tableIdentifier = config.airtable.tableId || config.airtable.tableName;

        // Fetch ALL records from Airtable
        logger.info(`Fetching all records from table: ${tableIdentifier}...`);
        const allRecords = await base(tableIdentifier).select().all();
        logger.success(`Fetched ${allRecords.length} records from Airtable\n`);

        // Convert records
        logger.info('Converting records to Supabase format...');
        const interactions: CustomerInteraction[] = [];
        for (const record of allRecords) {
            const interaction = convertRecord(record);
            if (interaction) {
                interactions.push(interaction);
            }
        }
        logger.info(`Ready to sync ${interactions.length} valid records\n`);

        // Sync to Supabase
        logger.info('Updating Supabase (Upserting records)...');
        const { success, failed } = await upsertCustomerInteractions(interactions);

        logger.success('\n=== Sync Complete ===');
        logger.success(`- Successfully synced: ${success}`);
        if (failed > 0) {
            logger.error(`- Failed to sync: ${failed}`);
        }

        // Record in history
        await recordSyncHistory({
            records_checked: allRecords.length,
            records_inserted: 0, // Upsert doesn't easily distinguish between insert/update here
            records_updated: success,
            records_failed: failed,
            status: failed === 0 ? 'success' : 'partial',
            error_message: failed > 0 ? `Failed to sync ${failed} records during full sync` : undefined
        });

    } catch (error: any) {
        logger.error('Full sync failed:', error.message);
        process.exit(1);
    }
}

fullSync();
