// ── PORTFOLIO — Carrega dinamicamente do portfolio.json ──

(async function () {

  // ── 1. CARREGA O JSON ─────────────────────────────────
  let data;
  try {
    const res = await fetch('assets/data/portfolio.json?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('portfolioContent').innerHTML =
      '<p style="text-align:center;padding:60px;color:#888">Erro ao carregar portfólio. Tente recarregar a página.</p>';
    console.error('Erro ao carregar portfolio.json:', e);
    return;
  }

  const categorias = data.categorias || [];

  // ── 2. GERA OS BOTÕES DE FILTRO ───────────────────────
  const filterContainer = document.getElementById('filterContainer');
  categorias.forEach(cat => {
    if (!cat.projetos || cat.projetos.length === 0) return;
    const btn = document.createElement('button');
    btn.className = 'port-filter-btn';
    btn.dataset.filter = cat.id;
    btn.innerHTML = `<i class="${cat.icon}"></i> ${cat.label}`;
    filterContainer.appendChild(btn);
  });

  // ── 3. GERA AS SEÇÕES E CARDS ─────────────────────────
  const content = document.getElementById('portfolioContent');
  content.innerHTML = '';

  categorias.forEach((cat, idx) => {
    if (!cat.projetos || cat.projetos.length === 0) return;

    const isAlt = cat.alt ? ' port-section--alt' : '';
    const section = document.createElement('section');
    section.className = `port-section${isAlt}`;
    section.id = cat.id;

    // Header da seção
    const header = document.createElement('div');
    header.className = 'container';
    header.innerHTML = `
      <div class="port-section-header reveal">
        <div class="port-section-label">
          <span class="port-section-icon"><i class="${cat.icon}"></i></span>
          <div>
            <div class="section-tag">Categoria</div>
            <h2>${cat.label}</h2>
          </div>
        </div>
        ${cat.descricao ? `<p>${cat.descricao}</p>` : ''}
      </div>`;
    section.appendChild(header);

    // Gallery
    const gallery = document.createElement('div');
    gallery.className = 'gallery';
    gallery.dataset.category = cat.id;

    cat.projetos.forEach(proj => {
      const orientacao = proj.orientacao || 'portrait';
      const imgSrc = proj.img || '';
      const alt = `${proj.titulo || ''} — ${proj.tag || ''}`;
      const detalhesShort = proj.detalhes
        ? proj.detalhes.split('•').slice(0, 3).join('•')
        : '';

      const article = document.createElement('article');
      article.className = `gallery-item ${orientacao} reveal`;
      article.dataset.img     = imgSrc;
      article.dataset.tag     = proj.tag     || '';
      article.dataset.title   = proj.titulo  || '';
      article.dataset.desc    = proj.descricao || '';
      article.dataset.details = proj.detalhes  || '';

      article.innerHTML = `
        <img src="${imgSrc}" alt="${alt}" loading="lazy" decoding="async">
        <div class="gallery-overlay">
          <div class="gallery-overlay-base">
            <span class="gallery-tag">${proj.tag || ''}</span>
            <h4>${proj.titulo || ''}</h4>
          </div>
          <div class="gallery-hover-panel">
            <p>${detalhesShort}</p>
            <span class="gallery-hover-btn">Ver projeto <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>`;

      gallery.appendChild(article);
    });

<<<<<<< HEAD
    section.appendChild(gallery);
    content.appendChild(section);
  });

  // ── 4. FILTROS ────────────────────────────────────────
  const allFilterBtns = document.querySelectorAll('.port-filter-btn');
  const allSections   = document.querySelectorAll('.port-section[id]');
  const NAV_HEIGHT    = 80; // altura fixa do nav

  allFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      allFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Mostra/oculta seções
      allSections.forEach(sec => {
        sec.classList.toggle('hidden', filter !== 'all' && sec.id !== filter);
      });

      // Rola até a seção correta (ou para o topo do conteúdo se "Todos")
      requestAnimationFrame(() => {
        let targetY;

        if (filter === 'all') {
          // "Todos": rola até o início do conteúdo do portfólio
          const firstVisible = [...allSections].find(s => !s.classList.contains('hidden'));
          targetY = firstVisible
            ? firstVisible.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 16
            : 0;
        } else {
          // Categoria específica: rola até o topo dessa seção
          const targetSec = document.getElementById(filter);
          targetY = targetSec
            ? targetSec.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 16
            : 0;
        }

        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
=======
    // Força a rolagem para o pixel zero da página
    window.scrollTo({
      top: 300,
      behavior: 'smooth'
>>>>>>> e8e24afefce05ccbae4575336ec19fcaf217f0c9
    });
  });

  // ── 5. MODAL ─────────────────────────────────────────
  const modal    = document.getElementById('projModal');
  const modalImg = document.getElementById('modalImg');
  const modalTag = document.getElementById('modalTag');
  const modalTitle   = document.getElementById('modalTitle');
  const modalDesc    = document.getElementById('modalDesc');
  const modalDetails = document.getElementById('modalDetails');
  const modalDetailsText = document.getElementById('modalDetailsText');
  const modalClose   = document.getElementById('modalClose');

  let _savedScrollY = 0;

  function openModal(item) {
    _savedScrollY = window.scrollY;
    modalImg.src          = item.dataset.img   || '';
    modalImg.alt          = item.dataset.title || '';
    modalTag.textContent  = item.dataset.tag   || '';
    modalTitle.textContent= item.dataset.title || '';
    modalDesc.textContent = item.dataset.desc  || '';
    modalDetailsText.textContent = item.dataset.details || '';
    modalDetails.style.display = item.dataset.details ? 'flex' : 'none';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.body.style.top = `-${_savedScrollY}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: _savedScrollY, behavior: 'instant' });
    setTimeout(() => { modalImg.src = ''; }, 300);
  }

  // Delegação de eventos para os cards (funciona mesmo após render dinâmico)
  document.getElementById('portfolioContent').addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (item) openModal(item);
  });

  modalClose.addEventListener('click', closeModal);
  modal.querySelector('.proj-modal__backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ── 6. REVEAL SCROLL ─────────────────────────────────
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

})();