// Vercel serverless function — proxies form submissions to Formspree.
// Accepts the env var as either the bare form ID ("xyzabc123") or
// the full endpoint URL ("https://formspree.io/f/xyzabc123").
// Set in Vercel: Settings → Environment Variables → FORMSPREE_ID

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS for safety (only your own domain in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const raw = process.env.FORMSPREE_ID;
  if (!raw) {
    return res.status(500).json({
      error: 'FORMSPREE_ID env var is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  // Normalize: accept either "xyzabc123" or "https://formspree.io/f/xyzabc123"
  const formspreeId = raw.includes('/')
    ? raw.split('/').filter(Boolean).pop()
    : raw.trim();

  if (!formspreeId) {
    return res.status(500).json({ error: 'FORMSPREE_ID appears empty after parsing.' });
  }

  const endpoint = `https://formspree.io/f/${formspreeId}`;

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await r.json().catch(() => ({}));

    if (r.ok) {
      return res.status(200).json({ ok: true, status: r.status });
    } else {
      return res.status(r.status).json({
        error: data?.error || data?.errors?.[0]?.message || `Formspree returned ${r.status}`,
        formspreeId,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
}
