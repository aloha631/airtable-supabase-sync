import { insightEngine } from './services/insight-engine.js';
import { geminiClient } from './lib/gemini-client.js';
import 'dotenv/config';

async function runTest() {
    console.log('🚀 開始 AI 整合測試 (純 JS 模式)...\n');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ 錯誤: 請先在 .env 檔案中設定 GEMINI_API_KEY');
        return;
    }

    try {
        // 1. 測試一個月內推薦名單 (Epic 4.1)
        console.log('--- [測試 1: 一個月內推薦名單] ---');
        const recommendations = await insightEngine.getTopRecommendations();
        console.log(`找到 ${recommendations.length} 筆近日關鍵機會:`);
        recommendations.forEach((r, i) => {
            console.log(`${i + 1}. ${r.customer_name} (${r.country}) - 理由: ${r.reason}`);
        });
        console.log('\n');

        // 2. 測試 AI 語義查詢 (Epic 3.2)
        console.log('--- [測試 2: AI 語義查詢] ---');
        const query = '總結一下最近有提到設備配件或規格討論的客戶，並給我建議。';
        console.log(`查詢問題: "${query}"`);
        const analysis = await insightEngine.performAIQuery(query);
        console.log('Gemini 分析結果:');
        console.log(analysis);
        console.log('\n');

        // 3. 測試郵件生成 (Epic 3.3)
        console.log('--- [測試 3: 中英對照郵件生成] ---');
        if (recommendations.length > 0) {
            const draft = await geminiClient.generateEmailDraft(`客戶 ${recommendations[0].customer_name} 最近討論了規格，請寫一封專業跟進信。`);
            console.log('Gemini 郵件草稿:');
            console.log(draft);
        }

    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

runTest();
