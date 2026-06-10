import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    try {
        const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "predictSpecialist",
                        description: "Predict the medical specialist needed based on the user's symptoms.",
                        parameters: {
                            type: "object",
                            properties: {
                                symptoms: { type: "string" },
                            },
                            required: ["symptoms"],
                        },
                    }
                ],
            },
        ];

        const model = client.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
            tools: tools,
            systemInstruction: "You are an AI."
        });

        const chat = model.startChat({ history: [] });
        const result = await chat.sendMessage("I have a headache.");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Chatbot Error:", e.message);
    }
};

runTest();
