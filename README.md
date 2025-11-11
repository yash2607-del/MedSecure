# MedSecure - Medical Steganography Platform

A secure, steganography-based platform for exchanging sensitive patient data between doctors within a hospital network. MedSecure uses LSB (Least Significant Bit) steganography to hide encrypted patient information within image and audio files, ensuring complete confidentiality.

![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Security](https://img.shields.io/badge/Security-Steganography%20%2B%20Encryption-green)
![Status](https://img.shields.io/badge/Status-Active-success)

## 🎯 Overview

MedSecure enables healthcare professionals to securely transmit patient data by embedding encrypted information within seemingly innocent cover files (images or audio). The platform combines cryptographic encryption with steganographic techniques to provide multi-layered security for sensitive medical information.

## ✨ Key Features

### 🔐 Security & Encryption
- **LSB Steganography**: Hide patient data within PNG, JPEG, and WAV files using Least Significant Bit techniques
- **Fernet Encryption**: Military-grade symmetric encryption before data embedding
- **End-to-End Security**: Data is encrypted client-side and embedded server-side
- **Multi-Format Support**: Works with both image (PNG, JPEG, JPG) and audio (WAV) files

### 💬 Real-Time Communication
- **WebSocket Notifications**: Instant message alerts when new encrypted data arrives
- **Doctor-to-Doctor Messaging**: Direct, secure communication between healthcare professionals
- **Message Status Tracking**: Track which messages are new vs. already decrypted
- **Inbox Management**: Organized message center with sender information and timestamps

### 📊 Data Management
- **Structured JSON Payloads**: Patient ID, Patient Name, Secret Message, Sender, Recipient, Timestamp
- **Message History**: Complete record of all sent and received messages
- **File Storage**: Cloudinary integration for secure steganographic file storage
- **Decryption on Demand**: Retrieve and decrypt messages at any time

### 🔍 Audit & Compliance
- **Complete Audit Logs**: Track all encryption, transmission, and decryption activities
- **User Activity Monitoring**: Record every action with timestamps and user details
- **Role-Based Access**: Separate permissions for doctors and administrators
- **Admin Dashboard**: Comprehensive logs view for administrators

### 🎨 User Interface
- **Professional Medical Theme**: Dark blue gradient design matching healthcare standards
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Split-Panel Authentication**: Modern login/signup experience
- **Dashboard Analytics**: Real-time statistics and message counts
- **Intuitive Navigation**: Sidebar navigation with clear iconography

## 🏗️ Architecture

### System Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Doctor A (Sender)                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Login → 2. Upload Cover File (Image/Audio)                  │
│  3. Enter Patient Data (ID, Name, Message)                       │
│  4. Select Recipient Doctor → 5. Click "Encrypt & Send"         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Processing                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Receive file and patient data                                │
│  2. Create JSON payload: {patient_id, patient_name, message}    │
│  3. Encrypt payload using Fernet (AES-128)                      │
│  4. Embed encrypted data in cover file using LSB                │
│  5. Upload steganographic file to Cloudinary                    │
│  6. Store message metadata in MongoDB                           │
│  7. Send WebSocket notification to recipient                    │
│  8. Log activity in audit trail                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Doctor B (Recipient)                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Receive real-time notification                               │
│  2. View new message in Inbox                                    │
│  3. Click "Decrypt" button                                       │
│  4. Backend extracts data from steganographic file              │
│  5. Decrypt using Fernet → Display patient information          │
│  6. View data in structured popup modal                          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Registration/Login** → JWT token issued
2. **Encrypt & Send** → File uploaded with patient data
3. **Server Processing** → Encrypt → Embed → Store → Notify
4. **Real-Time Alert** → WebSocket push notification
5. **Inbox View** → List of received messages
6. **Decrypt** → Extract → Decrypt → Display
7. **Audit** → All actions logged to database

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask** | 3.0.3 | Web framework and REST API |
| **Flask-SocketIO** | 5.3.6 | WebSocket real-time communication |
| **Flask-CORS** | 5.0.0 | Cross-origin resource sharing |
| **Flask-JWT-Extended** | 4.6.0 | JWT authentication |
| **MongoDB** | via pymongo 4.9.1 | NoSQL database for users, messages, logs |
| **Cloudinary** | 1.41.0 | Cloud storage for steganographic files |
| **Cryptography** | - | Fernet symmetric encryption |
| **Pillow** | 10.4.0 | Image processing for LSB steganography |
| **SoundFile** | 0.12.1 | Audio processing for LSB steganography |
| **NumPy** | - | Numerical operations for steganography |
| **Eventlet** | 0.36.1 | Async networking library |

**Backend Structure:**
- `app2.py` - Main Flask application
- REST API endpoints for auth, encryption, decryption, messaging
- WebSocket event handlers for real-time notifications
- LSB steganography algorithms for images and audio
- MongoDB collections: `users`, `messages`, `audit_logs`

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **Vite** | 6.0.1 | Build tool and dev server |
| **React Router DOM** | 7.9.5 | Client-side routing |
| **Bootstrap** | 5.3.8 | CSS framework |
| **React-Bootstrap** | 2.10.10 | Bootstrap components for React |
| **Axios** | 1.13.1 | HTTP client for API requests |
| **Socket.io-client** | 4.8.1 | WebSocket client |
| **React-Toastify** | 10.0.6 | Toast notifications |
| **Lucide-react** | 0.263.1 | Modern icon library |

**Frontend Structure:**
```
src/
├── components/
│   ├── Navbar.jsx          # Top navigation with user menu
│   ├── PayloadModal.jsx    # Modal for displaying decrypted data
│   └── ProtectedRoute.jsx  # Route authentication guard
├── pages/
│   ├── Landing.jsx         # Public landing page
│   ├── Login.jsx           # Split-panel login
│   ├── Register.jsx        # Split-panel registration
│   ├── Dashboard.jsx       # Main dashboard with sidebar
│   ├── Encrypt.jsx         # Encryption form
│   ├── Decrypt.jsx         # Decryption form
│   ├── Inbox.jsx           # Message inbox
│   └── Logs.jsx            # Audit logs (admin only)
├── styles/
│   └── global.css          # Custom CSS with dark blue theme
├── App.jsx                 # Root component with routing
├── main.jsx                # Entry point
└── socket.js               # WebSocket client configuration
```

## 📋 Features Breakdown

### 1. Authentication System
- User registration with username, password, and role (doctor/admin)
- Secure login with JWT token generation
- Password hashing with bcrypt
- Role-based access control
- Session management with localStorage

### 2. Encryption & Steganography
- **Cover File Upload**: Accept PNG, JPEG, JPG, WAV files
- **Patient Data Input**: Patient ID, Patient Name, Secret Message
- **Recipient Selection**: Choose doctor to receive the message
- **Fernet Encryption**: Encrypt JSON payload before embedding
- **LSB Embedding**: Hide encrypted data in image pixels or audio samples
- **Cloudinary Upload**: Store steganographic file in cloud
- **Database Storage**: Save message metadata with file URL

### 3. Message Inbox
- Real-time message list with sender information
- Visual indicators for new vs. read messages
- Patient ID display
- File download links
- Timestamp for each message
- One-click decryption
- Auto-refresh capability

### 4. Decryption System
- Upload steganographic file
- Extract hidden data using LSB extraction
- Decrypt data using Fernet
- Parse JSON payload
- Display in formatted modal
- Copy-to-clipboard functionality
- Update message status to "decrypted"

### 5. Dashboard & Analytics
- Statistics cards: Total messages, New messages, Security status
- Quick action buttons
- Security features overview
- Personalized welcome message
- Responsive grid layout

### 6. Audit Logging
- Track all user actions:
  - REGISTER - User registration
  - LOGIN - User login
  - HIDE - Data encryption
  - SEND_MESSAGE - Message transmission
  - DECRYPT_MESSAGE - Message decryption
  - RETRIEVE - Manual file decryption
- Timestamp for each action
- User identification
- Patient ID tracking (when applicable)
- Admin-only access to full logs
- Doctors see only their own activity

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file:**
   ```env
   MONGO_URI=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   JWT_SECRET_KEY=your_jwt_secret_key
   FERNET_KEY=your_fernet_encryption_key
   ```

5. **Run the server:**
   ```bash
   python app2.py
   ```
   Server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Application will open on `http://localhost:5173`

## 📱 Usage Guide

### For Doctors

1. **Register an Account**
   - Click "Sign Up" on landing page
   - Enter username, password, select "Doctor" role
   - Submit registration

2. **Login**
   - Enter credentials
   - Redirected to dashboard

3. **Send Encrypted Message**
   - Navigate to "Encrypt" page
   - Upload cover file (image or audio)
   - Enter patient ID and name
   - Enter recipient doctor's username
   - Type confidential message
   - Click "Encrypt & Send"

4. **Receive Messages**
   - Real-time notification appears
   - Navigate to "Inbox"
   - View new messages (highlighted in blue)
   - Click "Decrypt" to view patient data

5. **Manual Decryption**
   - Navigate to "Decrypt" page
   - Upload steganographic file
   - Click "Retrieve & Decrypt"
   - View patient data in modal

### For Administrators

- Access all features that doctors have
- View "Logs" page to see all user activities
- Monitor system-wide encryption/decryption operations

## 🔒 Security Considerations

### Implemented Security Measures
✅ Password hashing (bcrypt)
✅ JWT authentication
✅ Fernet symmetric encryption (AES-128)
✅ LSB steganography for data hiding
✅ CORS protection
✅ Role-based access control
✅ Complete audit trail
✅ Secure file storage (Cloudinary)

### Best Practices
- Never share JWT tokens
- Use strong passwords
- Keep environment variables secure
- Regularly review audit logs
- Limit file sizes for uploads
- Validate all user inputs

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  password: String (hashed),
  role: String ("doctor" | "admin"),
  created_at: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  sender: String,
  recipient: String,
  patient_id: String,
  patient_name: String,
  file_url: String,
  cipher_text: String,
  decrypted: Boolean,
  created_at: Date
}
```

### Audit Logs Collection
```javascript
{
  _id: ObjectId,
  username: String,
  action: String,
  patient_id: String (optional),
  details: String (optional),
  timestamp: Date
}
```

## 🎨 Design Features

- **Dark Blue Theme**: Professional medical application aesthetic
- **Gradient Backgrounds**: Modern card designs with smooth gradients
- **Responsive Layout**: Mobile-first design approach
- **Icon Integration**: Lucide icons for better UX
- **Split-Panel Auth**: Attractive login/signup pages
- **Sidebar Navigation**: Easy access to all features
- **Toast Notifications**: User-friendly feedback system
- **Modal Dialogs**: Clean data presentation

## 🤝 Contributing

This is an academic project for Information Security coursework. Contributions are welcome for educational purposes.

## 📝 License

This project is developed for educational purposes as part of an Information Security course.

## 👥 Authors

- **Xaverick** - Initial work and development

## 🙏 Acknowledgments

- Information Security course materials
- Flask and React documentation
- LSB Steganography research papers
- Bootstrap and Lucide icon libraries

---

**Note**: This platform is designed for educational purposes to demonstrate steganography and encryption techniques. For production medical applications, additional security audits, HIPAA compliance, and professional security assessments are required.
