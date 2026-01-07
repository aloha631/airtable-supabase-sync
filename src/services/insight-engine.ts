import { geminiClient } from '../lib/gemini-client.js';
import { supabase } from '../supabase-client.js';

export const insightEngine = {
    /**
     * Fetches the top 10 recommended contacts based on the last 1 month of interactions.
     * Logic: Filter by date -> Rank by keywords (Machine Specs > Quotes) -> LLM Summary.
     */
    async getTopRecommendations() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // 1. Fetch records from last 1 month
        const { data: records, error } = await supabase
            .from('customer_interactions')
            .select('customer_name_country, update_content, airtable_id, updated_at')
            .gt('updated_at', oneMonthAgo.toISOString())
            .order('updated_at', { ascending: false });

        if (error || !records) {
            console.error('Error fetching one-month insights:', error);
            return [];
        }

        // 2. Simple Heuristic Ranking (to be refined by Gemini later)
        // Priority: "specification" | "spec" | "quote" | "price"
        const ranked = records.map(rec => {
            const content = rec.update_content?.toLowerCase() || '';
            let score = 0;
            if (content.includes('specification') || content.includes('spec')) score += 50;
            if (content.includes('quote') || content.includes('price')) score += 30;
            if (content.includes('machine')) score += 20;
            return { ...rec, score };
        }).sort((a, b) => b.score - a.score).slice(0, 10);

        // 3. Enhance with Gemini (Optional batch summary can be added here)
        return ranked.map(r => ({
            airtable_id: r.airtable_id,
            customer_name: r.customer_name_country,
            country: 'N/A', // Data is combined in customer_name_country
            summary: r.update_content?.substring(0, 100) + '...',
            reason: r.score >= 50 ? '積極討論設備規格' : '近期有商務報價需求',
            status: 'unprocessed'
        }));
    },

    /**
     * Performs an AI query for a specific customer or topic
     */
    async performAIQuery(query: string, countryFilter?: string) {
        let baseQuery = supabase
            .from('customer_interactions')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(20);

        if (countryFilter) {
            baseQuery = baseQuery.eq('country', countryFilter);
        }

        const { data: history } = await baseQuery;

        if (!history || history.length === 0) {
            return "找不到符合條件的客戶歷史紀錄。";
        }

        return geminiClient.generateAnalysis(history, query, "繁體中文");
    },

    /**
     * Story 4.3: Mark an AI recommendation as processed
     */
    async markActionAsDone(airtableId: string, customerName: string, actionType: string) {
        const { error } = await supabase
            .from('actions_tracking')
            .insert([{
                airtable_id: airtableId,
                customer_name: customerName,
                action_type: actionType,
                status: 'completed',
                handled_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error recording action tracking:', error);
            return false;
        }
        return true;
    },

    /**
     * Story 5.2: Check if the sync service is running healthy
     */
    async checkSyncHealth() {
        const { data: lastSync, error } = await supabase
            .from('sync_history')
            .select('status, sync_time')
            .order('sync_time', { ascending: false })
            .limit(1)
            .single();

        if (error || !lastSync) return 'unknown';

        const syncTime = new Date(lastSync.sync_time);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - syncTime.getTime()) / (1000 * 60 * 60);

        if (lastSync.status === 'failed' || hoursSinceSync > 4) {
            return 'failed';
        }
        return 'healthy';
    }
};
