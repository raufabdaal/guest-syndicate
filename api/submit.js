// Vercel serverless function — proxies form submissions to Formspree.
// Accepts the env var as either the bare form ID ("xyzabc123") or
// the full endpoint URL ("https://formspree.io/f/xyzabc123").
// Set in Vercel: Settings → Environment Variables → FORMSPREE_ID
//
// Security improvements:
// - Server-side validation (required fields, length caps, email format)
// - Honeypot field detection (_gotcha)
// - Rate limiting via simple IP throttle (in-memory, resets on deploy)
// - Strips formspreeId from error responses (no env var leak)

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // max submissions per IP per hour
const rateLimiter = new Map();

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ----- Rate limiting (in-memory, per cold start) -----
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.address
    || 'unknown';

  const now = Date.now();
  const record = rateLimiter.get(ip);

  if (record && now - record.timestamp < RATE_LIMIT_WINDOW) {
    if (record.count >= RATE_LIMIT_MAX) {
      return res.status(429).json({
        error: 'Too many submissions. Please try again later.',
      });
    }
    record.count++;
  } else {
    rateLimiter.set(ip, { timestamp: now, count: 1 });
  }

  // Clean up old entries periodically
  for (const [key, val] of rateLimiter.entries()) {
    if (now - val.timestamp > RATE_LIMIT_WINDOW) {
      rateLimiter.delete(key);
    }
  }

  // ----- Server-side validation -----
  const body = req.body || {};

  // Honeypot: if _gotcha is filled, silently reject (spam bot filled it)
  if (body._gotcha && body._gotcha.trim()) {
    // Return success so the bot thinks it worked — don't tell them
    return res.status(200).json({ ok: true });
  }

  // Required fields
  const required = ['name', 'email', 'business', 'rooms', 'why'];
  for (const field of required) {
    if (!body[field] || !body[field].trim()) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  // Length caps
  const maxLens = { name: 100, email: 120, business: 200, rooms: 500, why: 800 };
  for (const [field, max] of Object.entries(maxLens)) {
    if (body[field] && body[field].length > max) {
      return res.status(400).json({ error: `Field "${field}" exceeds maximum length of ${max} characters.` });
    }
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email.trim())) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // Name: basic sanity (no URLs, no HTML)
  if (/<[^>]+>|https?:\/\//i.test(body.name)) {
    return res.status(400).json({ error: 'Invalid characters in name.' });
  }

  // ----- Formspree proxy -----
  const raw = process.env.FORMSPREE_ID;
  if (!raw) {
    return res.status(500).json({
      error: 'Form not configured yet. Please try again later or contact us directly.',
    });
  }

  const formspreeId = raw.includes('/')
    ? raw.split('/').filter(Boolean).pop()
    : raw.trim();

  if (!formspreeId) {
    return res.status(500).json({
      error: 'Form configuration error. Please contact us directly.',
    });
  }

  // Build clean payload (strip _gotcha, trim all fields)
  const payload = {};
  for (const field of required) {
    payload[field] = body[field].trim();
  }

  const endpoint = `https://formspree.io/f/${formspreeId}`;

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));

    if (r.ok) {
      return res.status(200).json({ ok: true });
    } else {
      // Strip formspreeId from error response — don't leak the env var
      const errorMsg = data?.error || data?.errors?.[0]?.message || `Form service returned error`;
      return res.status(r.status).json({ error: errorMsg });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Unable to submit form. Please try again later.' });
  }
}
