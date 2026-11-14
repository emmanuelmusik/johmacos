// Vercel serverless function: /api/contact
// Sends the Johmacos contact form via Resend. Recipient comes from TO_EMAIL and sender from FROM_EMAIL
// (Vercel env vars); defaults keep it working in Resend sandbox mode.
// Requires the RESEND_API_KEY environment variable to be set in Vercel.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, type, budget, message } = req.body || {};

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'Server not configured' });
    }

    const subject = `New project inquiry: ${type || 'General'} — ${name}`;

    const html = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>New project inquiry from The Johmacos website</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Project type:</strong> ${escapeHtml(type || 'Not specified')}</p>
        <p><strong>Budget:</strong> ${escapeHtml(budget || 'Not specified')}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Use your own verified domain here once set up in Resend,
        // e.g. "Johmacos <hello@johmacos.com>". Until then, this
        // sandbox address works for delivering to your own inbox.
        from: process.env.FROM_EMAIL || 'The Johmacos <onboarding@resend.dev>',
        to: [process.env.TO_EMAIL || 'emmanuelmusik7@gmail.com'],
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', errText);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
