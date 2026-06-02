import pandas as pd
import numpy as np
import random
import os

# Define exact specialist mapping for 15 target specialists with highly distinct symptoms
SPECIALIST_MAPPING = {
    'Allergist/Immunologist': ['sneezing', 'runny nose', 'itchy eyes', 'hives', 'anaphylaxis', 'food allergy', 'rash', 'wheezing'],
    'Cardiologist': ['chest pain', 'palpitations', 'shortness of breath', 'high blood pressure', 'dizziness', 'fainting', 'irregular heartbeat'],
    'Dermatologist': ['acne', 'rash', 'eczema', 'psoriasis', 'skin lesions', 'mole changes', 'hair loss', 'nail fungus'],
    'ENT Specialist': ['sore throat', 'ear ache', 'hearing loss', 'sinus pressure', 'tinnitus', 'nasal congestion', 'vertigo'],
    'Endocrinologist': ['excessive thirst', 'frequent urination', 'unexplained weight gain', 'unexplained weight loss', 'fatigue', 'thyroid swelling', 'hot flashes'],
    'Gastroenterologist': ['acid reflux', 'severe abdominal pain', 'bloating', 'chronic diarrhea', 'constipation', 'blood in stool', 'nausea', 'vomiting'],
    'General Physician': ['mild fever', 'body ache', 'mild fatigue', 'mild headache', 'common cold', 'routine checkup'],
    'Hematologist': ['easy bruising', 'prolonged bleeding', 'extreme fatigue', 'anemia', 'swollen lymph nodes', 'frequent infections'],
    'Hepatologist': ['jaundice', 'yellowing of eyes', 'dark urine', 'pale stool', 'liver pain', 'abdominal swelling', 'chronic fatigue'],
    'Infectious Disease Specialist': ['prolonged fever', 'night sweats', 'unexplained rash with fever', 'severe recurring infections', 'malaria symptoms', 'dengue symptoms'],
    'Nephrologist': ['blood in urine', 'foamy urine', 'severe flank pain', 'swelling in legs', 'chronic kidney pain', 'high blood pressure with edema'],
    'Neurologist': ['seizures', 'numbness', 'paralysis', 'severe chronic migraine', 'memory loss', 'tremors', 'loss of coordination', 'vision loss with headache'],
    'Psychiatrist': ['severe depression', 'suicidal thoughts', 'hallucinations', 'severe anxiety', 'bipolar swings', 'schizophrenia symptoms', 'insomnia with panic'],
    'Pulmonologist': ['chronic cough', 'coughing up blood', 'severe wheezing', 'COPD symptoms', 'asthma attack', 'chest tightness', 'blue lips'],
    'Rheumatologist': ['severe joint pain', 'joint swelling', 'morning stiffness', 'arthritis', 'gout', 'lupus symptoms', 'muscle weakness']
}

def generate_clean_data(output_file, target_rows=10000):
    print(f"Generating {target_rows} rows of distinct, high-quality data...")
    new_data = []
    specialists = list(SPECIALIST_MAPPING.keys())
    genders = ['Male', 'Female', 'Other']
    
    for i in range(target_rows):
        specialist = random.choice(specialists)
        disease = f"{specialist.split('/')[0]} Condition" # Generic disease mapping
        
        age = int(np.clip(np.random.normal(45, 20), 1, 100))
        gender = np.random.choice(genders, p=[0.48, 0.48, 0.04])
        
        # Pick 3 to 6 symptoms strongly correlated with the specialist
        available_symptoms = SPECIALIST_MAPPING[specialist]
        num_symptoms = random.randint(3, min(6, len(available_symptoms)))
        chosen_symptoms = random.sample(available_symptoms, num_symptoms)
        
        # Inject 1 random noise symptom 20% of the time to make it slightly realistic
        if random.random() < 0.2:
            random_specialist = random.choice(specialists)
            noise_symptom = random.choice(SPECIALIST_MAPPING[random_specialist])
            if noise_symptom not in chosen_symptoms:
                chosen_symptoms.append(noise_symptom)
                
        symptoms_str = ", ".join(chosen_symptoms)
        
        new_data.append({
            'Patient_ID': i + 1,
            'Age': age,
            'Gender': gender,
            'Symptoms': symptoms_str,
            'Symptom_Count': len(chosen_symptoms),
            'Disease': disease,
            'Specialist': specialist
        })
        
    df = pd.DataFrame(new_data)
    df.to_csv(output_file, index=False)
    print(f"Done! Cleaned dataset saved to: {output_file}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(base_dir, 'Healthcare_Cleaned_Dataset.csv')
    generate_clean_data(output_path, target_rows=10000)
