import pandas as pd
import numpy as np
import random
import os

def augment_dataset(input_file, output_file, target_rows=20000):
    print(f"Loading original dataset: {input_file}")
    df = pd.read_csv(input_file)
    
    # Analyze existing data patterns
    print("Analyzing symptom patterns...")
    disease_to_specialist = df.groupby('Disease')['Specialist'].first().to_dict()
    
    # Collect all unique symptoms for each disease
    disease_symptoms = {}
    for index, row in df.iterrows():
        disease = row['Disease']
        symptoms = [s.strip() for s in str(row['Symptoms']).split(',')]
        if disease not in disease_symptoms:
            disease_symptoms[disease] = set()
        disease_symptoms[disease].update(symptoms)
        
    for d in disease_symptoms:
        disease_symptoms[d] = list(disease_symptoms[d])

    # Probabilities for Age and Gender
    genders = ['Male', 'Female', 'Other']
    gender_probs = df['Gender'].value_counts(normalize=True).reindex(genders).fillna(0).tolist()
    
    # Generate new rows
    print(f"Generating {target_rows} rows...")
    new_data = []
    
    diseases = list(disease_to_specialist.keys())
    
    for i in range(target_rows):
        # Pick a random disease
        disease = random.choice(diseases)
        specialist = disease_to_specialist[disease]
        
        # Pick age and gender
        age = int(np.clip(np.random.normal(45, 20), 1, 100))
        gender = np.random.choice(genders, p=gender_probs)
        
        # Pick symptoms
        available_symptoms = disease_symptoms[disease]
        num_symptoms = random.randint(min(3, len(available_symptoms)), min(7, len(available_symptoms)))
        chosen_symptoms = random.sample(available_symptoms, num_symptoms)
        symptoms_str = ", ".join(chosen_symptoms)
        
        new_data.append({
            'Patient_ID': i + 1,
            'Age': age,
            'Gender': gender,
            'Symptoms': symptoms_str,
            'Symptom_Count': num_symptoms,
            'Disease': disease,
            'Specialist': specialist
        })
        
    new_df = pd.DataFrame(new_data)
    
    print(f"Saving augmented dataset to: {output_file}")
    new_df.to_csv(output_file, index=False)
    print("Done!")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(base_dir, 'Healthcare_5000_with_Specialist.csv')
    output_path = os.path.join(base_dir, 'Healthcare_20000_Augmented.csv')
    
    augment_dataset(input_path, output_path, target_rows=20000)
