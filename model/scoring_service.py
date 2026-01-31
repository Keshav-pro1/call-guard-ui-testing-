class ScoringService:
    def calculate_final_score(self, sop_results, sentiment_trajectory):
        total_score = 0
        max_possible = sum([res["max_score"] for res in sop_results.values()])
        
        for res in sop_results.values():
            total_score += res["score"]
            
        # Sentiment penalty/bonus (example logic)
        avg_sentiment = sum([t["score"] for t in sentiment_trajectory]) / len(sentiment_trajectory) if sentiment_trajectory else 0
        sentiment_mod = avg_sentiment * 10 # -10 to +10 range
        
        final_score = min(max(total_score + sentiment_mod, 0), max_possible)
        percentage = (final_score / max_possible) * 100 if max_possible > 0 else 0
        
        # Determine Grade
        if percentage >= 90: grade = "A+"
        elif percentage >= 80: grade = "A"
        elif percentage >= 70: grade = "B"
        elif percentage >= 50: grade = "C"
        else: grade = "D"
        
        return {
            "total_score": round(final_score, 2),
            "final_score": round(percentage, 2),
            "percentage": round(percentage, 2),
            "avg_sentiment": round(avg_sentiment, 2),
            "grade": grade
        }

    def generate_coaching_insights(self, sop_results):
        insights = []
        for section, details in sop_results.items():
            failed_steps = [s["step"] for s in details["steps"] if s["status"] == "FAIL"]
            if failed_steps:
                insights.append(f"Focus on {section}: Missing {', '.join(failed_steps)}")
        
        if not insights:
            insights.append("Great job! No major SOP violations detected.")
            
        return insights

    def generate_alerts(self, sop_results, risks, scoring_summary):
        alerts = []
        if risks:
            risk_msgs = [r.get("risk", "Unknown risk") for r in risks]
            alerts.append(f"Critical risks detected: {', '.join(risk_msgs)}")
        
        if scoring_summary.get("avg_sentiment", 0) < -0.5:
            alerts.append("High customer frustration detected.")
            
        low_adherence = [sec for sec, res in sop_results.items() if res["score"] < res["max_score"] * 0.5]
        if low_adherence:
            alerts.append(f"Low SOP adherence in: {', '.join(low_adherence)}")
            
        return alerts
