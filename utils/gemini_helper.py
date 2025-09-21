import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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
