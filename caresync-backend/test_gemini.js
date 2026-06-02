import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    try {
        const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
        const result = await model.generateContent("Say hello!");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Gemini Error:", e.message);
    }
};

runTest();
