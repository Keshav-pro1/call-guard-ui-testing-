import requests
import time

def test_root():
    try:
        response = requests.get("http://127.0.0.1:8000/")
        print(f"Root endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Root endpoint failed: {e}")

if __name__ == "__main__":
    print("Testing backend connectivity...")
    test_root()
