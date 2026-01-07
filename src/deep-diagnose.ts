import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';

async function diagnose() {
    console.log('--- Gemini API 深度診斷 ---');
    console.log('API Key 前綴:', config.gemini.apiKey.substring(0, 8));

    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

    // List of models to try
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`正在測試模型: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`✅ ${modelName} 測試成功:`, result.response.text().substring(0, 20));
            return; // Exit if one works
        } catch (e: any) {
            console.error(`❌ ${modelName} 失敗:`);
            if (e.status) console.error(`   Status: ${e.status}`);
            if (e.message) console.error(`   Message: ${e.message}`);
        }
    }
}

diagnose();
