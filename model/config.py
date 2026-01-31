import os
from dotenv import load_dotenv
import yaml

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
DEVICE = os.getenv("DEVICE", "cuda") # Change to cuda if GPU is available
SIMILARITY_MODEL = "all-MiniLM-L6-v2"
SIMILARITY_THRESHOLD = 0.6
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLM_MODEL = "llama-3.3-70b-versatile"


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SOP_RULES_PATH = os.path.join(BASE_DIR, "sop_rules.yaml")
POLICIES_DIR = os.path.join(BASE_DIR, "policies")
os.makedirs(POLICIES_DIR, exist_ok=True)

def load_sop_rules():
    with open(SOP_RULES_PATH, "r") as f:
        return yaml.safe_load(f)

SOP_RULES = load_sop_rules()
