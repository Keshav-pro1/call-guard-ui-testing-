import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'model'))

try:
    from llm_service import SOPConverter
    converter = SOPConverter()
    
    test_phrase = "Welcome to Battery Smart and ask how can I help you"
    print(f"Original: {test_phrase}")
    
    # Note: This will likely print the warning about API key if not set
    intent = converter.convert_to_intent(test_phrase)
    print(f"Intent extracted: {intent}")
    
except Exception as e:
    print(f"Error: {e}")
