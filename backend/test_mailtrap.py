import smtplib
from email.message import EmailMessage

sender = "Private Person <from@example.com>"
receiver = "A Test User <to@example.com>"

msg = EmailMessage()
msg.set_content(f"Your CareerCrafter OTP is: 123456\nIt is valid for 10 minutes.")
msg['Subject'] = 'Verify your CareerCrafter account'
msg['From'] = "noreply@careercrafter.local"
msg['To'] = receiver

print("Attempting to connect to Mailtrap...")
try:
    with smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525) as server:
        server.set_debuglevel(1)
        print("Starting TLS...")
        server.starttls()
        print("Logging in...")
        server.login("17bb868cbe5336", "6691a14d39e37b")
        print("Sending message...")
        server.send_message(msg)
        print("Success!")
except Exception as e:
    print(f"Error: {e}")
