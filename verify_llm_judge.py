
import sys
import os
import json

# Add model directory to path to import modules
sys.path.append(os.path.join(os.getcwd(), 'model'))

try:
    from sop_engine import SOPEngine
    import config
    
    # Initialize Engine
    print("Initializing SOPEngine...")
    engine = SOPEngine()
    
    # Mock Transcript (The one that failed before)
    transcription = [
        {"text": "Hello, welcome to battery smart support.", "start": 0.0, "end": 3.0},
        {"text": "Hi, my battery is not working since morning.", "start": 4.0, "end": 7.0},
        {"text": "I understand.", "start": 7.5, "end": 8.5},
        {"text": "Could you please tell me what issue are you facing?", "start": 9.0, "end": 12.0},
        {"text": "Or what seems to be the problem?", "start": 12.5, "end": 14.0}
    ]
    
    # Mock Rules (Simple)
    config.SOP_RULES["sop_rules"] = {
        "Greeting": {
            "steps": [
                {"text": "Agent should greet the customer", "internal_intent": "Establish initial customer contact with a greeting"}
            ],
            "weight": 10
        },
        "Diagnosis": {
             "steps": [
                {"text": "Agent should ask for the issue", "internal_intent": "Identify the reason for the call"}
            ],
            "weight": 10
        }
    }
    # Update engine rules to match mock
    engine.rules = config.SOP_RULES["sop_rules"]
    
    print("\nRunning check_adherence...")
    results = engine.check_adherence(transcription, {})
    
    print("\n--- RESULTS ---")
    print(json.dumps(results, indent=2))
    
    # Simple assertion
    greeting_status = results["Greeting"]["steps"][0]["status"]
    print(f"\nGreeting Status: {greeting_status}")
    
    if greeting_status == "PASS":
        print("SUCCESS: The LLM correctly identified the greeting intent!")
    else:
        print("FAILURE: The LLM failed to identify the greeting.")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
