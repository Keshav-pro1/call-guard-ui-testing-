<div align="center">
  <img width="1200" height="475" alt="Battery Smart Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # 🔋 Battery Smart Auto-QA & Coaching System

  [![React](https://img.shields.io/badge/Frontend-React%20%2F%20Vite-blue)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)](https://fastapi.tiangolo.com/)
  [![Firebase](https://img.shields.io/badge/Database-Firebase-orange)](https://firebase.google.com/)
  [![Gemini AI](https://img.shields.io/badge/AI-Gemini%20Pro-purple)](https://deepmind.google/technologies/gemini/)

  **Transforming Customer Support through Automated Quality Assurance and Intelligent Coaching.**
</div>

---

## 📖 Overview

The **Battery Smart Auto-QA & Coaching System** is a sophisticated AI-powered platform designed to automate the quality audit process for customer service calls. By leveraging advanced NLP and Speech-to-Text (STT) technologies, the system evaluates call recordings against predefined Standard Operating Procedures (SOPs), providing instant feedback, sentiment analysis, and actionable coaching insights.

## ✨ Key Features

- **🎯 Automated SOP Adherence**: Automatically checks if agents followed specific steps in the support workflow.
- **🗣️ Multi-Speaker Diarization**: Accurately distinguishes between Agent and Customer speakers.
- **📊 Sentiment Trajectory**: Tracks the emotional tone of the conversation from start to finish.
- **🚨 Supervisor Alerts**: Real-time detection of high-risk keywords (e.g., "legal", "court", "refund") and critical service failures.
- **💡 AI-Driven Coaching**: Generates personalized insights and suggestions for improvement based on call performance.
- **📈 Dynamic Scoring**: Sophisticated grading system based on adherence, resolution status, and sentiment.
- **🛠️ Custom SOP Engine**: Easy-to-manage rule definitions via a YAML-based engine on the backend or a dynamic dashboard on the frontend.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Premium Glassmorphism Design)
- **Database/Auth**: Firebase Firestore & Firebase Auth
- **3D Elements**: React Three Fiber / Three.js

### Backend
- **Framework**: FastAPI (Python)
- **AI/LLM**: Google Gemini Pro (via `@google/genai`)
- **STT**: Advanced Speech-to-Text with Speaker Diarization
- **Processing**: NLP for text cleaning, segmentation, and sentiment analysis

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Gemini API Key
- Firebase Project

### Backend Setup
1. Navigate to the `model` directory:
   ```bash
   cd model
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` file in the `model` folder:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key
   ```
5. Run the FastAPI server:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the root directory:
   ```bash
   npm install
   ```
2. Set up your Firebase configuration in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   # ... other firebase vars
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📋 Usage

1. **Login/Signup**: Use the premium Auth portal to access your dashboard.
2. **Setup SOPs**: Define your business-specific rules in the "SOP Management" section.
3. **Upload Call**: Go to the "Call Analysis" page and upload a `.wav` or `.mp3` recording.
4. **Review Results**: View the detailed transcript, SOP checklist, sentiment graph, and coaching cards.

## 📄 License

Internal Project - All Rights Reserved.
