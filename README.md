# Guest Syndicate — Landing Page

Boutique landing page for the Guest Syndicate Founding Roster.

## Stack
- Static HTML / CSS / vanilla JS — no build step
- Form submissions: [Formspree](https://formspree.io), proxied through a Vercel serverless function
- Hosting: [Vercel](https://vercel.com) (zero-config for static sites + serverless functions)

## Design principles
- Each section has its own distinct visual identity (dotted grids, warm tones, paper textures, sage backgrounds)
- Paper tear SVG dividers break the monotony between sections
- Hero fits the viewport on desktop (no scrolling needed to see the full intro)
- Navigation starts as a wide bar, collapses to a slim centered pill on scroll
- Soft warm browns — never aggressive black
- Mobile-first drawer with overlay backdrop

## File structure
```
guest-syndicate/
├── index.html        # The whole site
├── styles.css        # All styles
├── app.js            # Form handling + nav + scroll reveal
├── favicon.svg       # GS monogram
├── vercel.json       # Vercel headers + clean URLs
├── api/
│   └── submit.js     # Serverless function — proxies to Formspree
├── sitemap.xml       # SEO sitemap
├── robots.txt        # Crawler directives
├── .gitignore
└── README.md         # This file
└── AUDIT.md          # Project audit (flows, issues, priorities)
```

## Security features
- **Server-side validation**: Required fields, length caps, email format, HTML/URL detection in names
- **Honeypot field**: Hidden `_gotcha` input — if filled, submission is silently rejected (spam bot detection)
- **Rate limiting**: 5 submissions per IP per hour (in-memory, resets on cold start)
- **No env var leak**: Formspree ID stripped from error responses — never exposed to the client
- **CORS**: Access-Control-Allow-Origin: * (fine for a landing page)
- **Security headers**: X-Content-Type-Options, X-Frame-Options (DENY), Referrer-Policy, Permissions-Policy

## Accessibility features
- Skip-to-content link (visible on keyboard focus)
- ARIA landmarks: `role="banner"`, `role="main"`, `role="contentinfo"`, `aria-label` on all sections
- Focus-visible outlines (warm peach accent color, 3px solid)
- Honeypot field uses `aria-hidden="true"` and `tabindex="-1"`
- `aria-live="polite"` on form status messages
- `aria-describedby` on form field hints
- Focus management: success message receives focus after form submission
- Keyboard navigation: Escape closes mobile drawer, focus returns to toggle button

## SEO features
- `<title>` + `<meta description>` set
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
- Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- `<link rel="canonical">` set
- `sitemap.xml` — submit to Google Search Console
- `robots.txt` — allows all crawlers, points to sitemap

## How the form works
1. The browser POSTs JSON to `/api/submit`
2. `api/submit.js` validates fields, checks honeypot, rate-limits, then forwards to Formspree
3. Formspree emails you with the submission
4. The browser shows a success state and decrements the seats-remaining counter
5. If the roster is full (0 seats), the form is replaced with a waitlist UI

## Roster full behavior
- When `#spotsRemaining` text hits 0, the founding card hides and a "Roster full" card appears
- The apply form is replaced with a message + waitlist input
- In production, the seat count should come from a persistent store (Vercel KV), not hardcoded HTML

## Local preview
Just open `index.html` in a browser. The form will show errors until you set the env var in Vercel — that's expected.

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo.
3. Framework preset: **Other** (it's a static site + serverless function).
4. **Before clicking Deploy**, add the env var:
5. Click **Deploy**. Done.

## Formspree setup (Vercel env var)
1. Sign up at [formspree.io](https://formspree.io) and create a new form.
2. Copy the form ID (looks like `xyzabc123`).
3. In Vercel → your project → **Settings → Environment Variables**:
   - **Name:** `FORMSPREE_ID`
   - **Value:** your form ID
   - **Environment:** check all (Production, Preview, Development)
4. **Redeploy** (env vars don't apply to already-deployed code).

## OG image
The `og:image` tag points to `https://guestsyndicate.com/og-image.png`. You need to create and upload this image (1200x630px recommended). It should be a branded preview card with the tagline "You belong in bigger rooms." — create one with any design tool and place it in the project root.

## Going live checklist
- [x] Vercel env var `FORMSPREE_ID` is set + redeployed
- [x] Submit a test form, confirm email arrives
- [ ] Update spots-remaining counter to match real cohort status
- [x] Swap placeholder testimonial quote → validation section with real data
- [ ] Add a real domain in Vercel (Project → Settings → Domains)
- [ ] Set up custom email forwarding (hello@guestsyndicate.com → your inbox)
- [ ] Create and upload `og-image.png` (1200x630px)
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Add analytics (Vercel Analytics or Plausible)
- [ ] Add Privacy Policy page (required for GDPR/CalOPPA compliance)
- [ ] Add Terms of Service page
