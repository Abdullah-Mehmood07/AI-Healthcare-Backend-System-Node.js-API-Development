export const classifySpecialistFromSymptoms = async ({ symptoms }) => {
    if (!symptoms || typeof symptoms !== 'string') {
        throw new Error('At least one symptom is required.');
    }

    try {
        const response = await fetch('http://127.0.0.1:5005/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ symptoms })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Python AI Service Error:', errorText);
            throw new Error(`AI Prediction failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            predictedSpecialist: data.predictedSpecialist,
            confidence: data.confidence,
            matches: data.matches
        };
    } catch (error) {
        console.error('Failed to communicate with AI Service:', error);
        
        // Fallback for demonstration if python server is not running
        return {
            predictedSpecialist: 'General Physician',
            confidence: 0.2,
            matches: []
        };
    }
};
