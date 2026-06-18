import os
from dotenv import load_dotenv

load_dotenv("c:/Users/shubh/Desktop/CareerCrafter-main/backend/.env")

from routers.auth import send_otp_email

print("Testing send_otp_email...")
success = send_otp_email("test@example.com", "123456")
print("Success:", success)
