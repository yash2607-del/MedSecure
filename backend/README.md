# Backend Overview

This folder contains:
- Node API (auth, messages, audit) in `node/`
- Python stego microservice in `stego-service/`

## Node API
Path: `backend/node`

Env (`backend/node/.env`):
PORT=4000
MONGO_URI=your_mongodb_connection_string
MONGO_DB=MedSecure
JWT_SECRET=your_jwt_secret
COOKIE_NAME=med_token
COOKIE_SECURE=false
CLIENT_ORIGIN=http://localhost:5173
STEGO_SERVICE_URL=http://127.0.0.1:5001
FERNET_KEY=base64_fernet_key (must match stego-service)

Install & run:
npm install
npm run init:db
npm run dev

## Stego Service (Python)
Path: `backend/stego-service`

Env (`backend/stego-service/.env`):
FERNET_KEY=base64_fernet_key (must match Node)
PORT=5001 (optional)

Setup & run:
python -m venv venv
venv\\Scripts\\activate (Windows) or source venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
python app.py

## Data Flow (Doctor to Doctor)
1. Doctor A submits cover file + patient data.
2. Node API requests encryption from stego-service.
3. Encrypted payload bound to message metadata, audit logged.
4. Doctor B sees inbox item and decrypts.
5. Action recorded in audit logs.
