# Guest Syndicate — Project Audit

**Date:** July 23, 2026  
**Repo:** `raufabdaal/guest-syndicate`  
**Current commit:** `2fafddc` — "some more mess"  
**Total commits:** 8 (master branch only)

---

## 1. Project Overview

Guest Syndicate is a **boutique landing page** for a podcast/room representation service. It's a static HTML/CSS/vanilla JS site deployed on Vercel with a single serverless function for form handling (proxied through Formspree).

**Core pitch:** A $199/mo concierge service that places high-leverage operators on top podcasts and into exclusive rooms — hand-crafted outreach, no bots, 10-seat founding cohort.

**Stack:**
- Static HTML / CSS / vanilla JS — no build step, no framework
- Form submissions: Formspree, proxied through a Vercel serverless function
- Hosting: Vercel (zero-config for static sites + serverless functions)
- Fonts: Fraunces (serif) + Inter (sans) via Google Fonts

---

## 2. Where You Left Off — Commit History Analysis

| # | Commit | Message | What changed | State |
|---|--------|---------|-------------|-------|
| 1 | `a77148a` | **Initial launch** | Full site shipped: 473-line HTML, 1260-line CSS, 151-line JS, Formspree serverless fn, README | ✅ Working baseline |
| 2 | `7ffb919` | formspree | 1-line JS fix (endpoint URL) | 🔧 Minor fix |
| 3 | `19a665c` | form again | 1-line JS fix | 🔧 Minor fix |
| 4 | `1ae6f52` | form again | README rewrite (env var docs), JS refactor (removed inline Formspree ID → serverless proxy), HTML trimmed Formspree data-attr | 🔧 Major refactor — moved secret out of git |
| 5 | `6a194ba` | again form | Serverless fn rewrite (35 insertions, 17 deletions) — added CORS, env var normalization, better error handling | 🔧 Solid improvement |
| 6 | `e7452a9` | pizzazz | **Big visual redesign:** HTML restructured (proof section → manifesto + in-progress), "Greenroom" → "How it works" with 4 steps, added vision comparison, who-it's-for section. CSS 833 changes. JS refactored (removed inline Formspree, added nav drawer, mobile toggle) | 🎨 Major pivot in copy & design |
| 7 | `27e654a` | mobile mess | CSS 522 changes — mobile responsive breakpoints, nav redesign (nav-bar → glass pill), many spacing/typography tweaks. HTML: added mobile drawer, eyebrow, reassigned floating cards | 📱 Mobile work in progress |
| 8 | `2fafddc` | **some more mess** | Final polish: nav-bar → nav-pill, btn-primary → btn-ghost for nav CTA, comma → interpunct (·) in card meta, $5,000/mo → $5,000/month, FAQ dotted grid bg removed, spacing/padding bumps, CSS version comment reverted from "v3" to "v2" | 🧹 Last cosmetic pass |

### Key takeaway from history:
The commit messages (`"mobile mess"`, `"some more mess"`) signal **unfinished, in-progress work** — you were iterating fast and hadn't settled on a final state. The project is functional but clearly mid-evolution, not finalized.

---

## 3. Flows That Exist & Need Work

### 3A. ❌ **Form Submission Flow** — PARTIALLY COMPLETE

**Current state:**
- Frontend JS collects 5 fields (name, email, business, rooms, why) and POSTs JSON to `/api/submit`
- Serverless fn proxies to Formspree via env var
- On success: form hides, success message appears, counter decrements
- On error: inline error message shown

**Issues / gaps:**

| Issue | Severity | Details |
|-------|----------|---------|
| **No spam protection** | 🔴 High | No honeypot field, no CAPTCHA, no rate limiting. The initial commit had `_gotcha` comment but it was never implemented. Anyone can spam the endpoint. |
| **No input validation beyond HTML5 `required`** | 🔴 High | No server-side validation in `api/submit.js`. It blindly forwards whatever it receives to Formspree. Malformed or malicious payloads pass through. |
| **Counter decrement is client-side only** | 🟡 Medium | `decrementCounter()` just edits DOM text — it doesn't persist anywhere. If two people submit, neither sees the other's decrement. The real count must be manually edited in HTML. |
| **No double-submit protection** | 🟡 Medium | `submitBtn.disabled = true` on click, but if the page reloads or the user revisits, they can submit again. No cookie, no session check. |
| **CORS allows `*`** | 🟡 Medium | `Access-Control-Allow-Origin: *` in serverless fn — fine for a landing page, but if the API grows, this is too permissive. |
| **No email verification / confirmation flow** | 🟠 Low | Submitter gets no confirmation email. They just see a success message. No "check your inbox" step. |
| **Formspree ID leaks in error response** | 🟡 Medium | On Formspree error, the fn returns `{ formspreeId }` in the JSON — this exposes the env var to the client. Should be stripped. |

**Needed flows:**
1. Server-side validation (sanitization, field length caps, email format check)
2. Honeypot field or rate limiter (even simple — max 3 submissions per IP per hour)
3. Counter persistence (either a simple DB/KV or at least a Formspree webhook that triggers an update)
4. Strip `formspreeId` from error responses
5. Confirmation email to applicant (either via Formspree or a separate email fn)

---

### 3B. ❌ **Seat Counter / Cohort Management Flow** — NOT IMPLEMENTED

**Current state:**
- Hard-coded `<span id="spotsRemaining">9</span>` in HTML
- Hard-coded `style="width: 10%;"` on counter fill bar
- Client-side `decrementCounter()` that only changes the DOM for the current session
- Counter note says "1 onboarded · 9 seats remaining"

**Issues / gaps:**

| Issue | Severity | Details |
|-------|----------|---------|
| **Counter is a lie after the first visitor submits** | 🔴 High | Only the person who just submitted sees 9 → 8. Everyone else still sees 9. It's a static number. |
| **No backend for tracking actual roster fills** | 🔴 High | There's no database, no KV store, no webhook. You must manually edit the HTML and redeploy to update the real count. |
| **Counter-fill width is a hard-coded inline style** | 🟡 Medium | `style="width: 10%;"` — not computed from the number. If you change `spotsRemaining`, you must also manually change this inline style. |
| **No "cohort full" state** | 🔴 High | When seats = 0, there's no UI state to close the form, disable the button, or show "Roster is full." The form still accepts submissions. |

**Needed flows:**
1. A real data source for spots (even a Vercel KV / JSON file that gets updated on submit)
2. Auto-computed fill bar width from the real count
3. A "Roster full" state: form disabled, counter shows 0/10, CTA changes to "Roster is closed"
4. Admin flow to manually adjust the count (even a simple `/api/admin` endpoint with auth)

---

### 3C. ❌ **Mobile / Responsive Flow** — IN PROGRESS ("mobile mess")

**Current state:**
- Nav has a mobile toggle button + drawer
- Drawer opens/closes with JS
- CSS has 16 `@media` breakpoints across various sizes (900px, 860px, 520px, 480px, 700px)
- Commit messages call this work "mobile mess"

**Issues / gaps:**

| Issue | Severity | Details |
|-------|----------|---------|
| **9 HTML classes have NO CSS rules** | 🔴 High | `.hero-copy`, `.founding-left`, `.founding-right`, `.apply-side`, `.who-copy`, `.who-visual`, `.footer-left`, `.footer-meta`, `.logo--footer` — all used in HTML but have zero CSS selectors. These elements get no styling at all. |
| **Inconsistent breakpoint values** | 🟡 Medium | Breakpoints jump between 900px, 860px, 520px, 480px, 700px with no clear system. Some sections break at 860, others at 900, others at 700. This creates jagged responsive behavior. |
| **No hamburger animation** | 🟠 Low | The toggle button is 3 `<span>` elements but has no open/close animation in CSS. It toggles `.open` but the spans don't morph into an X. |
| **Drawer has no overlay or backdrop** | 🟡 Medium | Mobile drawer opens but there's no dark overlay behind it. User can still interact with page content behind the drawer. |
| **No smooth-scroll to sections on mobile nav click** | 🟠 Low | Drawer links close the drawer but `scroll-behavior: smooth` may not work well on all mobile browsers without `scrollIntoView` calls. |
| **Hero floating cards may overflow on small screens** | 🟡 Medium | `.hero-art` has fixed heights (380px at 860px, implied 300px-ish on mobile) but `.floating-card` widths are 230px/210px — on a 320px screen, these cards will overflow. |
| **No landscape mode handling** | 🟠 Low | No `orientation: landscape` rules. On phones in landscape, the hero section will look squished. |

**Needed flows:**
1. Add CSS for all 9 missing classes (these are structural — likely layout grid children)
2. Standardize breakpoints (pick 2-3: e.g. 860px tablet, 480px phone)
3. Add hamburger → X animation CSS
4. Add drawer backdrop overlay
5. Test on actual 320px, 375px, 414px, 768px viewports
6. Handle "cohort full" state on mobile (form disabled, CTA change)

---

### 3D. ❌ **Navigation Scroll Flow** — INCONSISTENT

**Current state:**
- Nav starts transparent, gains `.scrolled` class on scroll (JS toggles this)
- BUT: `.scrolled` class is defined in CSS but only used for background blur
- The CSS comment says "collapses to floating glass pill on scroll" but there's no visual collapse animation — it just changes background opacity
- Initial commit had inline style change (`nav.style.background = ...`) that was replaced by class toggle in commit `e7452a9`

**Issues / gaps:**

| Issue | Severity | Details |
|-------|----------|---------|
| **No actual "pill collapse" animation** | 🟡 Medium | Comment says it collapses but visually it just gets a slightly more opaque background. No width change, no CTA fade-in, no logo shrink. |
| **No `scrolled` visual difference is noticeable** | 🟠 Low | The change from `rgba(251,247,242,0.7)` to `rgba(251,247,242,0.85)` is barely perceptible on the warm background. |
| **Nav has no sticky behavior explicitly set** | 🟠 Low | It works because it's `position: fixed` but there's no `top: 0` or `z-index` guarantee in the CSS (relies on default stacking). |

**Needed flows:**
1. Decide what "scroll collapse" actually means: width narrows? Links hide? Logo shrinks? CTA appears?
2. Add a real visual transition (e.g., wide bar → centered pill with just logo + CTA)
3. Add `top: 0` and explicit `z-index: 100` to `.nav`

---

### 3E. ❌ **Scroll Reveal / Animation Flow** — PARTIAL

**Current state:**
- IntersectionObserver fades in elements (opacity 0 → 1, translateY 20px → 0)
- Applies to: `.promise-card, .step, .perk, .faq-item, .assurance-item, .greenroom-card, .manifesto-list li, .who-stat`
- Elements start invisible (opacity: 0, transform: translateY(20px))

**Issues / gaps:**

| Issue | Severity | Details |
|-------|----------|---------|
| **`.promise-card` selector is stale** | 🔴 High | The proof section was renamed to "manifesto" + "in-progress" in commit `e7452a9`. `.promise-card` no longer exists in HTML. This selector is dead code. |
| **`.greenroom-card` selector is stale** | 🔴 High | Greenroom section was renamed to "how" with `.step` cards. `.greenroom-card` no longer exists. Dead selector. |
| **Observer only fires once (no reset)** | 🟠 Low | Once an element is revealed, it stays visible. If user scrolls up then down, it won't re-animate. This is probably fine, but worth noting. |
| **No stagger/delay between sibling reveals** | 🟠 Low | All elements in a section appear simultaneously. A staggered reveal (e.g., steps appearing one after another) would feel more polished. |
| **`in-progress` section elements not observed** | 🟡 Medium | The `.status-card` and `.status-row` elements inside `in-progress` have no scroll reveal. |
| **`.founding-card` elements not observed** | 🟡 Medium | Perks in the founding roster have `.perk` which is observed, but the counter and founding-top are not. |

**Needed flows:**
1. Remove stale selectors (`.promise-card`, `.greenroom-card`)
2. Add `.in-progress-card`, `.status-card` to the observer
3. Add stagger delays (CSS `transition-delay` or JS timing)
4. Consider adding `.hero-copy` reveal on load (not just scroll)

---

### 3F. ❌ **SEO / Meta Flow** — BASIC, INCOMPLETE

**Current state:**
- `<title>` and `<meta description>` are set
- No Open Graph tags
- No Twitter Card tags
- No `<link rel="canonical">`
- No structured data (JSON-LD)
- No sitemap.xml
- No robots.txt

**Issues / gaps:**

| Issue | Severity | Details |
|-------|----------|---------|
| **No OG/Twitter cards** | 🟡 Medium | If anyone shares the link on Twitter, LinkedIn, or Slack, it'll show a bare URL with no preview image, title, or description. |
| **No canonical URL** | 🟠 Low | Without this, Vercel's default deployments could create duplicate URLs. |
| **No favicon for non-SVG browsers** | 🟠 Low | Only `favicon.svg` — older browsers and some social scrapers need a `.ico` fallback. |
| **README mentions sitemap but none exists** | 🟡 Medium | The "Going live checklist" says "Submit your sitemap to Google Search Console" but there's no `sitemap.xml` file. |
| **No robots.txt** | 🟠 Low | Vercel serves a default one, but you can't customize it without creating the file. |

**Needed flows:**
1. Add OG tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
2. Add Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
3. Create `sitemap.xml`
4. Create `robots.txt`
5. Add `<link rel="canonical">`
6. Add a fallback `.ico` favicon
7. Consider JSON-LD for `Organization` schema

---

### 3G. ❌ **Accessibility Flow** — MINIMAL

**Current state:**
- `aria-hidden="true"` on decorative elements (blobs, paper texture, hero art)
- `aria-label` and `aria-expanded` on nav toggle
- `aria-live="polite"` on form status
- `<details>` elements for FAQ (native accessible accordion)

**Issues / gaps:**

| Issue | Severity | Details |
|-------|----------|---------|
| **No skip-to-content link** | 🔴 High | Keyboard users must tab through nav links before reaching main content. |
| **No `role="main"` or landmark regions** | 🟡 Medium | Sections have no ARIA landmarks (`role="main"`, `role="complementary"`, etc.). |
| **Color contrast may fail WCAG** | 🟡 Medium | `.muted` text (`--ink-light: #B5A99A`) on `--bg: #FBF7F2` is likely below 4.5:1 ratio. Need to verify. |
| **No focus-visible styles** | 🟡 Medium | There are no custom `:focus-visible` outlines. Keyboard users get browser defaults which may be invisible on this warm palette. |
| **Form has no `aria-describedby`** | 🟠 Low | Field labels have `<span class="muted">` hints but these aren't associated with inputs via ARIA. |
| **FAQ `<details>` all start with one `open`** | 🟠 Low | The first FAQ item has `open` attribute — this is fine, but consider letting JS manage this for better UX. |
| **Success state has no focus management** | 🟡 Medium | When form hides and success appears, focus isn't moved to the success message. Screen reader users may not know what happened. |

**Needed flows:**
1. Add skip-to-content link
2. Add ARIA landmarks
3. Check and fix color contrast ratios
4. Add `:focus-visible` styles
5. Move focus to success message on form completion
6. Add `aria-describedby` for form field hints

---

### 3H. ❌ **Analytics / Tracking Flow** — NOT EXISTS

**Current state:**
- No analytics at all (no Google Analytics, no Plausible, no Vercel Analytics)
- No conversion tracking
- No scroll depth tracking

**Needed flows:**
1. Add Vercel Analytics (zero-config for static sites) or Plausible (privacy-first)
2. Track form submissions as conversion events
3. Track scroll depth to see which sections people actually read
4. Track nav link clicks
5. Track CTA button clicks (hero + final)

---

### 3I. ❌ **Legal / Privacy Flow** — MINIMAL

**Current state:**
- One line: "By applying, you agree to be contacted by the Guest Syndicate team. We don't share your information with anyone."
- No Privacy Policy page
- No Terms of Service page
- No cookie consent (not needed yet since no cookies/analytics)

**Needed flows (when you go live):**
1. Privacy Policy page (required by GDPR, CalOPPA, etc. if you collect personal data)
2. Terms of Service page
3. Cookie consent banner (once analytics are added)
4. Data retention policy (how long do you keep Formspree submissions?)

---

### 3J. ❌ **Post-Submission / Applicant Pipeline Flow** — NOT EXISTS

**Current state:**
- Form → Formspree → email to you
- That's it. No CRM, no tracking, no pipeline.

**Needed flows:**
1. Applicant received → review → accept/reject → follow-up email
2. Accept → onboard → collect payment ($199/mo) → Stripe or manual
3. Reject → polite decline email (you promise 72-hour response)
4. Payment flow (Stripe checkout link, subscription setup)
5. Member portal / dashboard (even a simple Notion page or email thread)
6. Retention tracking (who stays, who cancels, churn rate)

---

### 3K. ❌ **Content / Copy Flow** — NEEDS FINALIZATION

**Current state:**
- Copy evolved significantly across commits (v1 "proof of work" → v2 "manifesto + validation in progress")
- Hero changed from "10 seats total, <30m avg reply" → "9 seats remaining, 100% human no bots"
- "Greenroom Experience" → "How it works" with 4 steps
- Named pilot client (Lindsay Gonzales) was removed from proof section → anonymized in validation section
- Several copy inconsistencies remain:

| Issue | Severity | Details |
|-------|----------|---------|
| **"9 seats remaining" vs "10 seats total"** | 🟡 Medium | Hero says "9 seats remaining", founding section says "9 seats left / 10", but the eyebrow says "Now accepting 9 Founding Members" — if there are 9 *remaining* and 10 *total*, then 1 is onboarded. The eyebrow should say "Now accepting Founding Members" (not "9") since 9 is the remaining count, not the total being accepted. |
| **Inconsistent roster numbers** | 🟡 Medium | Who-section stat says "10 seats in cohort" and "1 onboarded" — these are correct. But the hero eyebrow says "9 Founding Members" which reads as "we're accepting 9 people total" rather than "9 remaining of 10." |
| **"four questions" but form has 5 fields** | 🟡 Medium | Apply section heading says "Four questions. That is the whole filter." but the form has 5 fields (name, email, business, rooms, why). Name and email aren't "questions" per the copy framing, but the count feels off. |
| **Copy tone shifts between sections** | 🟠 Low | Some sections are very direct/assertive ("You belong in bigger rooms"), others are cautious/humble ("Validation in progress"). This is intentional (early-stage honesty) but may confuse visitors about confidence level. |
| **Placeholder podcast names** | 🟠 Low | Logo marquee lists "Smart Agency Masterclass, The Operators Room, Founders & Funders, Capital Council, The Studio Cut, Margin Notes, Quiet Capital" — are these real? If they're aspirational, they should be framed differently. If real, they need links. |

---

### 3L. ❌ **Performance Flow** — CAN IMPROVE

**Current state:**
- Google Fonts loaded with `display=swap` ✅
- CSS and JS have `Cache-Control: immutable` headers ✅
- No images (all CSS/SVG decorative) ✅
- 1425-line CSS, 141-line JS — reasonable for a landing page
- `vercel.json` has security headers ✅

**Issues / gaps:**

| Issue | Severity | Details |
|-------|----------|---------|
| **Google Fonts are 2 external requests** | 🟠 Low | Fraunces + Inter = 2 DNS lookups + 2 CSS fetches + multiple font file downloads. Could self-host for faster load. |
| **No preload for critical fonts** | 🟠 Low | No `<link rel="preload">` for the most-used font weights. |
| **CSS has dead selectors** | 🟡 Medium | Stale `.promise-card`, `.greenroom-card`, `.nav-bar` selectors in CSS still exist from removed sections. Also `form-status--warn` class defined but no element uses it. |
| **No minification** | 🟠 Low | HTML, CSS, JS are all unminified. Vercel doesn't auto-minify static assets. For a production landing page, this adds ~30-40% overhead. |
| **`will-change: transform` on blobs** | 🟠 Low | Three blobs have `will-change: transform` which is good for animation but creates compositing layers that persist forever. Should be scoped to animation duration only. |

---

## 4. Missing CSS Classes — Full Detail

These 9 classes are used in `index.html` but have **zero corresponding CSS rules** in `styles.css`. This means these elements receive no styling at all:

| Class | Element | Expected role | Status |
|-------|---------|---------------|--------|
| `.hero-copy` | Hero text column | Grid child, likely `flex-direction: column` | ❌ No CSS |
| `.founding-left` | Roster left copy | Grid child | ❌ No CSS |
| `.founding-right` | Roster right counter | Grid child | ❌ No CSS |
| `.apply-side` | Apply section left copy | Grid child | ❌ No CSS |
| `.who-copy` | Who section text | Grid child | ❌ No CSS |
| `.who-visual` | Who section stats | Grid child | ❌ No CSS |
| `.footer-left` | Footer brand column | Grid child | ❌ No CSS |
| `.footer-meta` | Footer copyright | Grid child | ❌ No CSS |
| `.logo--footer` | Footer logo variant | Might need smaller/different style | ❌ No CSS |

This is likely a result of the CSS rewrite in commits `27e654a` and `2fafddc` where class names changed (`nav-bar` → `nav-pill`) but these structural grid classes never got their CSS written. The site likely looks broken or unstructured in places where these grid children should be defining layout.

---

## 5. Dead Code & Stale References

| Item | Location | Issue |
|------|----------|-------|
| `.promise-card` | `app.js` line ~119 (scroll reveal selector) | Class removed from HTML in commit `e7452a9`. Selector matches nothing. |
| `.greenroom-card` | `app.js` line ~119 (scroll reveal selector) | Class removed from HTML. Section renamed to `.how` with `.step` cards. |
| `.nav-bar` | `styles.css` (from previous commit) | Renamed to `.nav-pill` but old selectors may still exist in CSS. |
| `form-status--warn` | `styles.css` | Class defined but never applied in HTML or JS (the warning path was removed when Formspree proxy was added). |
| `window.FORMSPREE_ID` | Old JS (removed) | The initial commit had a fallback for `window.FORMSPREE_ID` — this was stripped but the CSS class for the warning state remains. |
| `_gotcha` honeypot | `app.js` comment (removed) | The initial commit mentioned a honeypot convention but it was never implemented and the comment was removed. |
| `.logo-mark` + `.logo-dot` | Initial HTML (removed) | The "GS" monogram was replaced with just text, but if any CSS rules existed for these, they're dead. |

---

## 6. Priority Matrix — What to Fix First

### 🔴 Critical (blocks going live or causes major UX failure)
1. **Add CSS for the 9 missing classes** — the site layout is likely broken without these
2. **Remove stale selectors from JS** (`.promise-card`, `.greenroom-card`) — scroll reveal silently fails
3. **Server-side form validation** — currently anything gets forwarded to Formspree
4. **Seat counter persistence** — the "9 remaining" is a static lie after first submit
5. **"Roster full" state** — no UI for when seats = 0

### 🟡 Important (degrades experience or trust)
6. **Standardize responsive breakpoints** — jagged behavior across screen sizes
7. **Add drawer backdrop overlay** — mobile UX issue
8. **Strip `formspreeId` from error response** — security leak
9. **Add OG/Twitter meta tags** — social sharing looks bare
10. **Add accessibility landmarks + skip link + focus management**
11. **Clean dead CSS selectors** — reduces file size and confusion
12. **Fix copy inconsistency** ("Four questions" vs 5 fields, "9 Founding Members" eyebrow)

### 🟠 Nice-to-have (polish)
13. **Hamburger → X animation**
14. **Staggered scroll reveal delays**
15. **Nav scroll collapse animation (actual visual change)**
16. **Self-host fonts or add preload**
17. **Minify HTML/CSS/JS for production**
18. **Add analytics (Vercel Analytics or Plausible)**
19. **Add `sitemap.xml` + `robots.txt`**
20. **Create Privacy Policy + Terms pages**

---

## 7. Flows to Build (New)

These flows don't exist at all yet and need to be designed/implemented:

| Flow | Description | Complexity |
|------|-------------|------------|
| **Applicant pipeline** | Form → review → accept/reject → email → payment | Medium (Stripe + email service) |
| **Payment/subscription** | $199/mo recurring, locked rate | Medium (Stripe Billing) |
| **Member dashboard** | Even a simple portal to see placements, status | High (needs auth, DB) |
| **Admin count management** | Update seats remaining without redeploying | Low (KV store + admin endpoint) |
| **Confirmation email** | Auto-email to applicant on submit | Low (Vercel fn + email API) |
| **Analytics setup** | Track conversions, scroll depth, clicks | Low (Vercel Analytics) |
| **Social preview image** | OG image for Twitter/LinkedIn sharing | Low (static image) |

---

## 8. Going Live Checklist (from README — status update)

| Item | Status |
|------|--------|
| Vercel env var `FORMSPREE_ID` set + redeployed | ⬜ Unknown (needs verification) |
| Submit test form, confirm email arrives | ⬜ Needs testing |
| Update spots-remaining counter to match real cohort status | ⬜ Manual HTML edit needed |
| Swap placeholder testimonial quote if you have a real one | ✅ Done (validation section replaces testimonials) |
| Add a real domain in Vercel | ⬜ Needs setup |
| Set up custom email forwarding | ⬜ Needs setup |
| Submit sitemap to Google Search Console | ⬜ `sitemap.xml` doesn't exist yet |

---

*Audit complete. The project is a solid landing page foundation with a clear product story, but it's mid-evolution — the "mess" commits show you're still iterating on design and mobile responsiveness.*

---

## Progress Tracker — What's Been Fixed

### ✅ Completed (this session)
| Item | Status |
|------|--------|
| 9 missing CSS classes (`.hero-copy`, `.founding-left`, etc.) | ✅ Fixed — all have CSS rules |
| Stale JS selectors (`.promise-card`, `.greenroom-card`) | ✅ Removed, replaced with current selectors |
| Nav: wide bar → slim pill on scroll | ✅ Smooth transition with `cubic-bezier(0.4, 0, 0.2, 1)` |
| Hero eyebrow removed | ✅ Gone entirely |
| Hero fits viewport (100vh/100dvh) | ✅ `min-height: 100vh; display: flex; align-items: center;` |
| Visual richness — alternating backgrounds | ✅ Dotted grids, warm tones, sage, cream, peach, hairlines per section |
| Paper tear SVG dividers (3 dividers) | ✅ Between sections for organic visual breaks |
| Softer warm browns | ✅ `--warm-soft: #5C4A36 → --warm-deep: #4A3826` (not aggressive black) |
| Mobile overhaul (480px) | ✅ Full-screen drawer with overlay, sized text, proper padding |
| Hamburger → X animation | ✅ Working with open/close toggle + Escape key |
| Mobile drawer backdrop overlay | ✅ Dark overlay + body scroll lock |
| Server-side form validation | ✅ Required fields, length caps, email regex, HTML/URL detection |
| Honeypot spam protection | ✅ Hidden `_gotcha` field, silently rejects bots |
| Rate limiting (5/IP/hour) | ✅ In-memory per cold start, 429 response on excess |
| Strip formspreeId from error responses | ✅ No env var leak |
| "Roster full" UI state | ✅ Full card replaces founding card, waitlist form appears |
| Copy fix ("Four questions" → "Five short fields") | ✅ Fixed in apply section + final CTA |
| Skip-to-content link | ✅ Visible on keyboard focus |
| ARIA landmarks | ✅ `role="banner"`, `role="main"`, `role="contentinfo"`, 15 `aria-label` |
| Focus-visible styles | ✅ 3px peach-deep outlines on all interactive elements |
| Focus management on form success | ✅ `tabindex="-1"` + `.focus()` + `.scrollIntoView()` |
| `aria-describedby` on form hints | ✅ Added for name, email, rooms |
| OG + Twitter meta tags | ✅ Full set (title, description, image, url, type, card) |
| `<link rel="canonical">` | ✅ Added |
| `sitemap.xml` | ✅ Created |
| `robots.txt` | ✅ Created |
| Security headers updated | ✅ Permissions-Policy added, all headers in vercel.json |
| `novalidate` on form | ✅ Client-side validation runs before submit |
| Staggered scroll reveal | ✅ 80ms stagger per group of 4 |
| Escape key closes drawer | ✅ Focus returns to toggle button |
| Roster full state in JS | ✅ `isRosterFull()` + `showRosterFull()` |

### ⬜ Still Needs Work (future sessions)
| Item | Status |
|------|--------|
| Counter persistence (Vercel KV or webhook) | ⬜ Manual HTML edit still required |
| Confirmation email to applicant | ⬜ Need email service (Resend/SendGrid) |
| Applicant pipeline (review → accept/reject → payment) | ⬜ Need Stripe + CRM |
| Payment/subscription flow ($199/mo Stripe Billing) | ⬜ Not started |
| Member dashboard / portal | ⬜ Not started |
| Analytics (Vercel Analytics or Plausible) | ⬜ Add `<script>` tag |
| OG image (`og-image.png` 1200x630) | ⬜ Need to design + upload |
| Privacy Policy page | ⬜ Need to create |
| Terms of Service page | ⬜ Need to create |
| Custom domain in Vercel | ⬜ Manual setup needed |
| Email forwarding (hello@guestsyndicate.com) | ⬜ Manual setup needed |
| Google Search Console submission | ⬜ Manual submission needed |
| Contrast audit (WCAG 2.1 AA) | ⬜ Verify all color pairs pass 4.5:1 |
