import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict
import config

class DBService:
    def __init__(self, db_path: str = "data/calls.json"):
        self.db_path = db_path
        self.ensure_db_exists()

    def ensure_db_exists(self):
        """Ensure the JSON database file and its directory exist."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        if not os.path.exists(self.db_path):
            with open(self.db_path, "w") as f:
                json.dump([], f)

    def load_calls(self) -> List[Dict]:
        """Load all calls from the JSON database."""
        try:
            with open(self.db_path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def save_call(self, call_data: Dict[str, Any]):
        """Save a new call record to the database."""
        calls = self.load_calls()
        
        # Add timestamp if not present
        if "timestamp" not in call_data:
            call_data["timestamp"] = datetime.now().isoformat()
            
        calls.append(call_data)
        
        with open(self.db_path, "w") as f:
            json.dump(calls, f, indent=2)

    def get_calls(self, region: Optional[str] = None) -> List[Dict]:
        """Get calls, optionally filtered by region."""
        calls = self.load_calls()
        if region:
            return [c for c in calls if c.get("metadata", {}).get("region") == region]
        return calls

    def get_aggregated_insights(self, region: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate aggregated insights from stored calls.
        If region is provided, filters data for that region.
        """
        calls = self.get_calls(region)
        
        if not calls:
            return {
                "total_calls": 0,
                "average_score": 0,
                "sop_pass_rate": 0,
                "common_issues": [],
                "sentiment_trend": []
            }

        total_calls = len(calls)
        total_score = 0
        passed_sop_count = 0
        failed_sops = defaultdict(int)
        sentiment_scores = []
        
        for call in calls:
            evaluation = call.get("evaluation", {})
            scoring = evaluation.get("scoring", {})
            
            # Score
            score = scoring.get("final_score", 0) or 0
            if isinstance(score, str):
                try:
                    score = float(score.replace('%', ''))
                except ValueError:
                    score = 0
            total_score += score
            
            # SOP Adherence
            sop_results = evaluation.get("sop_adherence", [])
            all_passed = True
            for sop in sop_results:
                if sop.get("status") == "FAIL":
                    all_passed = False
                    step_name = sop.get("step", "Unknown Step")
                    failed_sops[step_name] += 1
            
            if all_passed:
                passed_sop_count += 1
                
            # Sentiment (taking average of trajectory if available, or just end sentiment)
            # This is a simplification; a real system might process the trajectory more deeply.
            # Assuming we can derive a simple sentiment metric here or just track count.
            
        avg_score = total_score / total_calls if total_calls > 0 else 0
        sop_pass_rate = (passed_sop_count / total_calls * 100) if total_calls > 0 else 0
        
        # Sort common issues
        sorted_issues = sorted(failed_sops.items(), key=lambda x: x[1], reverse=True)
        
        insights = {
            "region": region if region else "All Regions",
            "total_calls": total_calls,
            "average_score": round(avg_score, 2),
            "sop_pass_rate": round(sop_pass_rate, 2),
            "common_sop_failures": [
                {"step": k, "count": v, "percentage": round(v/total_calls*100, 1)} 
                for k, v in sorted_issues[:5]
            ],
            "recent_calls_summary": [
                 {
                     "call_id": c.get("call_id"),
                     "score": c.get("evaluation", {}).get("scoring", {}).get("final_score"),
                     "date": c.get("timestamp")
                 } for c in calls[-5:] # Last 5 calls
            ]
        }
        
        return insights

    def get_coaching_data(self) -> List[Dict[str, Any]]:
        """
        Get calls that require coaching intervention.
        Filters for calls with:
        - Critical risks detected
        - SOP failures
        - Low scores (< 75%)
        """
        calls = self.load_calls()
        coaching_calls = []
        
        for call in calls:
            needs_coaching = False
            reasons = []
            
            # Check Risks
            risks = call.get("evaluation", {}).get("risks_detected", [])
            if risks:
                needs_coaching = True
                reasons.append(f"Risk: {risks[0]}") # Take first risk as title
                
            # Check SOP Failures
            sop_adherence = call.get("evaluation", {}).get("sop_adherence", {})
            failures = []
            
            # Handle if it's a dictionary (Section -> content) or list (old format)
            if isinstance(sop_adherence, dict):
                for section_name, section_data in sop_adherence.items():
                    steps = section_data.get("steps", [])
                    for step in steps:
                        if isinstance(step, dict) and step.get("status") == "FAIL":
                            failures.append(step)
            elif isinstance(sop_adherence, list):
                # Legacy support
                for step in sop_adherence:
                    if isinstance(step, dict) and step.get("status") == "FAIL":
                        failures.append(step)

            if failures:
                needs_coaching = True
                if not reasons:
                   first_fail = failures[0].get('step', 'Unknown Step')
                   reasons.append(f"SOP Failure: {first_fail}")
            
            # Check Score
            
            # Check Score
            score = call.get("evaluation", {}).get("scoring", {}).get("final_score", 0)
            # Handle string scores if any
            if isinstance(score, str):
                try:
                    score_val = float(score.replace('%', ''))
                except:
                    score_val = 0
            else:
                score_val = score
                
            if score_val < 75:
                needs_coaching = True
                if not reasons:
                    reasons.append("Low Call Score")
            
            if needs_coaching:
                coaching_calls.append({
                    "call_id": call.get("call_id"),
                    "date": call.get("timestamp"),
                    "problem_title": reasons[0] if reasons else "General Improvements Needed",
                    "score": score,
                    "region": call.get("metadata", {}).get("region", "Unknown"),
                    "duration": call.get("metadata", {}).get("duration", 0),
                    "tags": reasons
                })
                
        # Sort by date descending
        coaching_calls.sort(key=lambda x: x["date"], reverse=True)
        return coaching_calls

    def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific call by ID."""
        calls = self.load_calls()
        for call in calls:
            if call.get("call_id") == call_id:
                return call
        return None
