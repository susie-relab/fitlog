// Serverless route that emails form submissions to the developer.
// The destination address lives ONLY in a server env var (CONTACT_EMAIL),
// so it is never exposed to the client/user.

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  const from = process.env.RESEND_FROM || 'SportLog <onboarding@resend.dev>';

  if (!apiKey || !to) {
    return Response.json({ error: 'Email is not configured on the server yet.' }, { status: 503 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const kind = body.kind === 'access_request' ? 'access_request' : 'feedback';

  let subject: string;
  let rows: [string, string][];

  if (kind === 'access_request') {
    if (!body.email?.trim()) return Response.json({ error: 'Email is required.' }, { status: 400 });
    subject = `SportLog access request — ${body.firstName || ''} ${body.lastName || ''}`.trim();
    rows = [
      ['Email', body.email],
      ['First name', body.firstName],
      ['Last name', body.lastName],
      ['Referred by', body.referral],
      ['Sports / activities', body.sports],
      ['Reason for wanting an account', body.reason],
    ];
  } else {
    if (!body.message?.trim()) return Response.json({ error: 'Please enter a message.' }, { status: 400 });
    subject = `SportLog ${body.category || 'feedback'} — ${(body.message || '').slice(0, 40)}`;
    rows = [
      ['Type', body.category],
      ['From', body.fromEmail],
      ['Message', body.message],
    ];
  }

  const html = `
    <h2>${esc(subject)}</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows
        .filter(([, v]) => v && String(v).trim())
        .map(([k, v]) => `<tr><td style="vertical-align:top;color:#666"><strong>${esc(k)}</strong></td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`)
        .join('')}
    </table>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(body.email || body.fromEmail ? { reply_to: body.email || body.fromEmail } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return Response.json({ error: 'Could not send. Please try again later.', detail }, { status: 502 });
  }

  return Response.json({ ok: true });
}
