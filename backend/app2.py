# app2.py
from flask import Flask, request, jsonify
from pymongo import MongoClient
import os
import numpy as np
from PIL import Image
import cloudinary
import cloudinary.uploader
from flask_cors import CORS
from dotenv import load_dotenv
import soundfile as sf
from cryptography.fernet import Fernet
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from datetime import datetime, timedelta
import uuid
from flask_socketio import SocketIO, emit, join_room
import json

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# === Configs ===
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "super-secret-change-me")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=4)

jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173"], async_mode="threading")

# MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
# Existing cluster DB where you stored patient files
files_db = client["stenography"]  # uses your existing cluster DB name
patient_collection = files_db.get_collection("patients")

# New separate DB for auth & logs
auth_db = client["stenography_auth"]
users_col = auth_db.get_collection("users")
logs_col = auth_db.get_collection("audit_logs")
messages_col = auth_db.get_collection("messages")

# Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Fernet key (symmetric encryption for message payloads)
FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    # For development only: generate and print once
    FERNET_KEY = Fernet.generate_key().decode()
    print("Generated FERNET_KEY for development (put this into your .env):", FERNET_KEY)
f = Fernet(FERNET_KEY.encode())

# Map username -> set of socket session ids
connected_users = {}

# Roles helper
def role_required(allowed_roles):
    def wrapper(fn):
        @jwt_required()
        def decorator(*args, **kwargs):
            identity = get_jwt_identity()
            user = users_col.find_one({"username": identity})
            if not user or user.get("role") not in allowed_roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)
        decorator.__name__ = fn.__name__
        return decorator
    return wrapper

# ----------------------
# Utility: log action
# ----------------------
def log_action(username, action, patient_id=None, file_url=None, details=None):
    logs_col.insert_one({
        "username": username,
        "action": action,
        "patient_id": patient_id,
        "file_url": file_url,
        "details": details,
        "timestamp": datetime.utcnow()
    })

def notify_user(recipient_username, event, payload):
    sids = connected_users.get(recipient_username)
    if not sids:
        return
    for sid in list(sids):
        socketio.emit(event, payload, room=sid)

# ----------------------
# Steganography helpers
# ----------------------
def hide_text_in_image(image_path, text, output_path=None):
    if output_path is None:
        output_path = f"temp/stego_{uuid.uuid4().hex}.png"
    image = Image.open(image_path)
    if image.mode != 'RGB':
        image = image.convert('RGB')
    pixels = np.array(image, dtype=np.uint8)
    binary_text = ''.join(format(ord(c), '08b') for c in text) + '11111110'
    total_bits = pixels.size
    if len(binary_text) > total_bits:
        raise ValueError("Text too long to hide in this image.")
    data_index = 0
    it = np.nditer(pixels, flags=['multi_index'], op_flags=['readwrite'])
    while not it.finished and data_index < len(binary_text):
        val = int(it[0])
        val = (val & 0xFE) | int(binary_text[data_index])
        it[0][...] = val
        data_index += 1
        it.iternext()
    stego_image = Image.fromarray(pixels, mode='RGB')
    stego_image.save(output_path)
    return output_path

def retrieve_text_from_image(image_path):
    image = Image.open(image_path)
    if image.mode != 'RGB':
        image = image.convert('RGB')
    pixels = np.array(image, dtype=np.uint8)
    bits = []
    it = np.nditer(pixels, flags=['multi_index'])
    for v in it:
        bits.append(str(int(v) & 1))
    binary_text = ''.join(bits)
    message = ""
    for i in range(0, len(binary_text), 8):
        byte = binary_text[i:i+8]
        if byte == "11111110":
            break
        if len(byte) == 8:
            message += chr(int(byte, 2))
    return message

def hide_text_in_audio(audio_path, message, output_audio_path=None):
    if output_audio_path is None:
        output_audio_path = f"temp/stego_{uuid.uuid4().hex}.wav"
    data, samplerate = sf.read(audio_path, dtype='int16')
    if len(data.shape) > 1:
        data = data[:, 0]
    binary_message = ''.join(format(ord(c), '08b') for c in message) + '11111110'
    if len(binary_message) > len(data):
        raise ValueError("Message too long for this audio.")
    data = np.copy(data)
    for i, bit in enumerate(binary_message):
        data[i] = (data[i] & ~1) | int(bit)
    sf.write(output_audio_path, data, samplerate)
    return output_audio_path

def retrieve_text_from_audio(audio_path):
    data, samplerate = sf.read(audio_path, dtype='int16')
    if len(data.shape) > 1:
        data = data[:, 0]
    bits = ''.join(str(int(x) & 1) for x in data)
    message = ""
    for i in range(0, len(bits), 8):
        byte = bits[i:i+8]
        if byte == "11111110":
            break
        if len(byte) == 8:
            message += chr(int(byte, 2))
    return message

# ----------------------
# Socket.IO events
# ----------------------
@socketio.on('connect')
def on_connect():
    emit('connected', {'message': 'socket connected'})

@socketio.on('register')
def on_register(data):
    token = data.get('token')
    if not token:
        emit('error', {'error': 'missing token'})
        return
    from flask_jwt_extended import decode_token
    try:
        decoded = decode_token(token)
        username = decoded.get('sub')
    except Exception:
        emit('error', {'error': 'invalid token'})
        return
    if not username:
        emit('error', {'error': 'invalid token'})
        return
    sids = connected_users.get(username, set())
    sids.add(request.sid)
    connected_users[username] = sids
    join_room(request.sid)
    emit('registered', {'username': username})

@socketio.on('disconnect')
def on_disconnect():
    for user, sids in list(connected_users.items()):
        if request.sid in sids:
            sids.discard(request.sid)
            if not sids:
                connected_users.pop(user, None)
            break

# ----------------------
# Auth endpoints
# ----------------------
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "doctor")  # default doctor
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400
    if users_col.find_one({"username": username}):
        return jsonify({"error": "username already exists"}), 400
    pw_hash = generate_password_hash(password)
    users_col.insert_one({
        "username": username,
        "password_hash": pw_hash,
        "role": role,
        "created_at": datetime.utcnow()
    })
    log_action(username, "REGISTER")
    return jsonify({"message": "registered"}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    user = users_col.find_one({"username": username})
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "invalid credentials"}), 401
    access = create_access_token(identity=username)
    refresh = create_refresh_token(identity=username)
    users_col.update_one({"username": username}, {"$set": {"last_login": datetime.utcnow()}})
    log_action(username, "LOGIN")
    return jsonify({"access_token": access, "refresh_token": refresh, "role": user.get("role", "doctor")})

# ----------------------
# Hide endpoint (doctor only)
# ----------------------
@app.route('/hide', methods=['POST'])
@role_required(["doctor"])
def hide_data():
    try:
        username = get_jwt_identity()
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        # Required fields: patient_id, patient_name, data (secret message)
        if not all(k in request.form for k in ["patient_id", "patient_name", "data"]):
            return jsonify({"error": "patient_id, patient_name, data are required"}), 400
        file = request.files['file']
        # Validate file type
        # Allow any image/* or audio/* mimetype
        if not (file.mimetype.startswith('image/') or file.mimetype.startswith('audio/')):
            return jsonify({"error": "Unsupported file type (expect image/* or audio/*)"}), 400
        patient_id = request.form['patient_id']
        patient_name = request.form['patient_name']
        patient_data = request.form['data']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        os.makedirs("temp", exist_ok=True)
        file_path = os.path.join("temp", file.filename)
        file.save(file_path)
        # Bundle structured payload
        payload = {
            "patient_id": patient_id,
            "patient_name": patient_name,
            "message": patient_data,
            "sender": username,
            "created_at": datetime.utcnow().isoformat()
        }
        cipher_text = f.encrypt(json.dumps(payload).encode()).decode()
        # stego based on type
        if file.mimetype.startswith('image/'):
            stego_path = hide_text_in_image(file_path, cipher_text)
        elif file.mimetype.startswith('audio/'):
            stego_path = hide_text_in_audio(file_path, cipher_text)
        else:
            if os.path.exists(file_path): os.remove(file_path)
            return jsonify({"error": "Unsupported file type"}), 400
        upload_result = cloudinary.uploader.upload(stego_path, resource_type="auto")
        if os.path.exists(file_path): os.remove(file_path)
        if os.path.exists(stego_path): os.remove(stego_path)
        # save metadata to files_db (existing users' collection)
        patient_collection.insert_one({
            "patient_id": patient_id,
            "uploader": username,
            "file_url": upload_result["secure_url"],
            "file_type": file.mimetype.split('/')[0],
            "created_at": datetime.utcnow()
        })
        log_action(username, "HIDE", patient_id=patient_id, file_url=upload_result["secure_url"])
        return jsonify({"message": "hidden", "file_url": upload_result["secure_url"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------
# Messaging endpoints
# ----------------------
@app.route('/messages/send', methods=['POST'])
@jwt_required()
def send_message():
    username = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({'error': 'file required'}), 400
    recipient = request.form.get('recipient')
    patient_id = request.form.get('patient_id')
    patient_name = request.form.get('patient_name')
    plaintext = request.form.get('data')
    # All fields required now
    if not all([recipient, patient_id, patient_name, plaintext]):
        return jsonify({'error': 'recipient, patient_id, patient_name, data are required'}), 400
    if not users_col.find_one({'username': recipient}):
        return jsonify({'error': 'recipient not found'}), 404
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'empty filename'}), 400
    if not (file.mimetype.startswith('image/') or file.mimetype.startswith('audio/')):
        return jsonify({'error': 'Unsupported file type (expect image/* or audio/*)'}), 400
    os.makedirs('temp', exist_ok=True)
    path = os.path.join('temp', file.filename)
    file.save(path)
    payload = {
        'patient_id': patient_id,
        'patient_name': patient_name,
        'message': plaintext,
        'sender': username,
        'recipient': recipient,
        'created_at': datetime.utcnow().isoformat()
    }
    cipher_text = f.encrypt(json.dumps(payload).encode()).decode()
    if file.mimetype.startswith('image/'):
        stego_path = hide_text_in_image(path, cipher_text)
    else:
        stego_path = hide_text_in_audio(path, cipher_text)
    upload_result = cloudinary.uploader.upload(stego_path, resource_type='auto')
    if os.path.exists(path): os.remove(path)
    if os.path.exists(stego_path): os.remove(stego_path)
    doc = {
        'sender': username,
        'recipient': recipient,
        'patient_id': patient_id,
        'patient_name': patient_name,
        'file_url': upload_result['secure_url'],
        'file_type': file.mimetype.split('/')[0],
        'cipher_text': cipher_text,
        'created_at': datetime.utcnow(),
        'decrypted': False
    }
    messages_col.insert_one(doc)
    log_action(username, 'SEND_MESSAGE', patient_id=patient_id, file_url=upload_result['secure_url'])
    notify_user(recipient, 'new_message', {'from': username, 'file_url': doc['file_url']})
    return jsonify({'message': 'sent', 'file_url': doc['file_url']}), 201

@app.route('/messages/inbox', methods=['GET'])
@jwt_required()
def inbox():
    username = get_jwt_identity()
    q = list(messages_col.find({'recipient': username}).sort('created_at', -1))
    for m in q:
        m['_id'] = str(m['_id'])
        m['created_at'] = m['created_at'].isoformat()
    return jsonify({'messages': q})

@app.route('/messages/decrypt', methods=['POST'])
@jwt_required()
def decrypt_message():
    username = get_jwt_identity()
    msg_id = request.json.get('message_id') if request.is_json else request.form.get('message_id')
    if not msg_id:
        return jsonify({'error': 'message_id required'}), 400
    from bson import ObjectId
    msg = messages_col.find_one({'_id': ObjectId(msg_id), 'recipient': username})
    if not msg:
        return jsonify({'error': 'message not found'}), 404
    try:
        decrypted_raw = f.decrypt(msg['cipher_text'].encode()).decode()
        try:
            payload = json.loads(decrypted_raw)
        except json.JSONDecodeError:
            payload = {"raw": decrypted_raw}
    except Exception:
        payload = {"error": "DECRYPTION FAILED"}
    messages_col.update_one({'_id': msg['_id']}, {'$set': {'decrypted': True, 'decrypted_at': datetime.utcnow()}})
    log_action(username, 'DECRYPT_MESSAGE', details=str(msg['_id']))
    return jsonify({'data': payload, 'file_url': msg['file_url']})

# ----------------------
# Retrieve endpoint (doctor + admin can retrieve)
# ----------------------
@app.route('/retrieve', methods=['POST'])
@role_required(["doctor", "admin"])
def retrieve_data():
    try:
        username = get_jwt_identity()
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        os.makedirs("temp", exist_ok=True)
        file_path = os.path.join("temp", file.filename)
        file.save(file_path)
        if file.mimetype.startswith('image/'):
            encrypted_text = retrieve_text_from_image(file_path)
        elif file.mimetype.startswith('audio/'):
            encrypted_text = retrieve_text_from_audio(file_path)
        else:
            if os.path.exists(file_path): os.remove(file_path)
            return jsonify({"error": "Unsupported file type"}), 400
        if os.path.exists(file_path): os.remove(file_path)
        try:
            decrypted_raw = f.decrypt(encrypted_text.encode()).decode()
            try:
                payload = json.loads(decrypted_raw)
            except json.JSONDecodeError:
                payload = {"raw": decrypted_raw}
        except Exception:
            payload = {"error": "DECRYPTION FAILED"}
        log_action(username, "RETRIEVE", details="from uploaded file")
        return jsonify({"message": "retrieved", "data": payload}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------
# Fetch logs (admin only)
# ----------------------
@app.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    username = get_jwt_identity()
    user = users_col.find_one({"username": username})
    is_admin = user and user.get("role") == "admin"
    query = {} if is_admin else {"username": username}
    q = list(logs_col.find(query).sort("timestamp", -1).limit(500))
    for item in q:
        item["_id"] = str(item["_id"])
        item["timestamp"] = item["timestamp"].isoformat()
    return jsonify({"logs": q})

if __name__ == '__main__':
    os.makedirs("temp", exist_ok=True)
    # Use SocketIO server to enable websockets
    socketio.run(app, debug=True, port=5000)
