import { GoogleGenerativeAI } from '@google/generative-ai';


const getClient = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured.');
    }

    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const getModel = () => {
    const client = getClient();
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    return client.getGenerativeModel({ model: modelName });
};

export const generateSpecialistRecommendation = async ({ symptoms, age, gender }) => {
    const model = getModel();

    const prompt = `
You are a healthcare triage assistant.
Given the symptoms and demographics below, recommend the most relevant specialist.
Respond strictly as JSON with keys:
- predictedSpecialist (string)
- rationale (string)
- urgency (one of: low, medium, high)
- nextStep (short action guidance)

Symptoms: ${symptoms}
Age: ${age ?? 'unknown'}
Gender: ${gender ?? 'unknown'}
`;

    const response = await model.generateContent(prompt);
    return response.response.text();
};

export const generateLabSummary = async ({ reportText }) => {
    const model = getModel();

    const prompt = `
You are a medical report explainer for patients.
Summarize the following lab report text in simple language.
Return strictly as JSON with keys:
- plainSummary (string)
- keyFindings (array of strings)
- cautionFlags (array of strings)
- suggestedFollowUp (string)

Lab report text:
${reportText}
`;

    const response = await model.generateContent(prompt);
    return response.response.text();
};

export const generatePrescriptionExplanation = async ({ prescriptionText }) => {
    const model = getModel();

    const prompt = `
You are a medical prescription assistant.
Analyze the following prescription text and provide a patient-friendly summary.
Return strictly as JSON with keys:
- plainSummary (string - overall simple explanation of the prescription)
- dosageInstructions (array of strings - dosage instructions and timing for each medication)
- cautionFlags (array of strings - side effects, food interactions, or warnings)
- suggestedFollowUp (string - follow-up guidelines or when to consult the doctor again)

Prescription text:
${prescriptionText}
`;

    const response = await model.generateContent(prompt);
    return response.response.text();
};

export const processConversation = async (history, hospitalId, toolsConfig) => {
    const client = getClient();
    
    const tools = [
        {
            functionDeclarations: [
                {
                    name: "predictSpecialist",
                    description: "Predict the medical specialist needed based on the user's symptoms. Only use this if the user describes symptoms.",
                    parameters: {
                        type: "object",
                        properties: {
                            symptoms: {
                                type: "string",
                                description: "A comma-separated list of the user's symptoms.",
                            },
                        },
                        required: ["symptoms"],
                    },
                },
                {
                    name: "findDoctors",
                    description: "Find a list of available doctors for a specific specialty in the user's hospital. Only use this if the user asks to see doctors.",
                    parameters: {
                        type: "object",
                        properties: {
                            specialty: {
                                type: "string",
                                description: "The medical specialty, e.g. Cardiologist or Neurologist.",
                            },
                        },
                        required: ["specialty"],
                    },
                }
            ],
        },
    ];

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = client.getGenerativeModel({ 
        model: modelName,
        tools: tools,
        systemInstruction: "You are the CareSync AI Medical Assistant. Your job is to help patients. If a patient describes symptoms, extract them and use the predictSpecialist tool to find the right doctor type. After getting the prediction, explain it to the patient. Then, ask if they want you to find doctors at their hospital. If they say yes, use the findDoctors tool. Do NOT give medical advice or diagnose, only recommend specialists. IMPORTANT: Do NOT use any markdown formatting, asterisks, or bold text. Respond in plain, natural conversational text."
    });

    // History needs to exclude the last message since we are sending it now
    let previousHistory = history.slice(0, -1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    // Gemini API requires that the history starts with a 'user' message
    // If the first message is from the AI (e.g. the initial greeting), we should remove it or add a dummy user message
    while (previousHistory.length > 0 && previousHistory[0].role !== 'user') {
        previousHistory.shift();
    }

    const chat = model.startChat({
        history: previousHistory
    });

    const latestMessage = history[history.length - 1].text;
    let result = await chat.sendMessage(latestMessage);
    let response = result.response;

    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        let functionResult = {};

        if (call.name === 'predictSpecialist') {
            functionResult = await toolsConfig.predictSpecialist(call.args.symptoms);
        } else if (call.name === 'findDoctors') {
            functionResult = await toolsConfig.findDoctors(call.args.specialty, hospitalId);
        }

        // Send the tool response back to the model
        result = await chat.sendMessage([{
            functionResponse: {
                name: call.name,
                response: functionResult
            }
        }]);
        response = result.response;
    }

    return response.text();
};
