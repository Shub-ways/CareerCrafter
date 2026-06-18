import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables for local development
load_dotenv()

def get_api_key():
    """Get API key from either Streamlit secrets (deployed) or environment variable (local)"""
    try:
        # Try Streamlit secrets first (for deployed app) - import only when needed
        import streamlit as st
        if hasattr(st, 'secrets') and 'GEMINI_API_KEY' in st.secrets:
            return st.secrets['GEMINI_API_KEY']
    except Exception:
        pass
    
    # Fall back to environment variable (for local development)
    return os.getenv('GEMINI_API_KEY')

# Configure Google AI with API key
api_key = get_api_key()
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables or Streamlit secrets")

genai.configure(api_key=api_key)

def get_gemini_response(prompt: str, roles_data: dict) -> str:
    """
    Generate career advice using Gemini AI model.
    
    Args:
        prompt: User's input/question
        roles_data: Dictionary containing user profile data (education, skills, interests, goal)
    
    Returns:
        AI-generated career advice in Markdown format
    """
    try:
        full_prompt = f"""
        You are an AI Career Advisor. Based on the following user profile:

        🎓 Education: {roles_data.get('education', '')}
        🛠 Skills: {roles_data.get('skills', '')}
        💡 Interests: {roles_data.get('interests', '')}
        🏆 Career Goal: {roles_data.get('goal', '')}

        Provide personalized career path recommendations in **Markdown format**.
        Make sure to include these sections:
        1. **Recommended Career Paths** (with explanation)
        2. **Skills to Learn / Improve**
        3. **Learning Resources** (courses, platforms, tools)
        4. **Next Steps / Roadmap**

        Keep it clear, motivational, and beginner-friendly.
        ----
        User Input: {prompt}
        """
        
        # Use gemini-2.5-flash - the latest, fastest, and most cost-effective model
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Configure generation parameters for better responses
        generation_config = {
            "temperature": 0.7,  # Balance between creativity and consistency
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,  # Allow detailed responses
        }
        
        # Generate content with safety settings
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config,
            safety_settings=[
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
            ]
        )
        
        # Check if response was blocked
        if not response or not response.text:
            return "⚠️ No response generated. The content might have been filtered. Please try rephrasing your question."
        
        return response.text
        
    except Exception as e:
        error_msg = str(e)
        
        # Provide helpful error messages
        if "API key" in error_msg or "invalid" in error_msg.lower():
            return "⚠️ Error: Invalid API key. Please check your GEMINI_API_KEY configuration."
        elif "expired" in error_msg.lower():
            return "⚠️ Error: API key has expired. Please generate a new key at https://aistudio.google.com/app/apikey"
        elif "quota" in error_msg.lower():
            return "⚠️ Error: API quota exceeded. Please check your usage at https://aistudio.google.com/app/apikey"
        elif "not found" in error_msg or "404" in error_msg:
            return "⚠️ Error: Model not accessible. Please verify your API key has access to Gemini models."
        elif "safety" in error_msg.lower() or "blocked" in error_msg.lower():
            return "⚠️ The response was blocked due to safety settings. Please try rephrasing your query."
        elif "resource exhausted" in error_msg.lower():
            return "⚠️ Error: Too many requests. Please wait a moment and try again."
        else:
            return f"⚠️ Error: {error_msg}\n\nIf this persists, try:\n1. Regenerating your API key\n2. Checking your internet connection\n3. Verifying API quota limits"

# Optional: Function to test the API connection (for debugging)
def test_connection():
    """Test if the API key and model are working correctly"""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content("Say 'API connection successful!' if you can read this.")
        return True, response.text
    except Exception as e:
        return False, str(e)