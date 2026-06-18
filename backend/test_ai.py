import requests
import json

url = "http://localhost:8000/ai/recommend?username=Shubham Kumar"
data = {
    "education": "B.Tech",
    "skills": "Python, React",
    "interests": "AI, Web Dev",
    "goal": "Full Stack Developer",
    "prompt": "What should I learn?"
}

try:
    response = requests.post(url, json=data)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", str(e))
