// ============================================
// Guest Syndicate — landing page interactions
// ============================================

// ----- CONFIG -----
// Option A (easiest): paste your Formspree form ID below
//   e.g. const FORMSPREE_ID = 'xyzabc123';
//   Then deploy. Done.
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';

// Option B (Vercel env var): leave FORMSPREE_ID as 'YOUR_FORMSPREE_ID' above
//   and set window.FORMSPREE_ID in a small inline <script> in index.html,
//   OR inject via your build. The code below uses FORMSPREE_ID first,
//   then falls back to window.FORMSPREE_ID, then to the data attribute.
// ============================================

function getFormspreeEndpoint() {
  const id =
    (FORMSPREE_ID && FORMSPREE_ID !== 'YOUR_FORMSPREE_ID' && FORMSPREE_ID) ||
    (typeof window !== 'undefined' && window.FORMSPREE_ID) ||
    document.getElementById('applicationForm')?.dataset.formspreeId ||
    'YOUR_FORMSPREE_ID';

  if (!id || id === 'YOUR_FORMSPREE_ID') {
    return null; // not configured yet
  }
  return `https://formspree.io/f/${id}`;
}

// ----- Form submission -----
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const success = document.getElementById('applySuccess');
  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');
  const name = document.getElementById('name').value.trim();

  // Build submission payload
  const data = Object.fromEntries(new FormData(form).entries());

  // Honeypot for spam (Formspree convention: field named _gotcha)
  // If you want to add a hidden honeypot, give the form a _gotcha input.

  const endpoint = getFormspreeEndpoint();

  // UI: loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Sending…';
  status.textContent = '';
  status.className = 'form-status';

  try {
    if (!endpoint) {
      // No Formspree configured yet — show a friendly warning + console log
      console.warn(
        '[Guest Syndicate] No Formspree endpoint configured. ' +
        'Edit FORMSPREE_ID in app.js (or set window.FORMSPREE_ID). ' +
        'Captured submission:',
        data
      );
      status.textContent =
        'Form not wired up yet — check app.js for the Formspree setup. Your data is logged to the console.';
      status.classList.add('form-status--warn');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit application <span class="btn-arrow">→</span>';
      return;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      form.style.display = 'none';
      success.classList.add('show');
      if (name) {
        success.querySelector('h3').textContent = `Thanks, ${name.split(' ')[0]}. Application received.`;
      }
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      decrementCounter();
    } else {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error || `Formspree returned ${res.status}.`;
      throw new Error(msg);
    }
  } catch (err) {
    console.error('[Guest Syndicate] Submission error:', err);
    status.textContent = `Something went wrong: ${err.message}. Please email us directly.`;
    status.classList.add('form-status--error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit application <span class="btn-arrow">→</span>';
  }
}

// ----- Counter decrement (UI only — the source of truth is your form backend) -----
function decrementCounter() {
  const el = document.getElementById('spotsRemaining');
  const fill = document.querySelector('.counter-fill');
  const note = document.querySelector('.counter-note');
  const current = parseInt(el.textContent, 10);
  if (current > 0) {
    const next = current - 1;
    el.textContent = next;
    const taken = 10 - next;
    const pct = (taken / 10) * 100;
    fill.style.width = pct + '%';
    if (next <= 3) {
      note.textContent = `Only ${next} seats left — closing soon`;
      note.style.color = 'var(--peach-deep)';
    }
  }
}

// ----- Scroll reveal -----
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('.promise-card, .step, .perk, .faq-item, .assurance-item, .greenroom-card').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ----- Subtle nav blur on scroll -----
const nav = document.querySelector('.nav');
window.addEventListener(
  'scroll',
  () => {
    const current = window.scrollY;
    nav.style.background = current > 20
      ? 'rgba(251, 247, 242, 0.85)'
      : 'rgba(251, 247, 242, 0.7)';
  },
  { passive: true }
);
