import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY! });

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: process.env.EMAIL_FROM_NAME ?? "Split the Load",
      email: process.env.EMAIL_FROM!,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });
}
