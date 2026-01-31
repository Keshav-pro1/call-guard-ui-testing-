
import sys
import os
import json
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

# 1. Setup Mocks via sys.modules
mock_llm_module = MagicMock()
mock_stt_module = MagicMock()
mock_nlp_module = MagicMock()
mock_sop_engine_module = MagicMock()
mock_scoring_module = MagicMock()
mock_audio_module = MagicMock()
mock_policy_module = MagicMock()
mock_config_module = MagicMock()
mock_db_module = MagicMock()

# Setup LLM Mock specifically for suggestions
mock_sop_converter = MagicMock()
mock_sop_converter.generate_sop_suggestion.return_value = {
    "intent": "Agent asks for the customer's name.",
    "suggestion": "Could you please tell me your name?"
}
mock_llm_module.SOPConverter.return_value = mock_sop_converter

# Generic Mocks for others preventing load
mock_stt_module.STTService.return_value = MagicMock()
mock_nlp_module.NLPProcessor.return_value = MagicMock()
mock_sop_engine_module.SOPEngine.return_value = MagicMock()
mock_scoring_module.ScoringService.return_value = MagicMock()
mock_audio_module.AudioProcessor.return_value = MagicMock()
mock_policy_module.PolicyProcessor.return_value = MagicMock()
mock_db_module.DBService.return_value = MagicMock()

sys.modules['llm_service'] = mock_llm_module
sys.modules['stt_service'] = mock_stt_module
sys.modules['nlp_processor'] = mock_nlp_module
sys.modules['sop_engine'] = mock_sop_engine_module
sys.modules['scoring_service'] = mock_scoring_module
sys.modules['audio_processor'] = mock_audio_module
sys.modules['policy_processor'] = mock_policy_module
sys.modules['db_service'] = mock_db_module
sys.modules['config'] = mock_config_module

sys.path.append(os.path.join(os.getcwd(), 'model'))
sys.path.append(os.getcwd())

# Import app after mocks
try:
    from model.main import app
except ImportError:
    sys.path.append('model')
    from main import app

client = TestClient(app)

def test_suggestion_endpoint():
    print("Testing /generate-sop-suggestion...")
    
    response = client.post(
        "/generate-sop-suggestion",
        json={"text": "ask name"}
    )
    
    if response.status_code != 200:
        print("Error:", response.text)
        
    assert response.status_code == 200
    data = response.json()
    
    print("Response:", json.dumps(data, indent=2))
    
    assert data["intent"] == "Agent asks for the customer's name."
    assert "suggestion" in data
    print("Verification Passed!")

if __name__ == "__main__":
    test_suggestion_endpoint()
