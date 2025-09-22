import os
import google.generativeai as genai
from dotenv import load_dotenv
# CHANGE 6: Removed streamlit import from top level

# Load environment variables for local development
load_dotenv()

# CHANGE 10: Updated API key function to handle both local and deployed environments
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

# CHANGE 8: Updated Google AI configuration to use the new function
api_key = get_api_key()
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables or Streamlit secrets")

genai.configure(api_key=api_key)

# Function to call Gemini with user profile data
def get_gemini_response(prompt: str, roles_data: dict) -> str:
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
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(full_prompt)
        return response.text if response and response.text else "⚠️ No response generated."
    except Exception as e:
        return f"⚠️ Error: {str(e)}"