import smtplib
from email.message import EmailMessage

sender = "Private Person <from@example.com>"
receiver = "A Test User <to@example.com>"

msg = EmailMessage()
msg.set_content(f"Your CareerCrafter OTP is: 123456")
msg['Subject'] = 'Verify'
msg['From'] = "noreply@careercrafter.local"
msg['To'] = receiver

print("Testing invalid credentials...")
try:
    with smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525) as server:
        server.set_debuglevel(1)
        server.starttls()
        server.login("your_mailtrap_username", "your_mailtrap_password")
        server.send_message(msg)
        print("Success!")
except Exception as e:
    print(f"Error: {e}")
