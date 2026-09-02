// ── PORTFOLIO FILTER (TOPO ABSOLUTO) ──
const filterBtns = document.querySelectorAll('.port-filter-btn');
const sections = document.querySelectorAll('.port-section[id]');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;

    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    sections.forEach(section => {
      if (filter === 'all' || section.id === filter) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    });

    // Força a rolagem para o pixel zero da página
    window.scrollTo({
      top: 300,
      behavior: 'smooth'
    });
  });
});