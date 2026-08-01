# HTML Email Template Generator for CareerCrafter

def get_base_template(content_html: str, header_title: str = "CareerCrafter") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{header_title}</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background-color: #0f172a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #e2e8f0;
            -webkit-font-smoothing: antialiased;
        }}
        .wrapper {{
            width: 100%;
            background-color: #0f172a;
            padding: 40px 10px;
        }}
        .container {{
            max-width: 580px;
            margin: 0 auto;
            background: #1e293b;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #334155;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
        }}
        .header {{
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            padding: 32px 24px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }}
        .header p {{
            margin: 6px 0 0 0;
            color: rgba(255, 255, 255, 0.85);
            font-size: 14px;
            font-weight: 500;
        }}
        .content {{
            padding: 36px 32px;
            line-height: 1.6;
        }}
        .otp-box {{
            background: rgba(99, 102, 241, 0.12);
            border: 2px dashed #6366f1;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 28px 0;
        }}
        .otp-code {{
            font-family: 'Courier New', Courier, monospace;
            font-size: 36px;
            font-weight: 800;
            color: #818cf8;
            letter-spacing: 8px;
            margin: 0;
        }}
        .btn {{
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 16px;
            box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
        }}
        .badge {{
            display: inline-block;
            background: #334155;
            color: #94a3b8;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }}
        .footer {{
            background-color: #0f172a;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #334155;
            font-size: 12px;
            color: #64748b;
        }}
        .footer a {{
            color: #818cf8;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>🧭 CareerCrafter</h1>
                <p>AI-Powered Career Guidance & Peer Network</p>
            </div>
            <div class="content">
                {content_html}
            </div>
            <div class="footer">
                <p>Sent with ❤️ by <strong>CareerCrafter AI Platform</strong></p>
                <p>Powered by Google Gemini AI • Empowering Future Careers</p>
                <p style="margin-top: 10px; font-size: 11px;">© 2026 CareerCrafter. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>"""


def get_otp_email_html(otp_code: str, username: str = "User") -> str:
    content = f"""
    <h2 style="color: #f8fafc; margin-top: 0;">Verify Your Account</h2>
    <p>Hi <strong>{username}</strong>,</p>
    <p>Thank you for signing up with <strong>CareerCrafter</strong>! To complete your registration or password update, please use the 6-digit verification code below:</p>
    
    <div class="otp-box">
        <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Your Verification Code</p>
        <div class="otp-code">{otp_code}</div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">Valid for <strong>10 minutes</strong></p>
    </div>
    
    <p style="font-size: 13px; color: #94a3b8;">If you did not request this verification code, please ignore this email.</p>
    """
    return get_base_template(content, "Verify Your CareerCrafter Account")


def get_welcome_email_html(username: str) -> str:
    content = f"""
    <h2 style="color: #f8fafc; margin-top: 0;">Welcome to CareerCrafter, {username}! 🎉</h2>
    <p>We are thrilled to have you join our career development platform!</p>
    
    <p>Here is what you can explore today:</p>
    <ul style="padding-left: 20px; color: #cbd5e1;">
        <li style="margin-bottom: 10px;"><strong>🧭 AI Career Advisor</strong> — Generate personalized AI roadmaps tailored to your career goals.</li>
        <li style="margin-bottom: 10px;"><strong>📄 ATS Resume Reviewer</strong> — Upload your PDF resume for AI critique & ATS score optimization.</li>
        <li style="margin-bottom: 10px;"><strong>🎙️ Real-time Mock Interviews</strong> — Practice hands-free AI voice interviews with webcam feedback.</li>
        <li style="margin-bottom: 10px;"><strong>🤝 Peer Matching</strong> — Connect with like-minded professionals sharing your skills & interests.</li>
    </ul>
    
    <div style="text-align: center; margin-top: 28px;">
        <a href="https://career-crafter-plum.vercel.app/dashboard" class="btn">Explore Your Dashboard &rarr;</a>
    </div>
    """
    return get_base_template(content, f"Welcome to CareerCrafter, {username}!")


def get_peer_connect_email_html(sender_name: str, sender_username: str, target_name: str, linkedin_url: str = None, github_url: str = None) -> str:
    socials_html = ""
    if linkedin_url or github_url:
        socials_html += "<div style='margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid #334155;'>"
        socials_html += "<p style='margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #f8fafc;'>Connect on Social Networks:</p>"
        if linkedin_url:
            socials_html += f"<p style='margin: 4px 0;'><a href='{linkedin_url}' style='color: #38bdf8; text-decoration: none;'>🔗 LinkedIn Profile &rarr;</a></p>"
        if github_url:
            socials_html += f"<p style='margin: 4px 0;'><a href='{github_url}' style='color: #38bdf8; text-decoration: none;'>💻 GitHub Profile &rarr;</a></p>"
        socials_html += "</div>"

    content = f"""
    <h2 style="color: #f8fafc; margin-top: 0;">New Connection Request 🤝</h2>
    <p>Hi <strong>{target_name}</strong>,</p>
    <p><strong>{sender_name}</strong> (<span style="color: #818cf8;">@{sender_username}</span>) wants to connect with you on <strong>CareerCrafter</strong>!</p>
    
    <p>You share matching skills and career ambitions on the platform.</p>
    
    {socials_html}
    
    <div style="text-align: center; margin-top: 24px;">
        <p style="font-size: 13px; color: #94a3b8;">You can connect directly by replying to this email!</p>
    </div>
    """
    return get_base_template(content, f"New Connection Request from {sender_name}")
