/**
 * Server-side Gmail SMTP mailer for the custom OTP auth flow.
 *
 * SECURITY:
 *   - Credentials come ONLY from process.env (GMAIL_SMTP_USER,
 *     GMAIL_SMTP_APP_PASSWORD). No VITE_ prefix. Never committed.
 *   - Never logs the OTP, the password, or the full message body.
 *   - Only imported by server.ts (Express layer). Never reaches the client bundle.
 */

type SendOtpOptions = {
  to: string;
  otp: string;
  purpose: "signup" | "password_reset";
};

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new EmailDeliveryError(`Missing required server env var: ${name}`);
  }
  return value.trim();
}

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_APP_PASSWORD);
}

function buildBody({ to, otp, purpose }: SendOtpOptions) {
  const isSignup = purpose === "signup";
  const subject = isSignup
    ? "Verify your Suggest Key account"
    : "Reset your Suggest Key password";
  const intro = isSignup
    ? "Welcome to Suggest Key. Please verify your email address to activate your account."
    : "We received a request to reset your Suggest Key password.";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f2f7fd; margin: 0; padding: 32px; color: #252b2f; }
    .container { max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .brand { font-size: 20px; font-weight: 700; color: #116eee; margin-bottom: 24px; }
    h1 { font-size: 20px; margin: 0 0 16px 0; color: #252b2f; }
    p { margin: 0 0 12px 0; line-height: 1.5; font-size: 14px; color: #666e7e; }
    .code-box { background: #f2f7fd; border: 1px solid #d6dee6; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0; }
    .code { font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #116eee; font-family: "SF Mono", Menlo, Consolas, monospace; }
    .footer { margin-top: 24px; font-size: 12px; color: #9aa3b2; }
    .warning { color: #b91c1c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Suggest Key</div>
    <h1>${subject}</h1>
    <p>${intro}</p>
    <div class="code-box">
      <div class="code">${otp}</div>
    </div>
    <p>This code expires in <strong>10 minutes</strong>.</p>
    <p class="warning"><strong>Do not share this code</strong> with anyone. Suggest Key will never ask for it.</p>
    <div class="footer">If you did not request this, you can safely ignore this email.</div>
  </div>
</body>
</html>`;

  const text = `${subject}\n\n${intro}\n\nYour 6-digit code: ${otp}\nThis code expires in 10 minutes.\nDo not share this code with anyone.\n`;

  return { subject, html, text };
}

export async function sendOtpEmail(options: SendOtpOptions): Promise<void> {
  const { to, otp, purpose } = options;
  const { subject, html, text } = buildBody({ to, otp, purpose });

  const user = requireEnv("GMAIL_SMTP_USER");
  const pass = requireEnv("GMAIL_SMTP_APP_PASSWORD");

  // Lazy import so the mailer can be unit-tested without a live SMTP server.
  const nodemailer = await import("nodemailer");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Suggest Key" <${user}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    // Never include the password, the OTP, or the full body in logs.
    console.error("[email] sendOtpEmail failed", {
      toDomain: to.split("@")[1],
      purpose,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new EmailDeliveryError("Failed to send email. Please try again later.");
  }
}