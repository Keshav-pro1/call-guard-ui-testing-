import sys
import os
import json
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

# Add model directory to path to import main
sys.path.append(os.path.join(os.getcwd(), 'model'))

# Mock services BEFORE importing main
import model.stt_service
import model.nlp_processor
import model.sop_engine
import model.scoring_service
import model.audio_processor

# Create mocks
mock_stt = MagicMock()
mock_stt.process_call.return_value = ([
    {"speaker": "SPEAKER_00", "text": "Hello, welcome.", "start": 0.0, "end": 2.0},
    {"speaker": "SPEAKER_01", "text": "Hi, I have an issue.", "start": 2.0, "end": 4.0}
], MagicMock(language="en", language_probability=0.99, duration=10.0))

mock_nlp = MagicMock()
mock_nlp.clean_text.side_effect = lambda x: x
mock_nlp.segment_transcript.return_value = {"Greeting": [{"text": "Hello"}]}
mock_nlp.get_sentiment_trajectory.return_value = [0.5, 0.6]

mock_sop = MagicMock()
mock_sop.check_adherence.return_value = [{"step": "Greeting", "status": "PASS", "score": 10, "max_score": 10}]
mock_sop.detect_risks.return_value = []
mock_sop.validate_resolution.return_value = {"status": "Resolved", "reason": "issue fixed"}

mock_scoring = MagicMock()
mock_scoring.calculate_final_score.return_value = {"final_score": 95, "grade": "A"}
mock_scoring.generate_coaching_insights.return_value = ["Good job"]
mock_scoring.generate_alerts.return_value = []

mock_audio = MagicMock()
mock_audio.trim_silences.return_value = (True, 100.0, 90.0)

# Patch the modules
model.stt_service.STTService = MagicMock(return_value=mock_stt)
model.nlp_processor.NLPProcessor = MagicMock(return_value=mock_nlp)
model.sop_engine.SOPEngine = MagicMock(return_value=mock_sop)
model.scoring_service.ScoringService = MagicMock(return_value=mock_scoring)
model.audio_processor.AudioProcessor = MagicMock(return_value=mock_audio)

# Now import main
from model.main import app, db_service

client = TestClient(app)

def test_region_workflow():
    print("Testing Region Workflow...")
    
    # Clean DB
    if os.path.exists(db_service.db_path):
        os.remove(db_service.db_path)
    db_service.ensure_db_exists()

    # 1. Analyze Call with Region
    print("1. Uploading call with region 'TestCity'...")
    dummy_wav = b"RIFF" + b"\x00" * 40 # Minimal mock wav
    

    response = client.post(
        "/analyze-call/",
        files={"file": ("test.wav", dummy_wav, "audio/wav")},
        data={"region": "TestCity"}
    )
    
    print("Response status:", response.status_code)
    data = response.json()
    print("Response body:", json.dumps(data, indent=2))
    
    assert response.status_code == 200
    if "error" in data:
        raise Exception(f"API Error: {data['error']}")
        
    assert data["metadata"]["region"] == "TestCity"
    print("   Call analysis success. Region in metadata: OK")
    
    # 2. Check Insights for TestCity
    print("2. Fetching insights for 'TestCity'...")
    response = client.get("/insights?region=TestCity")
    assert response.status_code == 200
    insights = response.json()
    
    assert insights["region"] == "TestCity"
    assert insights["total_calls"] == 1
    assert insights["average_score"] == 95
    print("   Insights aggregation: OK")
    
    # 3. Check Insights for OtherCity (should be empty)
    print("3. Fetching insights for 'OtherCity'...")
    response = client.get("/insights?region=OtherCity")
    assert response.status_code == 200
    insights = response.json()
    
    assert insights["total_calls"] == 0
    print("   Filter working correctly: OK")
    
    # 4. Long Call with Region
    print("4. Uploading long call with region 'TestCity'...")
    response = client.post(
        "/analyze-long-call/",
        files={"file": ("long_test.wav", dummy_wav, "audio/wav")},
        data={"region": "TestCity"}
    )
    assert response.status_code == 200
    
    # 5. Check Insights updated
    print("5. Verifying insights updated count...")
    response = client.get("/insights?region=TestCity")
    insights = response.json()
    assert insights["total_calls"] == 2
    print("   Insights count updated: OK")
    
    print("\nALL VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_region_workflow()
