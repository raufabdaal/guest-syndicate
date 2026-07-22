# Guest Syndicate — Landing Page

Boutique landing page for the Guest Syndicate Founding Roster.

## Stack
- Static HTML / CSS / vanilla JS — no build step
- Form submissions: [Formspree](https://formspree.io)
- Hosting: [Vercel](https://vercel.com) (zero-config for static sites)

## File structure
```
guest-syndicate/
├── index.html        # The whole site
├── styles.css        # All styles
├── app.js            # Form handling + scroll effects
├── favicon.svg       # GS monogram
├── vercel.json       # Vercel headers + clean URLs
└── README.md         # This file
```

## Local preview
Just open `index.html` in a browser. No build, no dependencies.

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo.
3. Framework preset: **Other** (it's a static site).
4. Click **Deploy**. Done.

## Formspree setup
You have two options. **Pick one.**

### Option A — Hardcode your Formspree ID (simplest)
1. Sign up at [formspree.io](https://formspree.io) and create a new form.
2. Copy the form ID (looks like `xyzabc123`).
3. Open `app.js` and replace this line at the top:
   ```js
   const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
   ```
   with
   ```js
   const FORMSPREE_ID = 'xyzabc123';
   ```
4. Redeploy. Submissions will email you.

### Option B — Vercel environment variable (keeps the ID out of git)
1. Sign up at formspree.io and create a form. Copy the form ID.
2. In Vercel: **Project → Settings → Environment Variables**.
3. Add a variable:
   - **Name:** `FORMSPREE_ID`
   - **Value:** your form ID
4. Then in `app.js`, replace the top of the file with:
   ```js
   const FORMSPREE_ID = ''; // empty — uses window.FORMSPREE_ID injected at build time
   ```
5. Add this line just before `</head>` in `index.html`:
   ```html
   <script>window.FORMSPREE_ID = "${process.env.FORMSPREE_ID}";</script>
   ```
   (You'd need a build step for that interpolation — see Option C below for a simpler Vercel approach.)

### Option C — Vercel edge injection via a tiny serverless function (no build step)
This is the cleanest "env var" approach for a static site:

1. Add a `api/submit.js` file (already documented below — create it if not present):
   ```js
   export default async function handler(req, res) {
     if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
     const endpoint = `https://formspree.io/f/${process.env.FORMSPREE_ID}`;
     const r = await fetch(endpoint, {
       method: 'POST',
       headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
       body: JSON.stringify(req.body),
     });
     const data = await r.json().catch(() => ({}));
     res.status(r.ok ? 200 : 400).json(data);
   }
   ```
2. In `app.js`, change `handleSubmit` to POST to `/api/submit` instead of Formspree directly.
3. Set `FORMSPREE_ID` in Vercel env vars. Done.

**For now, Option A is the fastest path to a working form.** You can move to C later if you want.

## Customizing
- **Spots remaining:** edit `<span id="spotsRemaining">7</span>` in `index.html` and the `width: 30%` on `.counter-fill`.
- **Testimonial / proof:** edit the `.proof-card` and `.quote-card` blocks.
- **Room names in the marquee:** edit the `<span>` tags inside `.logo-track`.
- **Final CTA copy:** search for "Seven seats left" in `index.html`.

## Going live checklist
- [ ] Replace `FORMSPREE_ID` in `app.js` (or set up env var)
- [ ] Update spots-remaining counter to match real cohort status
- [ ] Swap placeholder testimonial quote if you have a real one
- [ ] Add a real domain in Vercel (Project → Settings → Domains)
- [ ] Set up a custom email forwarding (hello@guestsyndicate.com → your inbox)
- [ ] Submit your sitemap to Google Search Console
