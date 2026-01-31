from transformers import pipeline
import config
import re

class NLPProcessor:
    def __init__(self):
        print("Loading Sentiment Analysis model...")
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis", 
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=0 if config.DEVICE == "cuda" else -1
        )

    def clean_text(self, text: str):
        # Remove filler words and extra whitespace
        fillers = r'\b(umm|uhh|ah|like|you know|basically)\b'
        text = re.sub(fillers, '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def segment_transcript(self, transcription):
        total_segments = len(transcription)
        if total_segments == 0:
            return {}
        
        sections = {
            "Greeting": [],
            "Problem Identification": [],
            "Diagnosis / Action": [],
            "Resolution": [],
            "Closure": []
        }
        
        for i, segment in enumerate(transcription):
            text = segment["text"].lower()
            
            # Greeting: Usually the first 2-3 segments or specific keywords
            if i < 3 and ("welcome" in text or "hello" in text or "hi" in text or "smart" in text):
                sections["Greeting"].append(segment)
            # Closure: Usually the last 2-3 segments or specific keywords
            elif i > total_segments - 4 and ("thank you" in text or "bye" in text or "great day" in text or "help" in text):
                sections["Closure"].append(segment)
            # Problem: Keywords like problem, issue, work, charging
            elif "problem" in text or "issue" in text or "not working" in text or "not charging" in text:
                sections["Problem Identification"].append(segment)
            # Resolution: Keywords like fixed, resolved, done, hour, time
            elif "fixed" in text or "resolved" in text or "done" in text or "restart" in text or "hours" in text:
                sections["Resolution"].append(segment)
            else:
                # Fallback based on position
                if i < total_segments * 0.2:
                    sections["Greeting"].append(segment)
                elif i < total_segments * 0.5:
                    sections["Problem Identification"].append(segment)
                elif i < total_segments * 0.7:
                    sections["Diagnosis / Action"].append(segment)
                elif i < total_segments * 0.9:
                    sections["Resolution"].append(segment)
                else:
                    sections["Closure"].append(segment)
                    
        return sections

    def analyze_sentiment(self, text: str):
        result = self.sentiment_analyzer(text)[0]
        return result # {'label': 'POSITIVE', 'score': 0.99}

    def get_sentiment_trajectory(self, transcription):
        trajectory = []
        for segment in transcription:
            sent = self.analyze_sentiment(segment["text"])
            trajectory.append({
                "time": segment["start"],
                "score": sent["score"] if sent["label"] == "POSITIVE" else -sent["score"]
            })
        return trajectory
