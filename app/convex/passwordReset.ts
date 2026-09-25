import { Email } from "@convex-dev/auth/providers/Email";

import { RESET_CODE_LENGTH, RESET_CODE_MINUTES, renderResetEmail } from "./resetEmail";

/**
 * Emails a numeric code for the Password provider's "reset" flow, sent through Resend.
 * Convex env: AUTH_RESEND_KEY (required), AUTH_EMAIL_FROM (e.g. "QuestVault <no-reply@yourdomain>").
 */
export const PasswordReset = Email({
  id: "password-reset",
  maxAge: RESET_CODE_MINUTES * 60,
  async generateVerificationToken() {
    // Rejection sampling keeps every digit equally likely.
    let code = "";
    const bytes = new Uint8Array(1);
    while (code.length < RESET_CODE_LENGTH) {
      crypto.getRandomValues(bytes);
      if (bytes[0] < 250) code += String(bytes[0] % 10);
    }
    return code;
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.AUTH_RESEND_KEY;
    if (!apiKey) throw new Error("EMAIL_NOT_CONFIGURED");
    const { subject, text, html } = renderResetEmail(token);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM ?? "QuestVault <onboarding@resend.dev>",
        to: [email],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      throw new Error("EMAIL_SEND_FAILED");
    }
  },
});
