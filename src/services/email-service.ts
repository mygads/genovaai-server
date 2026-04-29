type EmailPayload = {
  to: string;
  name?: string | null;
  subject: string;
  html: string;
  text: string;
};

export class EmailService {
  private static appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:8090').replace(/\/+$/, '');
  }

  private static sender() {
    return {
      email: process.env.SMTP_FROM_EMAIL || 'noreply@genfity.com',
      name: process.env.SMTP_FROM_NAME || 'Genova AI',
    };
  }

  private static apiKey() {
    return process.env.BREVO_API_KEY || process.env.BREVO_API_KEYS || '';
  }

  static verificationUrl(token: string) {
    return `${this.appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  }

  static resetPasswordUrl(token: string) {
    return `${this.appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  }

  static async send(payload: EmailPayload) {
    const apiKey = this.apiKey();
    if (!apiKey) {
      console.warn('Brevo API key is not configured; email skipped:', payload.subject);
      return;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: this.sender(),
        to: [{ email: payload.to, name: payload.name || undefined }],
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
      }),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => 'Failed to send email');
      throw new Error(`Brevo email failed: ${message}`);
    }
  }

  static async sendVerificationEmail(to: string, name: string | null | undefined, token: string) {
    const url = this.verificationUrl(token);
    const displayName = this.escapeHtml(name || 'there');
    await this.send({
      to,
      name,
      subject: 'Confirm your Genova AI email',
      html: this.layout({
        title: 'Confirm your email',
        intro: `Hi ${displayName}, welcome to Genova AI. Confirm your email to activate your account.`,
        buttonText: 'Confirm email',
        buttonUrl: url,
        note: 'This link is valid for account verification. If you did not create this account, you can ignore this email.',
      }),
      text: `Confirm your Genova AI email: ${url}`,
    });
  }

  static async sendPasswordResetEmail(to: string, name: string | null | undefined, token: string) {
    const url = this.resetPasswordUrl(token);
    const displayName = this.escapeHtml(name || 'there');
    await this.send({
      to,
      name,
      subject: 'Reset your Genova AI password',
      html: this.layout({
        title: 'Reset your password',
        intro: `Hi ${displayName}, we received a request to reset your Genova AI password.`,
        buttonText: 'Reset password',
        buttonUrl: url,
        note: 'This link expires in 1 hour. If you did not request a password reset, you can ignore this email.',
      }),
      text: `Reset your Genova AI password: ${url}`,
    });
  }

  private static escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static layout(input: { title: string; intro: string; buttonText: string; buttonUrl: string; note: string }) {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.title}</title>
  </head>
  <body style="margin:0;background:#f6f7f9;font-family:Inter,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px;text-align:left;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:#111827;margin-bottom:28px;">Genova AI</div>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:700;color:#111827;">${input.title}</h1>
                <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.7;">${input.intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;">
                <a href="${input.buttonUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:10px;">${input.buttonText}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.6;">${input.note}</p>
                <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;word-break:break-all;">${input.buttonUrl}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}
