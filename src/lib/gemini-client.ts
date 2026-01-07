import { GoogleGenerativeAI } from '@google/generative-ai';

import { config } from '../config.js';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Custom Gemini Client focused on customer interaction analysis
 */
export const geminiClient = {
    /**
     * Generates a summary and response draft based on customer interaction history
     */
    async generateAnalysis(history: any[], question: string, language: string) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      You are an expert Business Assistant. Analyze the following customer interaction history from Supabase.
      
      HISTORY DATA:
      ${JSON.stringify(history, null, 2)}
      
      USER QUESTION:
      ${question}
      
      STRICT GUIDELINES:
      1. Language: Respond in ${language}.
      2. Accuracy: Only use the provided history. Cite sources using "💡" followed by the specific date or record ID AND the relevant quoted text from that record.
      3. Tone: Professional, business-friendly, like an "old friend".
      4. Structured Output: 
         - Summary of historical context.
         - Specific answer to the question.
         - Suggested next action.
         - References: A clear list of citations showing "💡[ID/Date]: [Quote Text]".
    `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    },

    /**
     * Generates localized email drafts (EN + TW Translation)
     */
    async generateEmailDraft(context: string) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      Based on this context: "${context}", generate a follow-up email draft.
      
      FORMAT:
      --- ENGLISH DRAFT ---
      [Subject & Body]
      
      --- 繁體中文對照翻譯 ---
      [Subject & Body in Traditional Chinese]
      
      TONE: Polite, professional, warm business-friendly style.
    `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    },

    /**
     * Detects inconsistencies or trend shifts in the last 1 month
     */
    async detectInconsistency(history: any[]) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      Analyze these interaction records (last 1 month) for any INCONSISTENCIES or significant TREND SHIFTS.
      Look for contradictions in budget, machine specs, or delivery requirements.
      
      RECORDS:
      ${JSON.stringify(history, null, 2)}
      
      OUTPUT:
      - Is there an inconsistency? (Yes/No)
      - If Yes, explain why concisely in Traditional Chinese.
      - Use "💡" to point to the records.
    `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    }
};
