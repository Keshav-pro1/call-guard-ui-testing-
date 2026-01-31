import os
import requests
from dotenv import load_dotenv
import reprlib

# Force reload of environment
load_dotenv("model/.env", override=True)

hf_token = os.getenv("HF_TOKEN")
groq_key = os.getenv("GROQ_API_KEY")

print("--- Environment Variable Inspection ---")

def inspect_var(name, value):
    if not value:
        print(f"{name}: [EMPTY/None]")
        return
    
    print(f"{name}:")
    print(f"  Length: {len(value)}")
    print(f"  Repr:   {repr(value)}")
    print(f"  First 5: {value[:5]}")
    print(f"  Last 5:  {value[-5:]}")
    
    # Check for common invisible characters
    if value.strip() != value:
        print("  WARNING: value has leading/trailing whitespace!")
    if "\r" in value:
        print("  WARNING: value contains Carriage Return (\\r)!")
    if "\n" in value:
        print("  WARNING: value contains Newline (\\n)!")

inspect_var("HF_TOKEN", hf_token)
inspect_var("GROQ_API_KEY", groq_key)

print("\n--- Network & API Connectivity Test ---")

# Test Hugging Face
print("Testing Hugging Face API...")
if hf_token:
    try:
        headers = {"Authorization": f"Bearer {hf_token.strip()}"}
        resp = requests.get("https://huggingface.co/api/whoami-v2", headers=headers, timeout=10)
        print(f"HF Status Code: {resp.status_code}")
        if resp.status_code == 200:
            print(f"HF Success: Logged in as {resp.json().get('name')}")
        else:
            print(f"HF Error: {resp.text[:200]}")
    except Exception as e:
        print(f"HF Connection Failed: {e}")
else:
    print("Skipping HF test (no token)")

# Test Groq
print("\nTesting Groq API...")
if groq_key:
    try:
        headers = {
            "Authorization": f"Bearer {groq_key.strip()}",
            "Content-Type": "application/json"
        }
        # Simple models list endpoint
        resp = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=10)
        print(f"Groq Status Code: {resp.status_code}")
        if resp.status_code == 200:
            print("Groq Success: API is accessible")
        else:
            print(f"Groq Error: {resp.text[:200]}")
    except Exception as e:
        print(f"Groq Connection Failed: {e}")
else:
    print("Skipping Groq test (no key)")
