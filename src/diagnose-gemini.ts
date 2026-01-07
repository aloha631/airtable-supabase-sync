import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';

async function listModels() {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    try {
        console.log('--- 測試直接讀取可用模型 ---');
        // Instead of listModels (which might not be in v1beta SDK), 
        // let's try a very basic request with a generic model name
        const result = await model.generateContent("Say hello");
        console.log(result.response.text());
    } catch (e) {
        console.error('❌ 詳細錯誤訊息:');
        console.error(JSON.stringify(e, null, 2));
    }
}

listModels();
