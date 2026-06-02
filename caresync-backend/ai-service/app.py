from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import os
import re
from pathlib import Path
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

app = Flask(__name__)
CORS(app)

# Load Model
ARTIFACTS_DIR = Path(__file__).parent.parent / 'model_artifacts' / 'latest'
try:
    model_path = ARTIFACTS_DIR / 'specialist_classifier.joblib'
    labels_path = ARTIFACTS_DIR / 'label_encoder.joblib'
    class_map_path = ARTIFACTS_DIR / 'class_labels.json'
    
    pipeline = joblib.load(model_path)
    label_encoder = joblib.load(labels_path)
    
    with open(class_map_path, 'r', encoding='utf-8') as f:
        class_labels = json.load(f)
        
    print(f"Loaded ML model from {ARTIFACTS_DIR}")
except Exception as e:
    print(f"Failed to load ML model: {e}")
    pipeline = None

def normalize_text(text: str) -> str:
    text = str(text).strip().lower()
    text = re.sub(r'\s+', ' ', text)
    return text

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": pipeline is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    if not pipeline:
        return jsonify({"error": "Model not loaded"}), 500
        
    data = request.json
    if not data or 'symptoms' not in data:
        return jsonify({"error": "symptoms string is required"}), 400
        
    symptoms_raw = data.get('symptoms', '')
    age = data.get('age', '')
    gender = data.get('gender', '')
    
    symptoms_clean = normalize_text(symptoms_raw)
    
    if age and gender:
        feature_text = f"age={age} | gender={str(gender).lower()} | symptoms={symptoms_clean}"
    else:
        feature_text = f"symptoms={symptoms_clean}"
        
    try:
        # Predict Probabilities
        probabilities = pipeline.predict_proba([feature_text])[0]
        
        # Get top 3 indices
        top_indices = probabilities.argsort()[-3:][::-1]
        
        top_prediction_index = top_indices[0]
        confidence = probabilities[top_prediction_index]
        predicted_specialist = class_labels[str(top_prediction_index)]
        
        matches = [
            {
                "specialist": class_labels[str(idx)],
                "score": float(probabilities[idx])
            }
            for idx in top_indices
        ]
        
        return jsonify({
            "predictedSpecialist": predicted_specialist,
            "confidence": float(confidence),
            "matches": matches
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5005 to avoid conflicting with Node.js backend
    app.run(host='127.0.0.1', port=5005, debug=False)
