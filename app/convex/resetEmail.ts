/**
 * Password-reset email (pure — no Convex imports, so it runs under `node --test`).
 * The auth provider does not know the reader's language, so the email carries both.
 */

export const RESET_CODE_LENGTH = 8;
export const RESET_CODE_MINUTES = 15;

export type ResetEmail = { subject: string; text: string; html: string };

/** Groups the code as "1234 5678" so it reads easily; the app accepts it with or without the space. */
export function formatResetCode(code: string): string {
  return code.length === RESET_CODE_LENGTH ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
}

/** Keeps only digits: pasted codes often carry spaces or dashes. */
export function normalizeResetCode(input: string): string {
  return input.replace(/\D/g, "");
}

export function renderResetEmail(code: string, minutes = RESET_CODE_MINUTES): ResetEmail {
  const shown = formatResetCode(code);
  const subject = `QuestVault: código para redefinir a senha (${shown})`;
  const text = [
    "Olá, Guardião!",
    "",
    `Seu código para redefinir a senha do QuestVault é: ${shown}`,
    `Ele vale por ${minutes} minutos. Se você não pediu, ignore este e-mail — sua senha continua a mesma.`,
    "",
    "—",
    "",
    `Your QuestVault password reset code is: ${shown}`,
    `It expires in ${minutes} minutes. If you didn't ask for it, ignore this email.`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px 12px;background:#13100d;font-family:Georgia,'Times New Roman',serif;color:#efe4cc">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:460px;background:#1f1914;border:2px solid #6b5431;border-radius:6px" cellspacing="0" cellpadding="0">
      <tr><td style="padding:28px 28px 8px;text-align:center">
        <div style="font-size:13px;letter-spacing:3px;color:#c9a45c">QUESTVAULT</div>
        <h1 style="margin:10px 0 0;font-size:22px;font-weight:normal;color:#efe4cc">Redefinir sua senha</h1>
      </td></tr>
      <tr><td style="padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#cbbd9f">
        Use este código no app para criar uma senha nova:
      </td></tr>
      <tr><td align="center" style="padding:8px 28px 16px">
        <div style="display:inline-block;padding:14px 22px;background:#0d0b09;border:1px solid #c9a45c;border-radius:4px;font-family:'Courier New',monospace;font-size:30px;letter-spacing:6px;color:#e8c77f">${shown}</div>
      </td></tr>
      <tr><td style="padding:0 28px 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#9a8b6e">
        O código vale por ${minutes} minutos. Se você não pediu, ignore este e-mail — sua senha continua a mesma.
      </td></tr>
      <tr><td style="padding:14px 28px 24px;border-top:1px solid #3a2e22;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#7d705a">
        Your QuestVault password reset code is <strong style="color:#cbbd9f">${shown}</strong>. It expires in ${minutes} minutes.
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

  return { subject, text, html };
}
