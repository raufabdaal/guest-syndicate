# Guest Syndicate — Landing Page

Boutique landing page for the Guest Syndicate Founding Roster.

## Stack
- Static HTML / CSS / vanilla JS — no build step
- Form submissions: [Formspree](https://formspree.io), proxied through a Vercel serverless function so the form ID lives in an env var
- Hosting: [Vercel](https://vercel.com) (zero-config for static sites + serverless functions)

## File structure
```
guest-syndicate/
├── index.html        # The whole site
├── styles.css        # All styles
├── app.js            # Form handling + scroll effects
├── favicon.svg       # GS monogram
├── vercel.json       # Vercel headers + clean URLs
├── api/
│   └── submit.js     # Serverless function — proxies to Formspree
├── .gitignore
└── README.md         # This file
```

## Local preview
Just open `index.html` in a browser. The form will display a "not configured" warning until you set the env var in Vercel — that's expected.

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo.
3. Framework preset: **Other** (it's a static site + serverless function).
4. **Before clicking Deploy**, add the env var (next step).
5. Click **Deploy**. Done.

## Formspree setup (Vercel env var — your form ID never enters git)
1. Sign up at [formspree.io](https://formspree.io) and create a new form.
2. Copy the form ID (looks like `xyzabc123`).
3. In Vercel → your project → **Settings → Environment Variables**:
   - **Name:** `FORMSPREE_ID`
   - **Value:** your form ID
   - **Environment:** check all (Production, Preview, Development)
4. **Redeploy** (env vars don't apply to already-deployed code — you need a fresh deploy).
5. Submit a test. Check the Formspree dashboard to confirm the email arrived.

## How the form works
- The browser POSTs JSON to `/api/submit`
- `api/submit.js` reads `process.env.FORMSPREE_ID` and forwards to `https://formspree.io/f/${id}`
- Formspree emails you with the submission
- The browser shows a success state and decrements the seats-remaining counter

## Customizing
- **Spots remaining:** edit `<span id="spotsRemaining">7</span>` in `index.html` and the `width: 30%` on `.counter-fill`.
- **Testimonial / proof:** edit the `.proof-card` and `.quote-card` blocks.
- **Room names in the marquee:** edit the `<span>` tags inside `.logo-track`.
- **Final CTA copy:** search for "Seven seats left" in `index.html`.

## Going live checklist
- [ ] Vercel env var `FORMSPREE_ID` is set + you've redeployed
- [ ] Submit a test form, confirm email arrives
- [ ] Update spots-remaining counter to match real cohort status
- [ ] Swap placeholder testimonial quote if you have a real one
- [ ] Add a real domain in Vercel (Project → Settings → Domains)
- [ ] Set up custom email forwarding (hello@guestsyndicate.com → your inbox)
- [ ] Submit your sitemap to Google Search Console
