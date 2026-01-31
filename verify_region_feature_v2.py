import sys
import os
import json
from unittest.mock import MagicMock

# 1. Setup Mocks via sys.modules BEFORE importing main
# This prevents the real modules (and their heavy model loads) from being imported

mock_stt_module = MagicMock()
mock_nlp_module = MagicMock()
mock_sop_module = MagicMock()
mock_scoring_module = MagicMock()
mock_audio_module = MagicMock()
mock_policy_module = MagicMock()
mock_llm_module = MagicMock()
mock_config_module = MagicMock()

# Setup STT Mock
mock_stt_instance = MagicMock()
mock_stt_instance.process_call.return_value = ([
    {"speaker": "SPEAKER_00", "text": "Hello", "start": 0.0, "end": 1.0}
], MagicMock(language="en", language_probability=0.99, duration=10.0))
mock_stt_module.STTService.return_value = mock_stt_instance

# Setup NLP Mock
mock_nlp_instance = MagicMock()
mock_nlp_instance.clean_text.side_effect = lambda x: x
mock_nlp_instance.segment_transcript.return_value = {"Start": [{"text": "Hello"}]}
mock_nlp_instance.get_sentiment_trajectory.return_value = [0.5]
mock_nlp_module.NLPProcessor.return_value = mock_nlp_instance

# Setup SOP Mock
mock_sop_instance = MagicMock()
mock_sop_instance.check_adherence.return_value = []
mock_sop_instance.detect_risks.return_value = []
mock_sop_instance.validate_resolution.return_value = {"status": "Resolved", "reason": ""}
mock_sop_module.SOPEngine.return_value = mock_sop_instance

# Setup Scoring Mock
mock_scoring_instance = MagicMock()
mock_scoring_instance.calculate_final_score.return_value = {"final_score": 100, "grade": "A"}
mock_scoring_instance.generate_coaching_insights.return_value = []
mock_scoring_instance.generate_alerts.return_value = []
mock_scoring_module.ScoringService.return_value = mock_scoring_instance

# Setup Audio Mock
mock_audio_instance = MagicMock()
mock_audio_instance.trim_silences.return_value = (True, 100.0, 90.0)
mock_audio_module.AudioProcessor.return_value = mock_audio_instance

# Setup Policy Mock
mock_policy_instance = MagicMock()
mock_policy_module.PolicyProcessor.return_value = mock_policy_instance

# Setup Config
mock_config_module.POLICIES_DIR = "policies"
mock_config_module.SOP_RULES = {}
mock_config_module.load_sop_rules.return_value = {}

# Apply patches to sys.modules
sys.modules['stt_service'] = mock_stt_module
sys.modules['nlp_processor'] = mock_nlp_module
sys.modules['sop_engine'] = mock_sop_module
sys.modules['scoring_service'] = mock_scoring_module
sys.modules['audio_processor'] = mock_audio_module
sys.modules['policy_processor'] = mock_policy_module
sys.modules['llm_service'] = mock_llm_module
sys.modules['config'] = mock_config_module

# Also mock 'model.stt_service' etc in case they are imported that way
sys.modules['model.stt_service'] = mock_stt_module
sys.modules['model.nlp_processor'] = mock_nlp_module
# ... (others if needed, but main does 'from stt_service')

# 2. Add Project Path and Import Main
sys.path.append(os.path.join(os.getcwd(), 'model'))
# We also need to add current dir if main.py does 'import config' which assumes cwd
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
# Now import main - it should use our mocked modules
try:
    from model.main import app, db_service
except ImportError:
    # Fallback if running from model dir
    sys.path.append('model')
    from main import app, db_service

client = TestClient(app)

def test_region_workflow():
    print("Testing Region Workflow with Mocks...")
    
    # Clean DB
    if os.path.exists(db_service.db_path):
        os.remove(db_service.db_path)
    db_service.ensure_db_exists()

    # 1. Analyze Call with Region
    print("1. Uploading call with region 'TestCity'...")
    dummy_wav = b"RIFF" + b"\x00" * 40 
    
    response = client.post(
        "/analyze-call/",
        files={"file": ("test.wav", dummy_wav, "audio/wav")},
        data={"region": "TestCity"}
    )
    
    if response.status_code != 200:
        print("Error Response:", response.text)
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["region"] == "TestCity"
    print("   Call analysis success. Region in metadata: OK")
    
    # 2. Check Insights
    print("2. Fetching insights for 'TestCity'...")
    response = client.get("/insights?region=TestCity")
    assert response.status_code == 200
    insights = response.json()
    
    assert insights["region"] == "TestCity"
    assert insights["total_calls"] == 1
    print("   Insights aggregation: OK")
    
    # 3. Check Filter
    print("3. Fetching insights for 'OtherCity'...")
    response = client.get("/insights?region=OtherCity")
    assert response.status_code == 200
    insights = response.json()
    assert insights["total_calls"] == 0
    print("   Filter working correctly: OK")
    
    # 4. Long Call
    print("4. Uploading long call with region 'TestCity'...")
    response = client.post(
        "/analyze-long-call/",
        files={"file": ("long_test.wav", dummy_wav, "audio/wav")},
        data={"region": "TestCity"}
    )
    assert response.status_code == 200
    
    # 5. Verify Count
    print("5. Verifying insights updated count...")
    response = client.get("/insights?region=TestCity")
    insights = response.json()
    assert insights["total_calls"] == 2
    print("   Insights count updated: OK")
    
    print("\nALL VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_region_workflow()
