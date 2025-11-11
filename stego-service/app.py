import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from cryptography.fernet import Fernet
import base64
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

FERNET_KEY = os.getenv('FERNET_KEY')
if not FERNET_KEY:
    raise RuntimeError('FERNET_KEY missing')
fernet = Fernet(FERNET_KEY)

@app.get('/health')
def health():
    return jsonify({'ok': True})

# In this simplified microservice, Node handles file storage.
# We only encrypt/decrypt JSON payloads for transport.

@app.post('/encrypt')
def encrypt_payload():
    body = request.get_json(force=True)
    required = ['patient_id', 'patient_name', 'data', 'sender', 'recipient']
    if not all(k in body for k in required):
        return jsonify({'error': 'Missing fields'}), 400
    payload = {
        'patient_id': body['patient_id'],
        'patient_name': body['patient_name'],
        'message': body['data'],
        'sender': body['sender'],
        'recipient': body['recipient']
    }
    j = json.dumps(payload).encode()
    token = fernet.encrypt(j).decode()
    return jsonify({'cipher_text': token})

@app.post('/decrypt')
def decrypt_payload():
    body = request.get_json(force=True)
    token = body.get('cipher_text')
    if not token:
        return jsonify({'error': 'cipher_text required'}), 400
    try:
        j = fernet.decrypt(token.encode())
        data = json.loads(j.decode())
        return jsonify({'data': data})
    except Exception:
        return jsonify({'error': 'Invalid token'}), 400

if __name__ == '__main__':
    app.run(port=6001)
