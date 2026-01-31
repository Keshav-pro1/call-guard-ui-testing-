import os
from dotenv import load_dotenv

load_dotenv("model/.env", override=True)

def check(name):
    val = os.getenv(name)
    if not val:
        print(f"{name}: MISSING")
        return
    
    issues = []
    if val.strip() != val:
        issues.append("HAS_WHITESPACE")
    if val.startswith('"') or val.startswith("'"):
        issues.append("HAS_QUOTES")
    if "\r" in val or "\n" in val:
        issues.append("HAS_NEWLINES")
        
    if issues:
        print(f"{name}: FAIL - {', '.join(issues)} (Len: {len(val)})")
    else:
        print(f"{name}: OK (Format looks good, Len: {len(val)})")

check("HF_TOKEN")
check("GROQ_API_KEY")
