import os
from pypdf import PdfReader
import re

class PolicyProcessor:
    def __init__(self, storage_dir="policies"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

    def extract_text(self, pdf_path):
        """Extracts all text from a PDF file."""
        try:
            reader = PdfReader(pdf_path)
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
            return full_text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""

    def chunk_text(self, text, max_chars=2000):
        """Chunks text into semantically meaningful blocks (by paragraphs for now)."""
        # Split by double newlines or similar paragraph markers
        paragraphs = re.split(r'\n\s*\n', text)
        
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            if len(current_chunk) + len(para) < max_chars:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return chunks

    def process_policy(self, pdf_path, sop_id):
        """Processes a policy PDF for a specific SOP."""
        raw_text = self.extract_text(pdf_path)
        if not raw_text:
            return None
            
        chunks = self.chunk_text(raw_text)
        
        # Save extracted text and chunks for future use
        # In a real app, this might go to a vector DB or search index
        # For this hackathon, we'll store it in a JSON file associated with the SOP
        policy_data = {
            "sop_id": sop_id,
            "raw_text": raw_text,
            "chunks": chunks
        }
        
        import json
        output_path = os.path.join(self.storage_dir, f"{sop_id}_policy.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(policy_data, f, indent=2)
            
        return policy_data
