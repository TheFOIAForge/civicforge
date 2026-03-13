import type { MailingAddress } from "@/data/types";

interface LetterParams {
  senderAddress: MailingAddress;
  recipientAddress: MailingAddress;
  recipientTitle: string; // "Senator" or "Representative"
  recipientLastName: string;
  date: string;
  body: string;
}

export function formatLetterHtml(params: LetterParams): string {
  const { senderAddress, recipientAddress, recipientTitle, recipientLastName, date, body } = params;

  // Convert plain text body to HTML paragraphs
  const bodyHtml = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin: 0 0 12pt 0; line-height: 1.5;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  const addr = (a: MailingAddress) =>
    [
      a.name,
      a.address_line1,
      a.address_line2,
      `${a.address_city}, ${a.address_state} ${a.address_zip}`,
    ]
      .filter(Boolean)
      .map((line) => `<div>${line}</div>`)
      .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; margin: 0; padding: 0;">
  <div style="width: 6.5in; margin: 0 auto; padding: 1in 0;">
    <!-- Sender address -->
    <div style="margin-bottom: 24pt; line-height: 1.4;">
      ${addr(senderAddress)}
    </div>

    <!-- Date -->
    <div style="margin-bottom: 24pt;">
      ${date}
    </div>

    <!-- Recipient address -->
    <div style="margin-bottom: 24pt; line-height: 1.4;">
      ${addr(recipientAddress)}
    </div>

    <!-- Salutation -->
    <p style="margin: 0 0 12pt 0;">Dear ${recipientTitle} ${recipientLastName},</p>

    <!-- Body -->
    ${bodyHtml}

    <!-- Closing -->
    <div style="margin-top: 24pt;">
      <p style="margin: 0 0 36pt 0;">Respectfully,</p>
      <p style="margin: 0;">${senderAddress.name}</p>
    </div>
  </div>
</body>
</html>`;
}
