import os
import google.generativeai as genai
import json

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

full_prompt = """
You are an AI Career Advisor. Based on the following user profile:

🎓 Education: B.Tech
🛠 Skills: Python, React
💡 Interests: AI, Web Dev
🏆 Career Goal: Full Stack Developer

Provide personalized career path recommendations and course resources.
You MUST return your response as a valid JSON object with EXACTLY two keys: "roadmap" and "resources".
Do NOT wrap the JSON in markdown code blocks. Just return the raw JSON object.

1. "roadmap": A string containing the career path recommendations in **Markdown format**. Include Recommended Career Paths, Skills to Learn, and Next Steps.
2. "resources": An array of objects. Each object should represent a specific course or resource to help the user achieve their goal. Each object MUST have:
   - "title": (string) Title of the course or resource
   - "platform": (string) e.g., Udemy, Coursera, YouTube, Official Docs
   - "description": (string) Brief 1-sentence description of why it helps
   - "url": (string) A direct URL to the course or a search URL (e.g., https://www.youtube.com/results?search_query=skill+tutorial)

----
User Input: What should I learn?
"""

model = genai.GenerativeModel("gemini-2.5-flash")
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 2048,
    "response_mime_type": "application/json",
}

response = model.generate_content(
    full_prompt,
    generation_config=generation_config
)

print("RAW TEXT START")
print(response.text)
print("RAW TEXT END")

try:
    data = json.loads(response.text)
    print("SUCCESS")
except Exception as e:
    print("JSON Error:", str(e))
