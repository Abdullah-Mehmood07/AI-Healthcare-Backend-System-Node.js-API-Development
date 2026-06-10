import { processConversation } from './services/geminiService.js';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    try {
        const history = [{ sender: 'user', text: "I have a headache and fever." }];
        const result = await processConversation(history, "some_hospital_id", {});
        console.log("Success:", result);
    } catch (e) {
        console.error("Service Error:", e);
    }
};

runTest();
