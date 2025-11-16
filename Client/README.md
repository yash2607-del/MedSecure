# MedSecure – Medical Steganography

A secure, steganography-powered platform for healthcare professionals to exchange sensitive patient data. Uses LSB (Least Significant Bit) steganography combined with AES-128 Fernet encryption to hide encrypted patient records inside PNG images and WAV audio files.

## Architecture

This application consists of three independent services:

- **`frontend`** (this folder): React + Vite + React Bootstrap UI with responsive design
- **`node-backend`**: Express.js API with MongoDB for authentication, message routing, and audit logs
- **`stego-service`**: Python Flask microservice for LSB steganography and Fernet encryption/decryption

## Core Features

### 🔐 Security & Encryption
- **Fernet Encryption (AES-128)**: Patient data is encrypted before embedding using symmetric key cryptography
- **Vigenère Cipher**: Additional polyalphabetic cipher layer for message display logs
- **LSB Steganography**: Hides encrypted data within the least significant bits of PNG images or WAV audio files
- **JWT Authentication**: Secure session management with HTTP-only cookies
- **Password Security**: Real-time strength indicator, requirements checklist, and visibility toggle

### 📨 Messaging System
- **Doctor-to-Doctor Communication**: Send encrypted patient data directly to colleague doctors via email/username
- **Inbox Management**: View received messages with status tracking (new/decrypted), download stego and original files
- **Sent Messages**: Complete log of outgoing messages with cipher text preview and file downloads
- **Message Status Tracking**: Visual indicators for read/unread messages and decryption status

### 📁 File Handling
- **Multi-Format Support**: 
  - Images: PNG, JPEG, JPG (output always PNG to preserve LSB integrity)
  - Audio: WAV files with 16-bit PCM encoding
- **Automatic Extension Preservation**: Downloads maintain correct file extensions (.png, .wav, etc.)
- **Dual File Storage**: Both steganographic file and original cover file are preserved
- **Optional Cloudinary Integration**: Cloud storage support for stego and original files

### 🎨 User Interface
- **Unified Sky Blue Theme**: Consistent color scheme (#00b4d8) across all components
- **Responsive Dashboard**: Real-time statistics for total messages, new messages, and sent messages
- **Split-Panel Authentication**: Modern login/signup pages with feature highlights
- **Sticky Navigation**: Persistent navbar with user profile dropdown
- **Password Requirements**: Real-time validation with green/gray indicators for each requirement

### 📊 Audit & Compliance
- **Complete Audit Trail**: MongoDB logs for all encryption, send, decrypt, login, and logout events
- **Admin Access**: Role-based access control with admin audit log viewing
- **Timestamp Tracking**: Created/updated timestamps for all messages and actions

## Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (connection string required)

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
```

### Node Backend (.env)
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/medsecure
MONGO_DB=medsecure
JWT_SECRET=your_secret_key_here
COOKIE_NAME=auth_token
COOKIE_SECURE=false
CLIENT_ORIGIN=http://localhost:5173
STEGO_SERVICE_URL=http://127.0.0.1:6001
VIGENERE_KEY=MEDSECURE

# Optional: Cloudinary for file hosting
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Stego Service (.env)
```env
PORT=6001
FERNET_KEY=your_base64_fernet_key_here
```

**Generate Fernet Key** (Python):
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

## Installation & Setup

### 1. Stego Service (Python Flask)
```powershell
cd stego-service
pip install -r requirements.txt
# Create .env file with FERNET_KEY
python app.py
# Service runs on http://127.0.0.1:6001
```

### 2. Node Backend (Express.js)
```powershell
cd node-backend
npm install
# Create .env file with required variables
npm run dev
# API runs on http://localhost:4000
```

### 3. Frontend (React + Vite)
```powershell
cd frontend
npm install
# Create .env file with VITE_API_URL
npm run dev
# UI opens at http://localhost:5173
```

### 4. MongoDB Setup
Ensure MongoDB is running locally or use MongoDB Atlas connection string in `MONGO_URI`.

**Optional**: Initialize database with indexes:
```powershell
cd node-backend
npm run init:db
```

## Usage Flow

### Initial Setup
1. **Register**: Create account with username, email, and secure password (validated in real-time)
2. **Login**: Authenticate with email or username and password

### Sending Encrypted Messages
1. Navigate to **Dashboard** → **Encrypt & Send Message**
2. **Select Cover File**: Choose PNG, JPEG, or WAV file (optional but recommended)
3. **Enter Patient Details**:
   - Patient ID (e.g., P-2024-001)
   - Patient Name
   - Recipient doctor's email
   - Confidential medical notes/data
4. **Submit**: System performs:
   - Fernet encryption of patient data
   - LSB embedding into cover file (creates stego file)
   - Vigenère cipher encoding for display
   - Storage in MongoDB with audit log
5. **Download**: Receive stego file (PNG/WAV) for secure transmission

### Receiving & Viewing Messages
1. Navigate to **Dashboard** → **View Inbox**
2. **Message List** displays:
   - Status indicator (new/opened)
   - Sender doctor name (capitalized)
   - Patient ID and name
   - Received timestamp
3. **Download Options**:
   - **Stego File**: Download the steganographic PNG/WAV
   - **Original File**: Download the original cover file with correct extension

### Decrypting Messages
1. Navigate to **Dashboard** → **Decrypt Message**
2. **Upload Stego File**: Select PNG or WAV file containing hidden data
3. **Extract & Decrypt**: System performs:
   - LSB extraction from image/audio
   - Fernet decryption with shared key
   - Display patient data in modal popup
4. **View Details**:
   - Patient ID and name
   - Sender doctor information
   - Confidential medical message
   - Option to copy JSON payload

### Viewing Sent Messages
1. Navigate to **Dashboard** → **Sent** (sidebar)
2. Review all outgoing messages with:
   - Recipient doctor name
   - Patient information
   - Vigenère cipher text preview
   - Original file download option
   - Sent timestamp

### Admin Features (Admin Role Only)
1. Navigate to **Dashboard** → **Logs**
2. View comprehensive audit trail:
   - All user actions (register, login, send, decrypt)
   - Timestamps and user information
   - Patient IDs for message-related events
   - Success/failure status

## Technical Stack

### Frontend
- **React 18** with Vite for fast development
- **React Bootstrap** for UI components
- **React Router** for navigation
- **Axios** for API calls
- **React Toastify** for notifications
- **Lucide React** for icons

### Backend (Node.js)
- **Express.js** for REST API
- **MongoDB + Mongoose** for data persistence
- **JWT** for authentication
- **bcryptjs** for password hashing
- **cookie-parser** for session management
- **CORS** for cross-origin requests

### Stego Service (Python)
- **Flask** web framework
- **Cryptography** (Fernet) for AES-128 encryption
- **Pillow (PIL)** for image processing
- **NumPy** for pixel array manipulation
- **soundfile** for WAV audio processing

## Security Considerations

⚠️ **Important**: This application uses a **shared Fernet key** across all doctors via the centralized stego-service. This design is appropriate for internal hospital networks where all medical staff share the same encryption key. For production deployments requiring end-to-end encryption, consider implementing:

- Individual key pairs per user
- Public key infrastructure (PKI)
- Key exchange protocols
- Separate encryption keys per message

### Current Security Features
✅ JWT-based authentication  
✅ HTTP-only cookies to prevent XSS  
✅ Password strength validation  
✅ Audit logging for compliance  
✅ LSB steganography for covert communication  
✅ Fernet (AES-128) symmetric encryption  
✅ HTTPS support (set COOKIE_SECURE=true)  

## License & Disclaimer

This project is for **educational and research purposes**. Medical data handling requires compliance with regulations such as HIPAA (US), GDPR (EU), and local healthcare data protection laws. Always consult with legal and security professionals before deploying in production healthcare environments.

---

That's it — keep all three services running while you use the app. For any issues, check the console logs in each terminal.
