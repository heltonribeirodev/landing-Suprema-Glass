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

// ── FABs: aparece só após a primeira tela ──
const waFab    = document.querySelector('.wa-fab');
const instaFab = document.querySelector('.insta-fab');

function toggleFabs() {
  const pastHero = window.scrollY > window.innerHeight * 0.20 ;
  waFab.classList.toggle('fab-visible', pastHero);
  instaFab.classList.toggle('fab-visible', pastHero);
}

window.addEventListener('scroll', toggleFabs, { passive: true });
toggleFabs(); // estado inicial

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

// Trava scroll no mobile (touch) enquanto modal está aberto
let scrollY = 0;

function lockScroll() {
  scrollY = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
}

function unlockScroll() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
}

function openModal(item) {
  modalImg.src             = item.dataset.img;
  modalImg.alt             = item.dataset.title;
  modalTag.textContent     = item.dataset.tag;
  modalTitle.textContent   = item.dataset.title;
  modalDesc.textContent    = item.dataset.desc;
  modalDetails.textContent = item.dataset.details;
  modal.classList.add('open');
  lockScroll();
}

function closeModal() {
  modal.classList.remove('open');
  unlockScroll();
}

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => openModal(item));
  // Acessibilidade: abre modal com Enter ou Espaço (role="button")
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(item);
    }
  });
});

modalClose.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
})




// ─── Controle do Consentimento de Cookies ───
document.addEventListener("DOMContentLoaded", function() {
    const cookieBanner = document.getElementById("cookie-banner");
    const btnAceitar = document.getElementById("btn-aceitar");
    const btnRecusar = document.getElementById("btn-recusar");

    // Verifica no armazenamento local se o consentimento já foi dado
    const consentimentoAtual = localStorage.getItem("sg_cookie_consent");

    if (!consentimentoAtual) {
        // Se não houver registro, exibe o banner
        cookieBanner.style.display = "block";
    } else if (consentimentoAtual === "granted") {
        // Se já aceitou no passado, atualiza o Google Consent Mode silenciosamente
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    }

    // Ação: Aceitar
    btnAceitar.addEventListener("click", function() {
        localStorage.setItem("sg_cookie_consent", "granted");
        cookieBanner.style.display = "none";
        
        // Dispara a atualização para o Google Analytics
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    });

    // Ação: Recusar
    btnRecusar.addEventListener("click", function() {
        localStorage.setItem("sg_cookie_consent", "denied");
        cookieBanner.style.display = "none";
        // O Consent Mode já iniciou como 'denied', então não é necessário atualizar.
    });
});