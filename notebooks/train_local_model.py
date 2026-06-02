import pandas as pd
import numpy as np
import os
from pathlib import Path
import re
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
from datetime import datetime
import json
import shutil

# Set local paths
PROJECT_ROOT = Path(os.path.abspath('..'))
DATASET_PATH = PROJECT_ROOT / 'Healthcare_Cleaned_Dataset.csv'
ARTIFACTS_DIR = PROJECT_ROOT / 'caresync-backend' / 'model_artifacts'

ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

print('Dataset path:', DATASET_PATH)
print('Artifacts dir:', ARTIFACTS_DIR)

# Load Dataset
print('\nLoading Dataset...')
df = pd.read_csv(DATASET_PATH)
df = df.dropna(subset=['Symptoms', 'Specialist']).copy()
print('Dataset Shape:', df.shape)

# Feature Engineering
print('\nPerforming Feature Engineering...')
USE_DEMOGRAPHICS = True

def normalize_text(text: str) -> str:
    text = str(text).strip().lower()
    text = re.sub(r'\s+', ' ', text)
    return text

df['symptoms_clean'] = df['Symptoms'].astype(str).apply(normalize_text)

if USE_DEMOGRAPHICS and {'Age', 'Gender'}.issubset(df.columns):
    df['feature_text'] = (
        'age=' + df['Age'].astype(str) + ' | gender=' + df['Gender'].astype(str).str.lower() +
        ' | symptoms=' + df['symptoms_clean']
    )
else:
    df['feature_text'] = 'symptoms=' + df['symptoms_clean']

# Model Training
print('\nPreparing Training Data...')
X = df['feature_text'].astype(str).values
y_raw = df['Specialist'].astype(str).values

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y_raw)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=10000)),
    ('clf', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
])

print('\nTraining model... This might take a minute.')
pipeline.fit(X_train, y_train)
print('Model trained successfully!')

# Evaluation
print('\nEvaluating Model...')
y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f'\nAccuracy: {acc:.4f} ({acc*100:.2f}%)\n')

target_names = label_encoder.classes_.tolist()
print(classification_report(y_test, y_pred, target_names=target_names, zero_division=0))

# Save Artifacts
print('\nSaving Model Artifacts...')
run_id = datetime.now().strftime('%Y%m%d_%H%M%S')
run_dir = ARTIFACTS_DIR / f'local_rf_{run_id}'
run_dir.mkdir(parents=True, exist_ok=True)

model_path = run_dir / 'specialist_classifier.joblib'
labels_path = run_dir / 'label_encoder.joblib'
class_map_path = run_dir / 'class_labels.json'

joblib.dump(pipeline, model_path)
joblib.dump(label_encoder, labels_path)

class_labels = {str(i): label for i, label in enumerate(label_encoder.classes_)}
with open(class_map_path, 'w', encoding='utf-8') as f:
    json.dump(class_labels, f, indent=2)

latest_dir = ARTIFACTS_DIR / 'latest'
latest_dir.mkdir(parents=True, exist_ok=True)
shutil.copy2(model_path, latest_dir / 'specialist_classifier.joblib')
shutil.copy2(labels_path, latest_dir / 'label_encoder.joblib')
shutil.copy2(class_map_path, latest_dir / 'class_labels.json')

print(f'\nDone! Model saved successfully to: {latest_dir}')
