
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Form
import shutil
import os
import uuid
from stt_service import STTService
from nlp_processor import NLPProcessor
from sop_engine import SOPEngine
from scoring_service import ScoringService
from audio_processor import AudioProcessor
from policy_processor import PolicyProcessor
from db_service import DBService
from typing import Optional
import config

app = FastAPI(title="Battery Smart Auto-QA & Coaching System")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Changed to False to allow * for simple debugging first
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
stt_service = STTService()
nlp_processor = NLPProcessor()
sop_engine = SOPEngine()
scoring_service = ScoringService()
audio_processor = AudioProcessor()
policy_processor = PolicyProcessor(config.POLICIES_DIR)
db_service = DBService()

from llm_service import SOPConverter # Moved here as per instruction's implied placement
import yaml # Moved here as per instruction's implied placement
sop_converter = SOPConverter()

@app.get("/sop-rules")
@app.get("/sop_rules")
def get_sop_rules():
    return config.load_sop_rules()

@app.post("/update-sop")
async def update_sop(rules: dict):
    """
    Expects a dict matching the structure of sop_rules.yaml
    Processes 'text' through LLM to generate 'internal_intent'
    """
    try:
        # Process each step to extract intent
        for section, details in rules.get("sop_rules", {}).items():
            for step in details.get("steps", []):
                # Only convert if it doesn't have an internal_intent yet 
                # or if we want to refresh it
                step["internal_intent"] = sop_converter.convert_to_intent(step["text"])
        
        # Save to yaml
        with open(config.SOP_RULES_PATH, "w") as f:
            yaml.dump(rules, f, default_flow_style=False)
        
        # Refresh local config and engine
        config.SOP_RULES = rules
        sop_engine.rules = rules["sop_rules"]
        
        return {"status": "success", "message": "SOP rules updated and intents extracted"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/generate-sop-suggestion")
async def generate_sop_suggestion(request: dict):
    """
    input: {"text": "ask for email"}
    output: {"intent": "...", "suggestion": "..."}
    """
    raw_text = request.get("text", "")
    if not raw_text:
        return {"error": "No text provided"}
    
    return sop_converter.generate_sop_suggestion(raw_text)

@app.post("/upload-policy")
async def upload_policy(
    sop_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Uploads and processes a policy PDF for a specific SOP.
    """
    try:
        file_path = os.path.join(config.POLICIES_DIR, f"{sop_id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        policy_data = policy_processor.process_policy(file_path, sop_id)
        
        return {
            "status": "success", 
            "message": "Policy uploaded and processed",
            "sop_id": sop_id,
            "filename": file.filename
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Welcome to Battery Smart Auto-QA System API"}

@app.get("/insights")
def get_insights(region: Optional[str] = None):
    """Get aggregated insights, optionally filtered by region/city."""
    return db_service.get_aggregated_insights(region)

@app.get("/coaching-needs")
def get_coaching_needs():
    """Get list of calls requiring coaching."""
    return db_service.get_coaching_data()

@app.get("/call/{call_id}")
def get_call_data(call_id: str):
    """Get full details of a specific call."""
    call = db_service.get_call(call_id)
    if not call:
        return {"error": "Call not found"}
    return call

@app.post("/analyze-call/")
async def analyze_call(
    file: UploadFile = File(...),
    sop_rules: str = Form(None),
    sop_id: str = Form(None),
    region: str = Form(None)
):
    # 1. Save uploaded file
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Parse custom SOP rules if provided
        custom_rules = None
        if sop_rules:
            try:
                import json
                parsed = json.loads(sop_rules)
                if "sop_rules" in parsed:
                    custom_rules = parsed["sop_rules"]
            except Exception as e:
                print(f"Error parsing SOP rules: {e}")

        # 2. Process Pipeline
        # A. Transcription & Diarization
        transcription, info = stt_service.process_call(file_path)
        
        # B. NLP Processing (Cleaning & Segmentation)
        for seg in transcription:
            seg["text"] = nlp_processor.clean_text(seg["text"])
        
        segmented_transcript = nlp_processor.segment_transcript(transcription)
        sentiment_trajectory = nlp_processor.get_sentiment_trajectory(transcription)
        
        # C. SOP & Scoring
        sop_results = sop_engine.check_adherence(transcription, segmented_transcript, rules=custom_rules, sop_id=sop_id)
        risks = sop_engine.detect_risks(transcription)
        resolution_status = sop_engine.validate_resolution(transcription, sop_results)
        
        scoring_summary = scoring_service.calculate_final_score(sop_results, sentiment_trajectory)
        coaching_insights = scoring_service.generate_coaching_insights(sop_results)
        alerts = scoring_service.generate_alerts(sop_results, risks, scoring_summary)
        
        # 3. Clean up (Optional: move to a processed folder instead of deleting)
        # os.remove(file_path)
        
        result = {
            "call_id": file_id,
            "metadata": {
                "language": info.language,
                "language_probability": info.language_probability,
                "duration": info.duration,
                "region": region
            },
            "transcript": transcription,
            "segmented_transcript_summary": {section: len(segs) for section, segs in segmented_transcript.items()},
            "evaluation": {
                "sop_adherence": sop_results,
                "resolution": resolution_status,
                "risks_detected": risks,
                "scoring": scoring_summary
            },
            "coaching_insights": coaching_insights,
            "supervisor_alerts": alerts
        }
        
        # Save to DB
        db_service.save_call(result)
        
        return result
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze-long-call/")
async def analyze_long_call(
    file: UploadFile = File(...),
    sop_rules: str = Form(None),
    sop_id: str = Form(None),
    region: str = Form(None)
):
    # 1. Save uploaded file
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    original_file_path = os.path.join(UPLOAD_DIR, f"{file_id}_orig{file_ext}")
    trimmed_file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
    
    with open(original_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # 2. Trim Silences
        success, orig_dur, new_dur = audio_processor.trim_silences(original_file_path, trimmed_file_path)
        
        # If trimming failed (e.g. file too quiet), use original
        if not success:
            shutil.copy(original_file_path, trimmed_file_path)
            new_dur = orig_dur

        # Parse custom SOP rules if provided
        custom_rules = None
        if sop_rules:
            try:
                import json
                parsed = json.loads(sop_rules)
                if "sop_rules" in parsed:
                    custom_rules = parsed["sop_rules"]
            except Exception as e:
                print(f"Error parsing SOP rules: {e}")

        # 3. Process Pipeline (using the trimmed file)
        # A. Transcription & Diarization
        transcription, info = stt_service.process_call(trimmed_file_path)
        
        # B. NLP Processing (Cleaning & Segmentation)
        for seg in transcription:
            seg["text"] = nlp_processor.clean_text(seg["text"])
        
        segmented_transcript = nlp_processor.segment_transcript(transcription)
        sentiment_trajectory = nlp_processor.get_sentiment_trajectory(transcription)
        
        # C. SOP & Scoring
        sop_results = sop_engine.check_adherence(transcription, segmented_transcript, rules=custom_rules, sop_id=sop_id)
        risks = sop_engine.detect_risks(transcription)
        resolution_status = sop_engine.validate_resolution(transcription, sop_results)
        
        scoring_summary = scoring_service.calculate_final_score(sop_results, sentiment_trajectory)
        coaching_insights = scoring_service.generate_coaching_insights(sop_results)
        alerts = scoring_service.generate_alerts(sop_results, risks, scoring_summary)
        
        result = {
            "call_id": file_id,
            "metadata": {
                "language": info.language,
                "language_probability": info.language_probability,
                "duration": info.duration,
                "original_duration": orig_dur,
                "trimmed_duration": orig_dur - new_dur,
                "is_long_call": True,
                "region": region
            },
            "transcript": transcription,
            "segmented_transcript_summary": {section: len(segs) for section, segs in segmented_transcript.items()},
            "evaluation": {
                "sop_adherence": sop_results,
                "resolution": resolution_status,
                "risks_detected": risks,
                "scoring": scoring_summary
            },
            "coaching_insights": coaching_insights,
            "supervisor_alerts": alerts
        }
        
        # Save to DB
        db_service.save_call(result)
        
        return result
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}

@app.post("/process-sop-intents")
async def process_sop_intents(rules: dict):
    """
    Processes 'text' through LLM to generate 'internal_intent' for a given SOP structure.
    Returns the processed rules without saving to disk.
    """
    try:
        # Process each step to extract intent
        for section, details in rules.get("sop_rules", {}).items():
            for step in details.get("steps", []):
                # Only convert if it doesn't have an internal_intent yet 
                # or if we want to refresh it (here we assume if text changed or new, frontend handles it, 
                # but to be safe we can just regenerate if missing)
                if not step.get("internal_intent"):
                    step["internal_intent"] = sop_converter.convert_to_intent(step["text"])
        
        return {"status": "success", "processed_rules": rules}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

