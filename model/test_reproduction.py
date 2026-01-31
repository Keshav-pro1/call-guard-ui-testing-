import sop_engine
import sys
import os

# Create an instance
try:
    engine = sop_engine.SOPEngine()
except Exception as e:
    print(f"Error initializing engine: {e}")
    sys.exit(1)

# Mock transcription: Single segment containing both greeting steps
transcription = [
    {"text": "Welcome to Battery Smart. How can I help you?", "start": 1.0, "end": 4.0},
     # Add a dummy segment to see if it grabs this instead for the second step
    {"text": "My battery is not working properly.", "start": 5.36, "end": 8.0}
]

# Mock segmented_transcript (empty is fine for this test as we rely on transcription list)
segmented_transcript = {"Greeting": []}

# Run check
print("Running check_adherence...")
results = engine.check_adherence(transcription, segmented_transcript)

# Print results for Greeting
print("\nGreeting Results:")
if "greeting" in results:
    for step in results["greeting"]["steps"]:
        print(f"Step: '{step['step']}'")
        print(f"Status: {step['status']}")
        print(f"Matched: '{step['matched_text']}'")
        print(f"Confidence: {step['confidence']}")  # Added
        print(f"Reason: {step['reason']}")
        print("-" * 20)
else:
    print("No greeting section found in results.")
