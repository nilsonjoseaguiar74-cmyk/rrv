import { VerifyAuthError } from "./verify-auth-error.js";
import { config } from "../config.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function unavailable() {
  return new VerifyAuthError(
    503,
    "O envio de e-mails do Verify ainda nao esta disponivel.",
    "VERIFY_EMAIL_UNAVAILABLE",
  );
}

export function isVerifyEmailDeliveryAvailable() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
    process.env.VERIFY_EMAIL_FROM?.trim()
  );
}

export function isAllowedVerifyInvitationUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (url.protocol === "https:") return true;
  return (
    !config.production &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validateRecipient(to) {
  if (
    typeof to !== "string" ||
    to.length > 320 ||
    /[\r\n]/.test(to) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
  ) {
    throw new VerifyAuthError(
      400,
      "Destinatario invalido.",
      "VERIFY_INVALID_RECIPIENT",
    );
  }

  return to;
}

function getProviderErrorCode(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "unknown";
  }
  for (const field of ["name", "code", "type"]) {
    const value = payload[field];
    if (typeof value === "string" && /^[A-Za-z0-9_.-]{1,80}$/.test(value)) {
      return value;
    }
  }
  return "unknown";
}

async function sendEmail({ to, subject, text, html }) {
  if (!isVerifyEmailDeliveryAvailable()) {
    throw unavailable();
  }

  const apiKey = process.env.RESEND_API_KEY.trim();
  const from = process.env.VERIFY_EMAIL_FROM.trim();

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [validateRecipient(to)],
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      let payload;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      console.error("verify_email_delivery_failed", {
        status: response.status,
        category: response.status === 401 ? "authentication" : "provider_response",
        providerCode: getProviderErrorCode(payload),
      });
      throw unavailable();
    }

    return true;
  } catch {
    // Nunca registrar credenciais, codigos ou respostas sensiveis.
    throw unavailable();
  }
}

function emailLayout(content) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:32px 16px;background:#f1f0e9;font-family:Arial,sans-serif;color:#111416">
<table role="presentation" style="width:100%;max-width:560px;margin:auto;border-collapse:collapse;background:#ffffff">
<tr><td style="padding:32px;border-bottom:1px solid #e5e7e7">
<strong style="font-size:23px;letter-spacing:-1px">RRV.digital</strong>
<span style="color:#64748b"> / Verify</span>
</td></tr>
<tr><td style="padding:36px 32px">
${content}
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #e5e7e7;color:#64748b;font-size:12px">
RRV Verify — A evolução do seu projeto, comprovada.
<br>Se você não reconhece esta solicitação, ignore este e-mail.
</td></tr>
</table>
</body>
</html>`;
}

export async function sendVerifyInvitation({
  to,
  workspaceName,
  invitationUrl,
  expiresAt,
}) {
  const recipient = validateRecipient(to);

  if (typeof invitationUrl !== "string" || !isAllowedVerifyInvitationUrl(invitationUrl)) {
    throw unavailable();
  }

  const title = workspaceName
    ? `Convite para ${workspaceName}`
    : "Convite para RRV Verify";

  const text =
    `${title}\n\n` +
    `Voce recebeu um convite para acessar o RRV Verify.\n` +
    `Acesse: ${invitationUrl}\n` +
    `Informe seu e-mail e confirme o codigo recebido.\n` +
    (expiresAt ? `Convite valido ate: ${expiresAt}\n` : "");

  const html = emailLayout(`
    <h1 style="font-size:28px;margin:0 0 16px">
      ${escapeHtml(title)}
    </h1>
    <p>Você recebeu um convite para acessar seu ambiente RRV Verify.</p>
    <p>Abra o endereço abaixo e informe seu e-mail para receber seu código de acesso.</p>
    <p><a href="${escapeHtml(invitationUrl)}" style="color:#086b8c">
      Acessar RRV Verify
    </a></p>
  `);

  return sendEmail({
    to: recipient,
    subject: "Seu convite — RRV Verify",
    text,
    html,
  });
}

export async function sendVerifyAccessCode({
  to,
  code,
}) {
  const recipient = validateRecipient(to);

  if (!/^\d{6}$/.test(String(code))) {
    throw new VerifyAuthError(
      400,
      "Codigo de acesso invalido.",
      "VERIFY_INVALID_CODE",
    );
  }

  const formattedCode = String(code);

  const text =
    "RRV Verify\n\n" +
    `Seu codigo de acesso: ${formattedCode}\n\n` +
    "Validade: 5 minutos.\n" +
    "Uso unico. Nao compartilhe este codigo.\n\n" +
    "Se voce nao solicitou este acesso, ignore esta mensagem.";

  const html = emailLayout(`
    <p style="font-size:12px;letter-spacing:2px;color:#64748b">
      ACESSO SEGURO
    </p>
    <h1 style="font-size:30px;margin:12px 0">
      Seu código de acesso
    </h1>
    <p>Informe este código para acessar seu painel:</p>
    <div style="padding:24px;background:#101416;color:#9eeaff;text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;margin:24px 0">
      ${escapeHtml(formattedCode)}
    </div>
    <p>Este código expira em <strong>5 minutos</strong> e só pode ser utilizado uma vez.</p>
    <p style="color:#64748b">Não compartilhe este código com ninguém.</p>
  `);

  return sendEmail({
    to: recipient,
    subject: "Seu codigo de acesso — RRV Verify",
    text,
    html,
  });
}
