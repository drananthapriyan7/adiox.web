/* ==========================================
   ADIOX — Main JS
   ========================================== */

// ── Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(el => { if (el.isIntersecting) el.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Stat counters
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const decimals = el.dataset.decimals !== undefined ? parseInt(el.dataset.decimals) : (el.dataset.target.includes('.') ? 1 : 0);
  const useLocale = !suffix.match(/[BMK]/);
  const duration = 2000;
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = target * ease;
    const formatted = decimals > 0
      ? val.toFixed(decimals)
      : useLocale ? Math.floor(val).toLocaleString() : Math.floor(val).toString();
    el.textContent = prefix + formatted + suffix;
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('[data-target]').forEach(animateCounter);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
const statsSection = document.querySelector('.stats');
if (statsSection) statsObserver.observe(statsSection);

// ── Product tabs
document.querySelectorAll('.ptab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.product-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active');
  });
});

// ── Countdown timers
function updateTimers() {
  document.querySelectorAll('[data-timer]').forEach(timer => {
    const end = new Date(timer.dataset.timer);
    const now = new Date();
    const diff = Math.max(0, end - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const fmt = (v) => String(v).padStart(2, '0');
    const el = timer.querySelector('[data-days]');
    if (el) {
      timer.querySelector('[data-days]').textContent = fmt(d);
      timer.querySelector('[data-hours]').textContent = fmt(h);
      timer.querySelector('[data-mins]').textContent = fmt(m);
      timer.querySelector('[data-secs]').textContent = fmt(s);
    }
  });
}
updateTimers();
setInterval(updateTimers, 1000);

// ── Nav scroll effect
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.style.background = window.scrollY > 40
    ? 'rgba(6,6,15,0.95)'
    : 'rgba(6,6,15,0.8)';
});

// ── Mobile nav
const hamburger = document.querySelector('.nav-hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
}

// ── Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
