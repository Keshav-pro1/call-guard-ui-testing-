import os
from dotenv import load_dotenv
from huggingface_hub import HfApi, login

load_dotenv("model/.env")
token = os.getenv("HF_TOKEN")

print(f"Token loaded directly: {token[:5]}...{token[-5:] if token else 'None'}")

if not token:
    print("Error: HF_TOKEN is empty.")
    exit(1)

api = HfApi(token=token)
try:
    user = api.whoami()
    print(f"Authenticated as: {user['name']} (Type: {user['type']})")
except Exception as e:
    print(f"Authentication failed: {e}")
    exit(1)

# Check model access
models = ["pyannote/speaker-diarization-3.1", "pyannote/segmentation-3.0"]
for model_id in models:
    try:
        print(f"Checking access to {model_id}...")
        info = api.model_info(model_id)
        print(f"SUCCESS: Access granted to {model_id}")
    except Exception as e:
        print(f"FAILURE: Cannot access {model_id}")
        print(f"Reason: {e}")
