// Outbound notifications. Dev stubs log to the console — wire SMTP (email)
// and an SMS provider (Twilio/Orange) here when credentials are available.

export async function sendVerificationEmail(email: string, link: string): Promise<void> {
  console.log(`\n[EMAIL] → ${email}\n  Verify your Soko account: ${link}\n`);
  // TODO: integrate SMTP/nodemailer or a provider like Resend.
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  console.log(`\n[SMS] → ${phone}\n  Your Soko verification code is: ${code}\n`);
  // TODO: integrate Twilio / Orange SMS API.
}
