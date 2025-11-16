# Environment Variables

Create a `.env` file in `node-backend/` with:

```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb+srv://<user>:<pass>@cluster-url/
MONGO_DB=medsecure
JWT_SECRET=replace_with_long_random_string
COOKIE_NAME=auth_token
COOKIE_SECURE=false
STEGO_SERVICE_URL=http://localhost:6001
FERNET_KEY=replace_with_base64_fernet_key
```

Create a `.env` for `stego-service/`:

```
FERNET_KEY=replace_with_base64_fernet_key
```

Generate a Fernet key using Python:

```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```
