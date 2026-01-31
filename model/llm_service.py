import os
import json
import httpx
import config
import dotenv



class SOPConverter:
    def __init__(self):
        self.api_key = config.GROQ_API_KEY
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = config.LLM_MODEL

    def convert_to_intent(self, script_text: str) -> str:
        """
        Converts a script-like sentence into a high-level support objective.
        Example: "Welcome to Battery Smart" -> "Agent identifies the company and greets the caller."
        """
        if not self.api_key or "your_groq_api_key" in self.api_key:
            print("Warning: GROQ_API_KEY not configured. Falling back to raw text.")
            return script_text

        prompt = f"""
        You are an expert Quality Assurance analyst for customer support.
        Convert the following support script line into a high-level support objective (intent).
        Focus on the ACTION the agent must perform, not the specific words they must say.
        Keep the output concise (max 15 words).

        Script line: "{script_text}"

        Intent:"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You convert support scripts into descriptive evaluation intents."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 50
        }

        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=data, timeout=10.0)
                response.raise_for_status()
                result = response.json()
                intent = result["choices"][0]["message"]["content"].strip()
                # Clean up any quotes the LLM might have added
                intent = intent.replace('"', '').replace("'", "")
                return intent
        except Exception as e:
            print(f"Error calling Groq API: {e}")
            return script_text # Fallback to original text if API fails


    def generate_sop_suggestion(self, raw_instruction: str) -> dict:
        """
        Generates a formal intent and a script suggestion from a raw instruction.
        Example: "Ask name" -> {
            "intent": "Agent verifies the customer's name.",
            "suggestion": "May I have your name, please?"
        }
        """
        if not self.api_key or "your_groq_api_key" in self.api_key:
            return {
                "intent": raw_instruction,
                "suggestion": "API Key Missing"
            }

        prompt = f"""
        You are an expert Script Writer for Customer Support.
        Convert the following raw instruction into:
        1. A formal internal intent (what the agent achieves).
        2. A polite, effective script line (what the agent says).

        Raw Instruction: "{raw_instruction}"

        Return JSON only:
        {{
            "intent": "...",
            "suggestion": "..."
        }}
        """

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant that outputs valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }

        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=data, timeout=10.0)
                if response.status_code != 200:
                    return {"intent": raw_instruction, "suggestion": "Error generating"}
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception as e:
            print(f"Error calling Groq API for suggestion: {e}")
            return {"intent": raw_instruction, "suggestion": "Error"}

    def evaluate_call(self, transcript_text: str, sop_rules: dict, policy_text: str = "") -> dict:
        """
        Evaluates the call transcript against the SOP rules using the LLM as a judge.
        Optional policy_text acts as authoritative constraints/guardrails.
        """
        if not self.api_key or "your_groq_api_key" in self.api_key:
            print("Warning: GROQ_API_KEY not configured. Cannot perform LLM evaluation.")
            return {} # Should handle fallback or error upstream

        # Construct a checklist for the LLM
        checklist_prompt = ""
        flat_steps = []
        for section, details in sop_rules.items():
            checklist_prompt += f"\nSection: {section}\n"
            for idx, step in enumerate(details.get("steps", [])):
                # Use internal_intent if available (it's the descriptive objective), or text
                objective = step.get("internal_intent", step["text"])
                step_id = f"{section}::{idx}" 
                checklist_prompt += f"- [StepID: {step_id}] Requirement: {objective}\n"
                flat_steps.append({"id": step_id, "obj": objective, "original": step})

        policy_guardrail = ""
        if policy_text:
            policy_guardrail = f"""
        AUTHORITATIVE POLICY CONSTRAINTS (HARD GUARDRAILS):
        {policy_text}

        IMPORTANT: The above policy is the authoritative source for allowed vs forbidden actions. 
        - If the Agent promises or implies an action not explicitly allowed in the policy, mark the relevant StepID as FAIL.
        - If the policy contradicts the conversational intent, the POLICY ALWAYS WINS.
        - Evaluate the Agent's resolution correctness strictly against these policy constraints.
        """

        prompt = f"""
        You are an expert QA Analyst evaluating a customer support call for compliance and fulfillment.
        
        {policy_guardrail}

        TRANSCRIPT (with speaker labels):
        {transcript_text}
        
        CHECKLIST TO EVALUATE:
        {checklist_prompt}
        
        INSTRUCTIONS:
        For each StepID in the checklist, determine if the requirement was fulfilled during the conversation.
        
        CRITICAL GUIDELINES:
        1. FULFILLMENT OVER WORDING: Do not look for exact phrases. Look for whether the objective was met naturally.
        2. HOLISTIC VIEW: A requirement can be fulfilled by the Agent's words, the Customer's words, or the overall context.
        3. CUSTOMER-LED FULFILLMENT: If the Customer provides information or fulfills a requirement before the Agent asks, mark it as PASS. The Agent does not need to repeat it unless necessary for confirmation.
        4. NATURAL CONVERSATION: If the Agent acknowledges or acts upon information provided by the Customer, mark as PASS. (e.g., if Customer says "My battery isn't working" and Agent says "I understand", the "Issue Identification" is a PASS).
        5. POLICY ADHERENCE: If a policy was provided above, ensure the Agent's resolution does not violate any policy constraints.
        6. STATUS OPTIONS:
           - "PASS": Requirement was fully met by either party.
           - "PARTIAL": Requirement was partially met but lacks some detail or confirmation.
           - "FAIL": Requirement was completely missed or handled incorrectly.
        
        Return a JSON object where keys are the StepIDs and values are objects with:
        - "status": "PASS", "PARTIAL", or "FAIL"
        - "reason": A concise explanation referencing the specific context/logic and policy if applicable (max 1 sentence).
        - "confidence": A float between 0.0 and 1.0.
        
        JSON OUTPUT ONLY:
        """

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a strict but fair QA judge. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"}
        }

        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=data, timeout=30.0)
                # response.raise_for_status() 
                if response.status_code != 200:
                    print(f"Groq API Error: {response.status_code} - {response.text}")
                    return {}
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                print(f"DEBUG: LLM Evaluation Response: {content}")
                return json.loads(content)
        except Exception as e:
            print(f"Error calling Groq API for evaluation: {e}")
            return {}
    def verify_resolution(self, transcript_text: str) -> dict:
        """
        Asks the LLM to judge if the customer's issue was actually resolved.
        """
        if not self.api_key or "your_groq_api_key" in self.api_key:
            return {"status": "FAIL", "reason": "LLM API Key missing"}

        prompt = f"""
        Analyze the following customer support transcript and determine if the customer's primary issue was RESOLVED.
        
        TRANSCRIPT:
        {transcript_text}
        
        A resolution counts as PASS if:
        - The Agent provided a clear fix, answer, or next step that the customer accepted.
        - The customer confirmed satisfaction (e.g., "Thank you", "That helps").
        - A swap or service was successfully booked.
        
        It is a FAIL if:
        - The call ended abruptly with the customer still confused or angry.
        - The Agent couldn't help and didn't provide a valid escalation path.
        
        Return JSON format:
        {{
            "status": "PASS" or "FAIL",
            "reason": "Clear explanation of why (max 1 sentence)"
        }}
        """

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a quality assurance expert. Analyze call resolution."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"}
        }

        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=data, timeout=15.0)
                if response.status_code != 200:
                    return {"status": "FAIL", "reason": "AI Service error"}
                
                result = response.json()
                return json.loads(result["choices"][0]["message"]["content"])
        except Exception as e:
            print(f"Error in verify_resolution: {e}")
            return {"status": "FAIL", "reason": "Analysis failed"}
