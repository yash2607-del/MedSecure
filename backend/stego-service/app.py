from flask import Flask, request, jsonify
from flask_cors import CORS
from cryptography.fernet import Fernet, InvalidToken
import json, os

app = Flask(__name__)
CORS(app)

FERNET_KEY = os.getenv('FERNET_KEY')
if not FERNET_KEY:
    # For dev convenience; in prod must be set explicitly
    FERNET_KEY = Fernet.generate_key().decode()
    print('Generated FERNET_KEY (dev only):', FERNET_KEY)
fernet = Fernet(FERNET_KEY.encode())

@app.get('/health')
def health():
    return jsonify({ 'ok': True })

@app.post('/encrypt')
def encrypt():
    data = request.get_json(silent=True) or {}
    payload = data.get('payload')
    if payload is None:
        return jsonify({ 'message': 'payload required' }), 400
    if not isinstance(payload, (str, bytes)):
        payload = json.dumps(payload)
    if isinstance(payload, str):
        payload = payload.encode()
    token = fernet.encrypt(payload).decode()
    return jsonify({ 'cipher_text': token })

@app.post('/decrypt')
def decrypt():
    data = request.get_json(silent=True) or {}
    token = data.get('cipher_text')
    if not token:
        return jsonify({ 'message': 'cipher_text required' }), 400
    try:
        raw = fernet.decrypt(token.encode()).decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = { 'raw': raw }
        return jsonify({ 'payload': payload })
    except InvalidToken:
        return jsonify({ 'message': 'invalid cipher_text' }), 400

if __name__ == '__main__':
    app.run(port=5001, debug=True)
