# Battery Smart Auto-QA & Coaching System

This system automatically evaluates customer support calls for SOP adherence, sentiment, and resolution correctness.

## Features
- **Speech-to-Text**: multilingual (Hindi, English, Hinglish) to English transcription using `faster-whisper`.
- **Speaker Diarization**: Separates Agent vs Customer voices using `pyannote.audio`.
- **SOP Adherence**: Checks against `sop_rules.yaml`.
- **Sentiment Analysis**: Tracks customer emotion throughout the call.
- **Scoring & Alerts**: Generates final quality scores and supervisor alerts.

## Setup
1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Configure Environment**:
   - Rename `.env.example` to `.env`.
   - Add your `HF_TOKEN` (Required for diarization).
   - Accept terms for `pyannote/speaker-diarization-3.1` and `pyannote/segmentation-3.0` on Hugging Face.

3. **Run the Server**:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

## API Usage
- **Endpoint**: `POST /analyze-call/`
- **Body**: `file` (WAV/MP3 audio file)
- **Response**: Detailed JSON report including transcript, scores, and alerts.

## Project Structure
- `main.py`: FastAPI entry point.
- `stt_service.py`: Transcription and Diarization.
- `nlp_processor.py`: Cleaning, Segmentation, and Sentiment.
- `sop_engine.py`: SOP Evaluation logic.
- `scoring_service.py`: Automated scoring and insights.
- `sop_rules.yaml`: Configurable SOP definitions.
