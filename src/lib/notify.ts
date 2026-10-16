import "server-only";
import { getSetting } from "./settings";

/** Fire configured webhooks for an event. Never throws. */
export async function fireWebhooks(event: string, payload: unknown) {
  try {
    const integrations = await getSetting("integrations");
    const hooks = integrations.webhooks.filter((w) => w.enabled && w.url && (w.event === event || w.event === "*"));
    await Promise.allSettled(
      hooks.map((h) =>
        fetch(h.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Kaaya-Event": event },
          body: JSON.stringify({ event, data: payload, sentAt: new Date().toISOString() }),
          signal: AbortSignal.timeout(5000),
        }),
      ),
    );
  } catch (e) {
    console.error("webhook error", e);
  }
}

/** Send an email using the SMTP settings from the admin panel. No-op when not configured. */
export async function sendMail(opts: { to?: string; subject: string; html: string }) {
  try {
    const i = await getSetting("integrations");
    const to = opts.to || i.notifyEmail;
    if (!i.smtpHost || !to) return false;
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: i.smtpHost,
      port: Number(i.smtpPort) || 587,
      secure: Number(i.smtpPort) === 465,
      auth: i.smtpUser ? { user: i.smtpUser, pass: i.smtpPass } : undefined,
    });
    await transport.sendMail({ from: i.smtpFrom || i.smtpUser, to, subject: opts.subject, html: opts.html });
    return true;
  } catch (e) {
    console.error("mail error", e);
    return false;
  }
}

export async function notifyAll(event: string, subject: string, payload: Record<string, unknown>) {
  const rows = Object.entries(payload)
    .filter(([, v]) => typeof v !== "object")
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#777">${k}</td><td>${String(v)}</td></tr>`)
    .join("");
  await Promise.allSettled([fireWebhooks(event, payload), sendMail({ subject, html: `<h2>${subject}</h2><table>${rows}</table>` })]);
}
