# MedSecure

Secure medical data exchange using steganography and encryption. Doctors can embed encrypted patient data inside image/audio files and share them safely within a hospital network.

## Tech Stack

- Backend (API): Node.js, Express, MongoDB (Mongoose), JWT (cookie-based), Helmet, CORS, Cookie-Parser
- Stego Service: Python, Flask, cryptography (Fernet)
- Frontend: React, Vite, React Router, Axios, React-Bootstrap, Toast notifications

## Core Features

- Cookie-based authentication (no localStorage)
- Encrypt (send) and decrypt (receive) workflows
- Image and audio steganography via Python microservice (Fernet + LSB-ready)
- Inbox for received messages and status
- Structured decrypted view (patient_id, patient_name, message, sender, timestamp)
- Audit logs for register/login/send/decrypt actions
- Protected routes and session-aware navbar

## How to Run

Prerequisites: Node.js, Python 3, and MongoDB connection (Atlas or local)

1) Backend API (Node)
- Path: `backend/node`
- Create `.env` (see Env files below)
- Install and init DB:
  - npm install
  - npm run init:db
- Start API:
  - npm run dev

2) Stego Service (Python)
- Path: `backend/stego-service`
- Create `.env` (see Env files below) and ensure FERNET_KEY matches Node
- Create venv and install:
  - python -m venv venv
  - venv\Scripts\activate (Windows) or source venv/bin/activate (macOS/Linux)
  - pip install -r requirements.txt
- Start service (defaults to http://127.0.0.1:5001):
  - python app.py

3) Frontend (React)
- Path: `frontend`
- Create `.env` (see Env files below)
- Install and run:
  - npm install
  - npm run dev

## Env Files

Backend API (`backend/node/.env`)
- PORT=4000
- MONGO_URI=your_mongodb_connection_string
- MONGO_DB=MedSecure
- JWT_SECRET=your_jwt_secret
- COOKIE_NAME=med_token
- COOKIE_SECURE=false
- CLIENT_ORIGIN=http://localhost:5173
- STEGO_SERVICE_URL=http://127.0.0.1:5001
- FERNET_KEY=base64_fernet_key  (must MATCH stego-service)

Stego Service (`backend/stego-service/.env`)
- FERNET_KEY=base64_fernet_key  (must MATCH Node)
- PORT=5001  (optional; app defaults to 5001)

Frontend (`frontend/.env`)
- VITE_API_URL=http://localhost:4000

## Data Flow

1. Frontend sends request to Node API with credentials cookie
2. Node validates session and, for encrypt/decrypt, calls the Python stego-service
3. Python returns cipher_text/decrypted payload to Node
4. Node stores/retrieves message metadata and audit logs in MongoDB
5. Frontend displays inbox items and decrypted results
- Flask and React documentation
- LSB Steganography research papers
- Bootstrap and Lucide icon libraries

---

**Note**: This platform is designed for educational purposes to demonstrate steganography and encryption techniques. For production medical applications, additional security audits, HIPAA compliance, and professional security assessments are required.
