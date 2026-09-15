# 🚀 SmartHire AI: Intelligent Applicant Tracking System

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![spaCy](https://img.shields.io/badge/spaCy-09A3D5?style=for-the-badge&logo=spacy&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

**SmartHire AI** is a modern, full-stack Applicant Tracking System (ATS) designed to automate and eliminate bias in the resume screening process. By leveraging Natural Language Processing (NLP), the system extracts crucial candidate data and instantly calculates a Match Score against active job requisitions.

*(Note: Add a screenshot of your dashboard here!)*
<!-- Example: <img src="screenshot1.png" width="800" /> -->

## ✨ Key Features

- **🧠 AI-Powered Parsing:** Extracts skills, education levels, and total years of experience from unstructured PDFs and DOCX files using a custom `spaCy` NLP pipeline.
- **📊 Intelligent Match Scoring:** Automatically calculates a percentage-based compatibility score comparing a candidate's extracted profile against specific job requirements.
- **📁 Resilient Bulk Uploads:** Allows recruiters to upload dozens of resumes simultaneously. Features UUID-based file collision protection and iterative processing.
- **🎨 Premium SaaS UI:** A sleek, low-cognitive-load interface built with React and Tailwind CSS, featuring dynamic scoring badges and smooth micro-interactions.
- **🏗️ Enterprise Architecture:** Backend built with FastAPI utilizing the Repository and Facade design patterns for clean, scalable, and highly maintainable code.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Asynchronous Python)
- **Database:** SQLAlchemy (ORM) + SQLite / PostgreSQL
- **Architecture:** Repository Pattern, Service Layers

### AI & Data Pipeline
- **NLP Engine:** spaCy (Named Entity Recognition)
- **Document Parsing:** PyMuPDF (`fitz`), `python-docx`
- **Logic:** Custom Regex fallback handlers for complex date and degree extraction

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
- Python 3.9+
- Node.js 16+

### 1. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download the spaCy NLP model
python -m spacy download en_core_web_sm

# Start the FastAPI server
uvicorn app.main:app --reload --port 8080
```
*The backend API will be running at `http://localhost:8080` (Check `http://localhost:8080/docs` for the Swagger UI).*

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be running at `http://localhost:5173`.*

---

## 📂 Project Structure

```text
Smart_Hire_System/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI Routes & Endpoints
│   │   ├── core/         # DB Connection & Config
│   │   ├── db/           # Repository Pattern (candidate_repo.py, etc.)
│   │   ├── ai/           # spaCy NLP Logic & Parsers (ner.py, etc.)
│   │   ├── services/     # Facade pattern for pipeline orchestration
│   │   └── schemas/      # Pydantic Models for validation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main React UI Application
│   │   ├── api.js        # Axios API Client
│   │   └── index.css     # Tailwind Entrypoint
│   └── package.json
└── README.md
```

## 💡 Future Roadmap
- [ ] Migrate file storage to AWS S3.
- [ ] Implement Celery + Redis for asynchronous background processing of massive bulk uploads.
- [ ] Add OAuth (Google/Microsoft) Single Sign-On.

---
*Developed by [Your Name]*
