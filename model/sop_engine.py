import config
import os
import json
from llm_service import SOPConverter
import re

class SOPEngine:
    def __init__(self):
        self.rules = config.SOP_RULES["sop_rules"]
        self.risks = config.SOP_RULES["sentiments"]["risk_keywords"]
        self.llm_service = SOPConverter()
        print("SOP Engine initialized (LLM-as-a-Judge Mode)")
        
    def check_adherence(self, transcription, segmented_transcript, rules=None, sop_id=None):
        """
        Orchestrates the LLM evaluation of the call against SOP rules.
        """
        results = {}
        
        # Load policy text if sop_id is provided
        policy_text = ""
        if sop_id:
            policy_path = os.path.join(config.POLICIES_DIR, f"{sop_id}_policy.json")
            if os.path.exists(policy_path):
                try:
                    with open(policy_path, "r", encoding="utf-8") as f:
                        policy_data = json.load(f)
                        policy_text = policy_data.get("raw_text", "")
                except Exception as e:
                    print(f"Error loading policy for evaluation: {e}")

        # Use provided rules or fall back to default
        current_rules = rules if rules else self.rules
        
        if not transcription:
            return {section: {"score": 0, "max_score": d.get("weight", 0), "steps": []} for section, d in current_rules.items()}

        # 1. Prepare Transcript Text for LLM (including speaker labels)
        transcript_text = "\n".join([f"[{seg['speaker']}][{seg['start']:.1f}s] {seg['text']}" for seg in transcription])
        
        # 2. Call LLM Service
        # We pass the full rules because we want the LLM to verify all sections
        evaluation_data = self.llm_service.evaluate_call(transcript_text, current_rules, policy_text=policy_text)
        
        # 3. Format Results for Frontend
        # The LLM returns a dict like: {"Greeting::0": {"status": "PASS", ...}}
        
        for section, details in current_rules.items():
            matches = []
            
            # Normalize keys for more robust matching
            normalized_eval = {str(k).strip().upper(): v for k, v in evaluation_data.items()}
            
            # Highly robust matching logic to handle AI key mangling (e.g. spaces to underscores, case changes)
            def normalize_key(k):
                return re.sub(r'[^a-zA-Z0-9]', '', str(k)).lower()

            normalized_eval = {normalize_key(k): v for k, v in evaluation_data.items()}
            
            for idx, step_config in enumerate(details.get("steps", [])):
                # Primary key format: "Section::0"
                step_id = f"{section}::{idx}"
                
                # Check 1: Exact match
                eval_result = evaluation_data.get(step_id)
                
                # Check 2: Normalized match (alphanumeric only, lowercase)
                if not eval_result:
                    eval_result = normalized_eval.get(normalize_key(step_id))
                
                # Check 3: Just the index if the AI only returned indices (e.g. "0", "1")
                if not eval_result:
                    eval_result = evaluation_data.get(str(idx)) or normalized_eval.get(str(idx))

                if not eval_result:
                    eval_result = {}

                status = eval_result.get("status", "FAIL")
                reason = eval_result.get("reason", "No evaluation returned from AI.")
                confidence = eval_result.get("confidence", 0.0)
                
                matches.append({
                    "step": step_config["text"], 
                    "status": status, 
                    "confidence": confidence,
                    "matched_text": None, # LLM doesn't always return exact distinct segment
                    "timestamp": None,
                    "reason": reason,
                    "suggestion": step_config.get("suggestion") if status != "PASS" else None
                })
            
            # Calculate section score
            passed_weight = sum([1 for m in matches if m["status"] == "PASS"])
            # We can support partial if the LLM returns it, but for now binary or partial
            partial_weight = sum([0.5 for m in matches if m["status"] == "PARTIAL"])
            
            total_steps = len(matches)
            weight = details.get("weight", 0)
            
            score = 0
            if total_steps > 0:
                score = ((passed_weight + partial_weight) / total_steps) * weight
            
            results[section] = {
                "score": round(score, 2),
                "max_score": weight,
                "steps": matches
            }
        
        return results

    def detect_risks(self, transcription):
        """Detect risk keywords (Lite version without embeddings for now)"""
        found_risks = []
        detected_risks = set()
        
        if not transcription:
            return found_risks
        
        # Keyword-based detection
        full_text = " ".join([seg["text"] for seg in transcription]).lower()
        for risk in self.risks:
            if risk.lower() in full_text:
                risk_key = f"keyword_{risk.lower()}"
                if risk_key not in detected_risks:
                    found_risks.append({
                        "type": "keyword",
                        "risk": risk,
                        "detection_method": "exact_match"
                    })
                    detected_risks.add(risk_key)
        
        return found_risks

    def validate_resolution(self, transcription, sop_results=None):
        """Validate that resolution steps are present and meaningful"""
        # 1. Heuristic check: Check if SOP sections for resolution passed
        checklist_passed = False
        if sop_results:
            resolution_keywords = ["resolution", "closure", "closing", "solution", "outcome", "end", "fix"]
            res_results = None
            for key, data in sop_results.items():
                if any(kw in key.lower() for kw in resolution_keywords):
                    res_results = data
                    break
            
            if res_results:
                passed_steps = [s for s in res_results["steps"] if s["status"] == "PASS"]
                if len(passed_steps) > 0:
                    checklist_passed = True
        
        if checklist_passed:
            return {"status": "PASS", "reason": "Resolution confirmed via SOP adherence"}

        # 2. LLM deep check: If heuristic fails, ask the LLM for context
        if transcription:
            transcript_text = "\n".join([f"[{seg['speaker']}]: {seg['text']}" for seg in transcription])
            llm_result = self.llm_service.verify_resolution(transcript_text)
            return llm_result
            
        return {
            "status": "FAIL", 
            "reason": "Resolution could not be confirmed. Customer issue may still be open.", 
            "segment_count": 0
        }
