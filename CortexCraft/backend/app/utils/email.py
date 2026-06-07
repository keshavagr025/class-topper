import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(recipient_email: str, otp: str) -> bool:
    """Send an OTP code to a user's email via SMTP or print it to the console as a fallback."""
    host = os.getenv("SMTP_HOST")
    port = os.getenv("SMTP_PORT")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_SENDER", user)

    # Always log the OTP to the console so local development doesn't require setting up SMTP
    print(f"\n==========================================")
    print(f"🔑 [OTP-Service] Generated OTP for {recipient_email}: {otp}")
    print(f"==========================================\n")

    if not host or not port or not user or not password:
        print("⚠️ [OTP-Service] SMTP settings not fully configured in backend/app/.env. Console fallback active.")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = recipient_email
        msg['Subject'] = f"CortexCraft - Your OTP is {otp}"

        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #020617; color: #ffffff; padding: 40px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #0a0f1e; border: 1px solid #1e293b; padding: 30px; border-radius: 16px; color: #ffffff;">
              <h1 style="color: #818cf8; margin-bottom: 20px;">CortexCraft</h1>
              <p style="font-size: 16px; color: #94a3b8;">Use the following One-Time Password to verify your email and sign in/register.</p>
              <div style="font-size: 36px; font-weight: bold; background: rgba(79, 70, 229, 0.15); border: 1px solid rgba(79, 70, 229, 0.3); padding: 15px; border-radius: 12px; margin: 30px 0; color: #818cf8; letter-spacing: 4px;">
                {otp}
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 30px;">This OTP is valid for 5 minutes. If you did not request this, please ignore this email.</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(host, int(port))
        server.starttls()
        server.login(user, password)
        server.sendmail(sender, recipient_email, msg.as_string())
        server.close()
        print(f"📧 [OTP-Service] Sent verification email to {recipient_email}")
        return True
    except Exception as e:
        print(f"❌ [OTP-Service] Error sending email via SMTP: {e}")
        return False
