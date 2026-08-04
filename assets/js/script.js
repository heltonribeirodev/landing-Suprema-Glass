// ── REVEAL ON SCROLL ──
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 90);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => revealObserver.observe(el));

// ── NAV SCROLL SHADOW ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

// ── HAMBURGER MENU ──
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.mm-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (!nav.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }
});
// ── PROJECT MODAL ──
const modal        = document.getElementById('projModal');
const modalImg     = document.getElementById('modalImg');
const modalTag     = document.getElementById('modalTag');
const modalTitle   = document.getElementById('modalTitle');
const modalDesc    = document.getElementById('modalDesc');
const modalDetails = document.getElementById('modalDetailsText');
const modalClose   = document.getElementById('modalClose');
const backdrop     = modal.querySelector('.proj-modal__backdrop');

function openModal(item) {
  modalImg.src         = item.dataset.img;
  modalImg.alt         = item.dataset.title;
  modalTag.textContent = item.dataset.tag;
  modalTitle.textContent = item.dataset.title;
  modalDesc.textContent  = item.dataset.desc;
  modalDetails.textContent = item.dataset.details;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => openModal(item));
});

modalClose.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});