// ============================================
// Guest Syndicate landing page interactions
// ============================================

// Form posts to /api/submit, which is a Vercel serverless function
// that reads FORMSPREE_ID from your Vercel environment variables
// and forwards the submission to Formspree. Your ID never enters git.
// ============================================

const SUBMIT_ENDPOINT = '/api/submit';

// ----- Form submission -----
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const success = document.getElementById('applySuccess');
  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');
  const name = document.getElementById('name').value.trim();

  const data = Object.fromEntries(new FormData(form).entries());
  const endpoint = SUBMIT_ENDPOINT;

  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Sending…';
  status.textContent = '';
  status.className = 'form-status';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));

    if (res.ok && body.ok !== false) {
      form.style.display = 'none';
      success.classList.add('show');
      if (name) {
        success.querySelector('h3').textContent = `Thanks, ${name.split(' ')[0]}. Application received.`;
      }
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      decrementCounter();
    } else {
      const msg = body?.error || `Server returned ${res.status}.`;
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

// ----- Counter decrement -----
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
      note.textContent = `Only ${next} seats left. Closing soon.`;
      note.style.color = 'var(--peach-deep)';
    }
  }
}

// ----- Nav: scroll state + mobile drawer -----
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navDrawer = document.getElementById('navDrawer');

function updateNav() {
  if (window.scrollY > 20) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

if (navToggle && navDrawer) {
  navToggle.addEventListener('click', () => {
    const open = navDrawer.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });

  // Close drawer when a link is clicked
  navDrawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navDrawer.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close drawer on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && navDrawer.classList.contains('open')) {
      navDrawer.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
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

document.querySelectorAll('.promise-card, .step, .perk, .faq-item, .assurance-item, .greenroom-card, .manifesto-list li, .who-stat').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});
