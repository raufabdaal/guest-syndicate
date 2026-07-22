// Vercel serverless function — proxies form submissions to Formspree
// Keeps your Formspree ID in an environment variable, out of git.
//
// To use:
//   1. In Vercel: Project → Settings → Environment Variables
//      Add: FORMSPREE_ID = your_form_id
//   2. In app.js, change the fetch URL to "/api/submit"
//   3. Redeploy
//
// This file is OPTIONAL. If you'd rather hardcode the Formspree ID
// in app.js (Option A in the README), you can delete this file.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const formspreeId = process.env.FORMSPREE_ID;
  if (!formspreeId) {
    return res.status(500).json({ error: 'FORMSPREE_ID env var not set' });
  }

  try {
    const r = await fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await r.json().catch(() => ({}));

    if (r.ok) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(r.status).json({ error: data.error || 'Formspree error' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
