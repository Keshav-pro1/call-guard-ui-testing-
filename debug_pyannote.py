import torch
import torchaudio
from pyannote.audio import Pipeline
import os
from dotenv import load_dotenv

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    print("HF_TOKEN not found")
    exit()

audio_path = r"uploads\6c995d24-d1ab-4992-a2a0-5542e8c9d72e.ogg"
if not os.path.exists(audio_path):
    # Try another file if the specific one is gone
    uploads = os.listdir("uploads")
    ogg_files = [f for f in uploads if f.endswith(".ogg")]
    if ogg_files:
        audio_path = os.path.join("uploads", ogg_files[0])
    else:
        print("No audio file found for testing")
        exit()

print(f"Testing with {audio_path}")
pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", token=HF_TOKEN)

waveform, sample_rate = torchaudio.load(audio_path)
diarization = pipeline({"waveform": waveform, "sample_rate": sample_rate})

print(f"Type of diarization: {type(diarization)}")
print(f"Dir of diarization: {dir(diarization)}")

if hasattr(diarization, "itertracks"):
    print("itertracks exists")
else:
    print("itertracks does NOT exist")
