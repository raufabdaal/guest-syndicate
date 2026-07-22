// ============================================
// Guest Syndicate v3 — landing page interactions
// ============================================

// Form posts to /api/submit, which is a Vercel serverless function
// that reads FORMSPREE_ID from your Vercel environment variables
// and forwards the submission to Formspree. Your ID never enters git.
// ============================================

const SUBMIT_ENDPOINT = '/api/submit';
const TOTAL_SEATS = 10;
const INITIAL_ONBOARD = 1;

// ----- Roster full check -----
// In production, this should come from a KV store or API endpoint.
// For now, we read from the HTML and check the static value.
function isRosterFull() {
  const el = document.getElementById('spotsRemaining');
  return parseInt(el.textContent, 10) <= 0;
}

function showRosterFull() {
  // Hide the founding card, show the full state
  const foundingCard = document.querySelector('.founding-card');
  const rosterFull = document.getElementById('rosterFull');
  const applySection = document.querySelector('.apply-wrap .apply-form');
  const applySide = document.querySelector('.apply-wrap .apply-side');

  if (foundingCard) foundingCard.style.display = 'none';
  if (rosterFull) rosterFull.style.display = 'block';

  if (applySection) {
    applySection.innerHTML = `
      <div style="text-align:center; padding:40px 0;">
        <div style="font-size:28px; color:var(--gold); margin-bottom:16px;">◆</div>
        <h3 style="font-family:var(--font-serif); font-size:24px; color:var(--ink); margin-bottom:8px;">The Roster is full right now.</h3>
        <p style="color:var(--ink-soft); font-size:15px;">All founding seats have been claimed. Join the waitlist to hear when we reopen.</p>
      </div>
    `;
  }
  if (applySide) {
    applySide.querySelector('.h2').textContent = 'The Roster is full right now.';
    applySide.querySelector('.lede').textContent = 'All founding seats have been claimed. We may reopen at a higher tier in the future. Join the waitlist below to be first to know.';
    applySide.querySelector('.apply-assurance').style.display = 'none';
  }
}

// Check on load
if (isRosterFull()) {
  showRosterFull();
}

// ----- Nav: scroll collapse + mobile drawer -----

const nav = document.getElementById('nav');
const navInner = document.getElementById('navInner');
const navToggle = document.getElementById('navToggle');
const navDrawer = document.getElementById('navDrawer');

// Create overlay element for mobile drawer
const overlay = document.createElement('div');
overlay.className = 'nav-overlay';
overlay.id = 'navOverlay';
nav.after(overlay);

function updateNav() {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

function openDrawer() {
  navDrawer.classList.add('open');
  navToggle.classList.add('open');
  navToggle.setAttribute('aria-expanded', 'true');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  navDrawer.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

if (navToggle && navDrawer) {
  navToggle.addEventListener('click', () => {
    if (navDrawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  // Close drawer when a link is clicked
  navDrawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  // Close drawer on overlay click
  overlay.addEventListener('click', closeDrawer);

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navDrawer.classList.contains('open')) {
      closeDrawer();
      navToggle.focus();
    }
  });
}

// ----- Client-side form validation -----
function validateForm(form) {
  const errors = [];
  const name = form.querySelector('#name').value.trim();
  const email = form.querySelector('#email').value.trim();
  const business = form.querySelector('#business').value.trim();
  const rooms = form.querySelector('#rooms').value.trim();
  const why = form.querySelector('#why').value.trim();

  if (!name) errors.push('Name is required.');
  if (name.length > 100) errors.push('Name is too long (max 100 characters).');
  if (/<[^>]+>|https?:\/\//i.test(name)) errors.push('Name contains invalid characters.');

  if (!email) errors.push('Email is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email.');

  if (!business) errors.push('Business description is required.');
  if (business.length > 200) errors.push('Business description is too long (max 200 characters).');

  if (!rooms) errors.push('Target rooms is required.');
  if (rooms.length > 500) errors.push('Target rooms is too long (max 500 characters).');

  if (!why) errors.push('Motivation is required.');
  if (why.length > 800) errors.push('Motivation is too long (max 800 characters).');

  return errors;
}

// ----- Form submission -----
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const success = document.getElementById('applySuccess');
  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');

  // Check if roster is full
  if (isRosterFull()) {
    status.textContent = 'The Founding Roster is currently full. Please join the waitlist instead.';
    status.classList.add('form-status--error');
    return;
  }

  // Client-side validation
  const validationErrors = validateForm(form);
  if (validationErrors.length > 0) {
    status.textContent = validationErrors[0]; // Show first error
    status.classList.add('form-status--error');
    return;
  }

  const name = form.querySelector('#name').value.trim();
  const data = Object.fromEntries(new FormData(form).entries());

  // Clean: trim all string values
  for (const key in data) {
    if (typeof data[key] === 'string') {
      data[key] = data[key].trim();
    }
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Sending…';
  status.textContent = '';
  status.className = 'form-status';

  try {
    const res = await fetch(SUBMIT_ENDPOINT, {
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
      // Move focus to success message for accessibility
      success.setAttribute('tabindex', '-1');
      success.focus();
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
  const note = document.getElementById('counterNote');
  const current = parseInt(el.textContent, 10);

  if (current <= 0) {
    showRosterFull();
    return;
  }

  const next = current - 1;
  el.textContent = next;
  const taken = TOTAL_SEATS - next;
  const pct = (taken / TOTAL_SEATS) * 100;
  fill.style.width = pct + '%';

  if (next <= 0) {
    note.textContent = 'Roster is now full.';
    note.style.color = 'var(--peach-deep)';
    showRosterFull();
  } else if (next <= 3) {
    note.textContent = `Only ${next} seats left. Closing soon.`;
    note.style.color = 'var(--peach-deep)';
  } else {
    const onboarded = TOTAL_SEATS - next;
    note.textContent = `${onboarded} onboarded · ${next} seats remaining`;
  }
}

// ----- Scroll reveal with stagger -----
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
);

const revealTargets = document.querySelectorAll(
  '.step, .perk, .faq-item, .assurance-item, .manifesto-list li, .who-stat, .status-card, .vision-block, .floating-card, .founding-top'
);

revealTargets.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  const delay = (i % 4) * 80;
  el.style.transition = `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`;
  revealObserver.observe(el);
});

// ----- Smooth scroll for nav links -----
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId === '#') return; // Skip logo links
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
