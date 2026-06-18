import os
import smtplib
import requests
from email.message import EmailMessage

def send_email(
    to_email: str, 
    subject: str, 
    body_text: str, 
    body_html: str = None, 
    reply_to: str = None, 
    cc_email: str = None
) -> bool:
    # 1. Try sending via Resend API if the API key is configured
    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key:
        print(f"[Email Service] Sending email via Resend API to: {to_email}")
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {resend_api_key.strip()}",
                "Content-Type": "application/json"
            }
            # Resend free tier defaults to onboarding@resend.dev if a custom domain is not verified.
            from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
            
            payload = {
                "from": from_email,
                "to": to_email,
                "subject": subject,
                "text": body_text,
            }
            if body_html:
                payload["html"] = body_html
            if reply_to:
                payload["reply_to"] = reply_to
            if cc_email:
                payload["cc"] = cc_email
                
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code in (200, 201):
                print("[Email Service] Email sent successfully via Resend API.")
                return True
            else:
                print(f"[Email Service] Resend API failed: {response.status_code} - {response.text}")
                # Fall through to SMTP fallback
        except Exception as e:
            print(f"[Email Service] Exception sending via Resend: {e}")
            # Fall through to SMTP fallback
            
    # 2. Fallback to standard SMTP
    print(f"[Email Service] Attempting standard SMTP for: {to_email}")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user)
    
    if not smtp_user or not smtp_pass:
        print(f"[Email Service] SMTP credentials missing. Email send skipped.")
        return True
        
    msg = EmailMessage()
    msg.set_content(body_text)
    if body_html:
        msg.add_alternative(body_html, subtype='html')
        
    msg['Subject'] = subject
    msg['From'] = smtp_from or "noreply@careercrafter.local"
    msg['To'] = to_email
    
    if reply_to:
        msg.add_header('reply-to', reply_to)
    if cc_email:
        msg['Cc'] = cc_email
        
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user.strip(), smtp_pass.strip())
            server.send_message(msg)
        print("[Email Service] Email sent successfully via SMTP.")
        return True
    except Exception as e:
        print(f"[Email Service] Error sending via SMTP: {e}")
        return False
