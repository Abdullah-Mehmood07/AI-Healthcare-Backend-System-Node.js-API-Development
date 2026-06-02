# CareSync AI

CareSync AI is an intelligent healthcare platform designed to reduce administrative friction and summarize complex medical data. Built on a hybrid architecture combining the MERN stack (MongoDB, Express, React, Node.js) with a Python ML microservice, CareSync AI connects patients, medical personal assistants (PAs), lab technicians, and hospital administrators into a seamless, unified ecosystem.

## 🚀 Key Features

- **Unified Patient Portal**: A centralized entry point with smart triage and rapid appointment booking functionalities.
- **Personal Assistant (PA) Dashboard**: Advanced tools to efficiently manage doctor schedules, handle consultations, and engage in patient chats.
- **Lab Management System**: Dedicated portal for uploading lab documents (PDFs/JPGs) with a secure file interface and AI layman translation for medical results.
- **Hospital Admin Portal**: Dashboard tailored for administrating networks of hospitals and dynamically mapping health center data.
- **Role-Based Access Control**: Highly secure structure directing different user types (Patients, Doctors, Admins, Labs) to their respective services seamlessly.
- **AI-Powered Architecture**: Integration with Google Gemini for conversational triage and a custom Random Forest classifier for precise specialist recommendations.

## 🛠 Technology Stack

- **Frontend**: React (via Vite) & React Router
- **Backend API**: Node.js & Express.js
- **Database**: MongoDB & Mongoose
- **AI Microservice**: Python, Flask, Scikit-Learn
- **Generative AI**: Google Gemini (`@google/generative-ai`)
- **Authentication**: Custom JWT integration & `bcryptjs`

## 📂 Project Structure

This repository is structured as a monorepo:

- `./` (Root) - The React frontend application.
- `/caresync-backend` - The Node.js API backend application.
- `/caresync-backend/ai-service` - The Python Flask microservice for local ML predictions.
- `/data` - Cleaned and augmented CSV datasets for model training.
- `/docs` - Requirements and documentation files.
- `/notebooks` - Python scripts and Jupyter notebooks for data augmentation and model training.

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Local or Atlas MongoDB Cluster

### Installation

1. **Clone the project:**
   ```bash
   git clone <repository-url>
   cd AI-Healthcare-Backend-System-Node.js-API-Development
   ```

2. **Launch the Node.js Backend:**
   ```bash
   cd caresync-backend
   npm install
   # Create a .env file containing:
   # MONGO_URI, JWT_SECRET, GEMINI_API_KEY, PORT (default 5000)
   npm run dev
   ```

3. **Launch the Python AI Microservice:**
   ```bash
   cd caresync-backend/ai-service
   pip install flask flask-cors joblib scikit-learn pandas
   python app.py # Runs on port 5005
   ```

4. **Launch the Frontend Client:**
   Open a new terminal at the project root:
   ```bash
   npm install
   npm run dev # Runs the Vite React app
   ```

## 🤖 AI + ML Workflow

### 1) Model Training pipeline (`/notebooks`)
- Custom Random Forest model trained on augmented healthcare dataset (`/data/Healthcare_20000_Augmented.csv`).
- Features extracted using TF-IDF across patient symptoms and demographics.
- `train_local_model.py` automatically generates `.joblib` model artifacts directly into `/caresync-backend/model_artifacts/latest/`.

### 2) Local Python AI Service (`/caresync-backend/ai-service`)
- A lightweight Flask server running on port `5005` that exposes a `/predict` endpoint.
- Loads the pre-trained `.joblib` artifacts and returns probability scores and the recommended specialist based on user symptoms.

### 3) Generative AI Node.js Service (Google Gemini)
- Node.js utilizes the Google Gemini API to parse patient symptom descriptions contextually.
- Uses function-calling to route symptoms to the Flask microservice, receives the deterministic ML prediction, and formats a human-friendly response to the patient.
- Automatically translates dense clinical lab reports and prescriptions into layman's terms.

## 📄 License
ISC
