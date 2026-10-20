const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = (process.env.SMTP_USER || "").trim();
  const rawPass = process.env.SMTP_PASS || "";
  const pass = rawPass.replace(/\s+/g, "").trim();

  if (user && pass) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      pool: true,
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

async function sendVerificationOtpEmail({ toEmail, name, otp }) {
  const mailer = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
        .card { max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 22px; font-weight: 700; color: #f59e0b; margin-bottom: 24px; display: inline-block; }
        h2 { font-size: 20px; margin: 0 0 12px; color: #f8fafc; }
        p { color: #94a3b8; line-height: 1.6; margin: 0 0 20px; }
        .otp-box { background: #0f172a; border: 2px dashed #f59e0b; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; }
        .footer { font-size: 12px; color: #64748b; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">⚡ DevRecall</div>
        <h2>Verify Your Email Address</h2>
        <p>Hi ${name || "Developer"},</p>
        <p>Thank you for signing up on DevRecall. Please use the verification code below to activate your account and start your technical interview preparation:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>. If you did not create a DevRecall account, you can safely ignore this email.</p>
        <div class="footer">DevRecall • Technical Interview Mastery & Continuous Memory Platform</div>
      </div>
    </body>
    </html>
  `;

  if (mailer) {
    try {
      await mailer.sendMail({
        from: `"DevRecall" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Your DevRecall Verification Code: ${otp}`,
        html,
      });
      console.log(`✉️ Verification OTP email sent to ${toEmail}`);
      return { sent: true };
    } catch (err) {
      console.warn("⚠️ SMTP send failed, falling back to console log:", err.message);
    }
  }

  // Fallback / Dev mode: log clearly in server console
  console.log(`\n======================================================`);
  console.log(`📨 [DEVRECALL OTP VERIFICATION]`);
  console.log(`   To:   ${toEmail} (${name})`);
  console.log(`   OTP:  ${otp}`);
  console.log(`   Valid for 10 minutes`);
  console.log(`======================================================\n`);

  return { sent: false, devOtp: otp };
}

module.exports = {
  sendVerificationOtpEmail,
};
