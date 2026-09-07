/**
 * admin.js — Suprema Glass & Facilities
 * Painel administrativo — salva diretamente no servidor via admin-backend.php
 */

'use strict';

// ── ESTADO GLOBAL ─────────────────────────────────────────────────────────────
const State = {
    token:         null,
    data:          null,
    catIndex:      null,
    editingProj:   null,
    unsaved:       false,
    pendingDelete: null,
};

// ── DOM ───────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const Dom = {
    loginScreen:      $('loginScreen'),
    adminPanel:       $('adminPanel'),
    senhaInput:       $('senhaInput'),
    togglePass:       $('togglePass'),
    btnLogin:         $('btnLogin'),
    loginErro:        $('loginErro'),

    sidebarToggle:    $('sidebarToggle'),
    adminSidebar:     $('adminSidebar'),
    adminMain:        $('adminMain'),
    sidebarCats:      $('sidebarCats'),
    sidebarStats:     $('sidebarStats'),
    btnAddCat:        $('btnAddCat'),
    btnSaveMain:      $('btnSaveMain'),
    btnSaveTop:       $('btnSaveTop'),
    btnLogout:        $('btnLogout'),

    secDashboard:     $('secDashboard'),
    dashCards:        $('dashCards'),

    secCategoria:     $('secCategoria'),
    catTagLabel:      $('catTagLabel'),
    catPageTitle:     $('catPageTitle'),
    catLabel:         $('catLabel'),
    catId:            $('catId'),
    catDesc:          $('catDesc'),
    catIcon:          $('catIcon'),
    iconPreviewEl:    $('iconPreviewEl'),
    btnIconGrid:      $('btnIconGrid'),
    iconGrid:         $('iconGrid'),
    iconGridItems:    $('iconGridItems'),
    iconSearch:       $('iconSearch'),
    projCount:        $('projCount'),
    projectsGrid:     $('projectsGrid'),
    btnBackDash:      $('btnBackDash'),
    btnAddProject:    $('btnAddProject'),
    btnDeleteCat:     $('btnDeleteCat'),

    modalOverlay:     $('modalOverlay'),
    modalTitle:       $('modalTitle'),
    modalClose:       $('modalClose'),
    btnCancelModal:   $('btnCancelModal'),
    btnSaveProject:   $('btnSaveProject'),
    uploadZone:       $('uploadZone'),
    uploadPreview:    $('uploadPreview'),
    uploadProgress:   $('uploadProgress'),
    progressFill:     $('progressFill'),
    progressText:     $('progressText'),
    fileInput:        $('fileInput'),
    projImg:          $('projImg'),
    projTitulo:       $('projTitulo'),
    projTag:          $('projTag'),
    projOrientacao:   $('projOrientacao'),
    projDesc:         $('projDesc'),
    projDetalhes:     $('projDetalhes'),

    confirmOverlay:   $('confirmOverlay'),
    confirmMsg:       $('confirmMsg'),
    btnCancelConfirm: $('btnCancelConfirm'),
    btnConfirmDelete: $('btnConfirmDelete'),

    adminToast:       $('adminToast'),
    saveIndicator:    $('saveIndicator'),
};

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = sessionStorage.getItem('sg_admin_token');
    if (savedToken) {
        State.token = savedToken;
        showPanel();
        loadData();
    }
    bindEvents();
});

// ── EVENTS ────────────────────────────────────────────────────────────────────
function bindEvents() {
    Dom.btnLogin.addEventListener('click', handleLogin);
    Dom.senhaInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
    Dom.togglePass.addEventListener('click', () => {
        const isPass = Dom.senhaInput.type === 'password';
        Dom.senhaInput.type = isPass ? 'text' : 'password';
        Dom.togglePass.querySelector('i').className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    Dom.btnLogout.addEventListener('click', handleLogout);
    Dom.btnSaveTop.addEventListener('click', saveData);
    Dom.btnSaveMain.addEventListener('click', saveData);
    Dom.sidebarToggle.addEventListener('click', toggleSidebar);

    Dom.btnAddCat.addEventListener('click', addNewCategory);
    Dom.btnBackDash.addEventListener('click', showDashboard);
    Dom.btnDeleteCat.addEventListener('click', () => {
        State.pendingDelete = { type: 'cat', catIdx: State.catIndex };
        Dom.confirmMsg.textContent = `Excluir a categoria "${State.data.categorias[State.catIndex].label}" e todos os seus projetos?`;
        showConfirm();
    });

    Dom.catLabel.addEventListener('input', () => {
        if (State.catIndex === null) return;
        State.data.categorias[State.catIndex].label = Dom.catLabel.value;
        markUnsaved();
    });
    Dom.catDesc.addEventListener('input', () => {
        if (State.catIndex === null) return;
        State.data.categorias[State.catIndex].descricao = Dom.catDesc.value;
        markUnsaved();
    });

    Dom.catIcon.addEventListener('input', () => {
        if (State.catIndex === null) return;
        const val = Dom.catIcon.value.trim();
        State.data.categorias[State.catIndex].icon = val;
        Dom.iconPreviewEl.className = val || 'fa-solid fa-star';
        markUnsaved();
    });

    Dom.btnIconGrid.addEventListener('click', () => {
        Dom.iconGrid.classList.toggle('hidden');
        if (!Dom.iconGrid.classList.contains('hidden')) {
            renderIconGrid();
            Dom.iconSearch.focus();
        }
    });

    Dom.iconSearch.addEventListener('input', renderIconGrid);

    Dom.btnAddProject.addEventListener('click', openModalNewProject);
    Dom.modalClose.addEventListener('click', closeModal);
    Dom.btnCancelModal.addEventListener('click', closeModal);
    Dom.btnSaveProject.addEventListener('click', saveProject);

    Dom.uploadZone.addEventListener('click', () => Dom.fileInput.click());
    Dom.uploadZone.addEventListener('dragover', e => { e.preventDefault(); Dom.uploadZone.classList.add('drag-over'); });
    Dom.uploadZone.addEventListener('dragleave', () => Dom.uploadZone.classList.remove('drag-over'));
    Dom.uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        Dom.uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
    });
    Dom.fileInput.addEventListener('change', e => {
        if (e.target.files[0]) handleFileUpload(e.target.files[0]);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (!Dom.confirmOverlay.classList.contains('hidden')) closeConfirm();
            else if (!Dom.modalOverlay.classList.contains('hidden')) closeModal();
        }
    });

    Dom.btnCancelConfirm.addEventListener('click', closeConfirm);
    Dom.btnConfirmDelete.addEventListener('click', executeDelete);
    // Fecha modal apenas ao clicar DIRETAMENTE no overlay (fundo escuro), nunca ao clicar dentro do modal-box
    Dom.modalOverlay.addEventListener('mousedown', e => { if (e.target === Dom.modalOverlay) closeModal(); });
    Dom.confirmOverlay.addEventListener('mousedown', e => { if (e.target === Dom.confirmOverlay) closeConfirm(); });
    // Impede que cliques dentro do modal-box propaguem ao overlay
    Dom.modalOverlay.querySelector('.modal-box').addEventListener('mousedown', e => e.stopPropagation());
    Dom.confirmOverlay.querySelector('.modal-box').addEventListener('mousedown', e => e.stopPropagation());

    window.addEventListener('beforeunload', e => {
        if (State.unsaved) { e.preventDefault(); e.returnValue = ''; }
    });
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
async function handleLogin() {
    const senha = Dom.senhaInput.value.trim();
    if (!senha) { showLoginError('Digite sua senha.'); return; }

    Dom.btnLogin.disabled = true;
    Dom.btnLogin.querySelector('span').textContent = 'Entrando...';

    try {
        const res = await api('login', { senha }, false);
        State.token = res.token;
        sessionStorage.setItem('sg_admin_token', res.token);
        hideLoginError();
        showPanel();
        await loadData();
    } catch (err) {
        showLoginError(err.message || 'Senha incorreta. Tente novamente.');
    } finally {
        Dom.btnLogin.disabled = false;
        Dom.btnLogin.querySelector('span').textContent = 'Entrar';
    }
}

function handleLogout() {
    if (State.unsaved && !confirm('Há alterações não publicadas. Sair mesmo assim?')) return;
    sessionStorage.removeItem('sg_admin_token');
    State.token = null;
    Dom.loginScreen.classList.remove('hidden');
    Dom.adminPanel.classList.add('hidden');
    Dom.senhaInput.value = '';
}

function showPanel() {
    Dom.loginScreen.classList.add('hidden');
    Dom.adminPanel.classList.remove('hidden');
}

function showLoginError(msg) {
    Dom.loginErro.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
    Dom.loginErro.classList.remove('hidden');
}
function hideLoginError() { Dom.loginErro.classList.add('hidden'); }

// ── CARREGAR DADOS ────────────────────────────────────────────────────────────
async function loadData() {
    try {
        const res = await fetch('assets/data/portfolio.json?t=' + Date.now());
        if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
        State.data = await res.json();
        renderSidebar();
        renderDashboard();
        showDashboard();
    } catch (err) {
        console.error('Falha ao carregar:', err);
        showToast('Erro ao carregar dados do portfólio.', 'error');
    }
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function renderSidebar() {
    const cats = State.data.categorias;
    Dom.sidebarCats.innerHTML = cats.map((cat, i) => `
        <li>
            <button class="sidebar-cat-btn ${State.catIndex === i ? 'active' : ''}"
                    data-idx="${i}" onclick="goToCategory(${i})">
                <i class="${cat.icon}"></i>
                ${cat.label}
                <span class="cat-count">${cat.projetos.length}</span>
            </button>
        </li>
    `).join('');

    const total = cats.reduce((s, c) => s + c.projetos.length, 0);
    Dom.sidebarStats.innerHTML = `
        <strong>${cats.length}</strong> categorias &nbsp;·&nbsp;
        <strong>${total}</strong> projetos
    `;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard() {
    Dom.dashCards.innerHTML = State.data.categorias.map((cat, i) => `
        <div class="dash-cat-card" onclick="goToCategory(${i})">
            <div class="dash-cat-icon"><i class="${cat.icon}"></i></div>
            <h3>${cat.label}</h3>
            <p><strong>${cat.projetos.length}</strong> projeto${cat.projetos.length !== 1 ? 's' : ''}</p>
        </div>
    `).join('') + `
        <div class="dash-cat-card" onclick="addNewCategory()"
             style="border-style:dashed;align-items:center;justify-content:center;display:flex;flex-direction:column;gap:8px;min-height:120px">
            <div class="dash-cat-icon" style="margin:0"><i class="fa-solid fa-plus"></i></div>
            <h3>Nova Categoria</h3>
        </div>
    `;
}

function showDashboard() {
    State.catIndex = null;
    Dom.secDashboard.classList.remove('hidden');
    Dom.secCategoria.classList.add('hidden');
    renderSidebar();
    renderDashboard();
}

// ── CATEGORIA ─────────────────────────────────────────────────────────────────
window.goToCategory = function(idx) {
    State.catIndex = idx;
    const cat = State.data.categorias[idx];

    Dom.secDashboard.classList.add('hidden');
    Dom.secCategoria.classList.remove('hidden');

    Dom.catTagLabel.textContent  = 'Categoria';
    Dom.catPageTitle.textContent = cat.label;
    Dom.catLabel.value           = cat.label;
    Dom.catId.value              = cat.id;
    Dom.catDesc.value            = cat.descricao || '';
    Dom.catIcon.value            = cat.icon || '';
    Dom.iconPreviewEl.className  = cat.icon || 'fa-solid fa-star';
    Dom.iconGrid.classList.add('hidden');

    renderProjects();
    renderSidebar();

    if (window.innerWidth < 768) Dom.adminSidebar.classList.remove('open');
};

function renderProjects() {
    const cat = State.data.categorias[State.catIndex];
    Dom.projCount.textContent = cat.projetos.length;

    if (cat.projetos.length === 0) {
        Dom.projectsGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-dim)">
                <i class="fa-solid fa-images" style="font-size:36px;margin-bottom:12px;display:block"></i>
                Nenhum projeto ainda. Clique em <strong>Adicionar Projeto</strong>.
            </div>`;
        return;
    }

    Dom.projectsGrid.innerHTML = cat.projetos.map((proj, i) => `
        <div class="project-card" data-proj-idx="${i}">
            ${proj.img
                ? `<img class="project-card-img" src="${proj.img}" alt="${proj.titulo || ''}" loading="lazy">`
                : `<div class="project-card-img-placeholder"><i class="fa-solid fa-image"></i></div>`}
            <div class="project-card-body">
                <div class="project-card-title">${proj.titulo || 'Sem título'}</div>
                <div class="project-card-tag">${proj.tag || ''}</div>
            </div>
            <div class="project-card-actions">
                <button class="card-action-btn" title="Editar" onclick="openModalEdit(${i})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="card-action-btn delete" title="Excluir" onclick="confirmDeleteProject(${i})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ── ICON PICKER ───────────────────────────────────────────────────────────────
const ICON_LIST = [
    ['fa-solid fa-shower',         'Box / Chuveiro'],
    ['fa-solid fa-house-chimney',  'Casa'],
    ['fa-solid fa-wind',           'Ventilação'],
    ['fa-solid fa-table-columns',  'Divisória'],
    ['fa-solid fa-door-open',      'Porta'],
    ['fa-solid fa-window-maximize','Janela'],
    ['fa-solid fa-building',       'Prédio'],
    ['fa-solid fa-umbrella',       'Cobertura'],
    ['fa-solid fa-star',           'Destaque'],
    ['fa-solid fa-layer-group',    'Camadas'],
    ['fa-solid fa-gem',            'Decorativo'],
    ['fa-solid fa-mirror',         'Espelho'],
    ['fa-solid fa-circle',         'Círculo'],
    ['fa-solid fa-square',         'Quadrado'],
    ['fa-solid fa-sun',            'Sol'],
    ['fa-solid fa-moon',           'Lua'],
    ['fa-solid fa-leaf',           'Natureza'],
    ['fa-solid fa-droplet',        'Água'],
    ['fa-solid fa-fire',           'Fogo'],
    ['fa-solid fa-snowflake',      'Gelo'],
    ['fa-solid fa-bolt',           'Energia'],
    ['fa-solid fa-shield',         'Proteção'],
    ['fa-solid fa-lock',           'Segurança'],
    ['fa-solid fa-wrench',         'Instalação'],
    ['fa-solid fa-screwdriver-wrench','Ferramentas'],
    ['fa-solid fa-hammer',         'Construção'],
    ['fa-solid fa-ruler',          'Medição'],
    ['fa-solid fa-paint-roller',   'Acabamento'],
    ['fa-solid fa-palette',        'Design'],
    ['fa-solid fa-couch',          'Mobiliário'],
    ['fa-solid fa-bed',            'Quarto'],
    ['fa-solid fa-bath',           'Banheiro'],
    ['fa-solid fa-kitchen-set',    'Cozinha'],
    ['fa-solid fa-stairs',         'Escada'],
    ['fa-solid fa-fence',          'Fechamento'],
    ['fa-solid fa-archway',        'Arco'],
    ['fa-solid fa-image',          'Foto'],
    ['fa-solid fa-images',         'Galeria'],
    ['fa-solid fa-plus',           'Adicionar'],
    ['fa-solid fa-check',          'Concluído'],
];

function renderIconGrid() {
    const q = (Dom.iconSearch.value || '').toLowerCase();
    const filtered = q
        ? ICON_LIST.filter(([cls, label]) => label.toLowerCase().includes(q) || cls.includes(q))
        : ICON_LIST;

    Dom.iconGridItems.innerHTML = filtered.map(([cls, label]) => `
        <button type="button" class="icon-grid-btn${Dom.catIcon.value === cls ? ' active' : ''}"
            title="${label}" onclick="selectIcon('${cls}')">
            <i class="${cls}"></i>
            <span>${label}</span>
        </button>
    `).join('');
}

function selectIcon(cls) {
    if (State.catIndex === null) return;
    Dom.catIcon.value = cls;
    Dom.iconPreviewEl.className = cls;
    State.data.categorias[State.catIndex].icon = cls;
    Dom.iconGrid.classList.add('hidden');
    markUnsaved();
}

function addNewCategory() {
    const novaCat = {
        id:        'categoria-' + Date.now(),
        label:     'Nova Categoria',
        icon:      'fa-solid fa-star',
        descricao: '',
        alt:       false,
        projetos:  []
    };
    State.data.categorias.push(novaCat);
    markUnsaved();
    goToCategory(State.data.categorias.length - 1);
    showToast('Categoria criada! Edite o nome e adicione projetos.', 'info');
    setTimeout(() => Dom.catLabel.focus(), 100);
}

// ── MODAL PROJETO ─────────────────────────────────────────────────────────────
function openModalNewProject() {
    State.editingProj = null;
    Dom.modalTitle.textContent = 'Novo Projeto';
    clearModal();
    Dom.modalOverlay.classList.remove('hidden');
    Dom.projTitulo.focus();
}

window.openModalEdit = function(projIdx) {
    State.editingProj = projIdx;
    const proj = State.data.categorias[State.catIndex].projetos[projIdx];
    Dom.modalTitle.textContent = 'Editar Projeto';

    Dom.projImg.value        = proj.img || '';
    Dom.projTitulo.value     = proj.titulo || '';
    Dom.projTag.value        = proj.tag || '';
    Dom.projOrientacao.value = proj.orientacao || 'portrait';
    Dom.projDesc.value       = proj.descricao || '';
    Dom.projDetalhes.value   = proj.detalhes || '';

    if (proj.img) setUploadPreviewImage(proj.img);
    else clearUploadPreview();

    Dom.modalOverlay.classList.remove('hidden');
    Dom.projTitulo.focus();
};

function saveProject() {
    const titulo = Dom.projTitulo.value.trim();
    if (!titulo) {
        Dom.projTitulo.focus();
        showToast('O título do projeto é obrigatório.', 'error');
        return;
    }

    const proj = {
        id:         generateId(titulo),
        img:        Dom.projImg.value.trim(),
        titulo,
        tag:        Dom.projTag.value.trim(),
        orientacao: Dom.projOrientacao.value,
        descricao:  Dom.projDesc.value.trim(),
        detalhes:   Dom.projDetalhes.value.trim(),
    };

    const cat = State.data.categorias[State.catIndex];

    if (State.editingProj !== null) {
        proj.id = cat.projetos[State.editingProj].id || proj.id;
        cat.projetos[State.editingProj] = proj;
        showToast('Projeto atualizado!', 'success');
    } else {
        cat.projetos.push(proj);
        showToast('Projeto adicionado!', 'success');
    }

    markUnsaved();
    closeModal();
    renderProjects();
    renderSidebar();
    Dom.catPageTitle.textContent = cat.label;
}

function clearModal() {
    Dom.projImg.value        = '';
    Dom.projTitulo.value     = '';
    Dom.projTag.value        = '';
    Dom.projOrientacao.value = 'portrait';
    Dom.projDesc.value       = '';
    Dom.projDetalhes.value   = '';
    clearUploadPreview();
    Dom.fileInput.value      = '';
}

function closeModal() { Dom.modalOverlay.classList.add('hidden'); }

// ── UPLOAD ────────────────────────────────────────────────────────────────────
async function handleFileUpload(file) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
        showToast('Tipo não permitido. Use JPEG, PNG ou WebP.', 'error');
        return;
    }
    if (file.size > 8 * 1024 * 1024) {
        showToast('Arquivo muito grande. Máximo: 8MB.', 'error');
        return;
    }

    Dom.uploadPreview.classList.add('hidden');
    Dom.uploadProgress.classList.remove('hidden');
    Dom.progressFill.style.width = '0%';
    Dom.progressText.textContent = 'Enviando imagem...';

    await remoteUpload(file);
}

async function remoteUpload(file) {
    let prog = 0;
    const iv = setInterval(() => {
        prog = Math.min(prog + 15, 85);
        Dom.progressFill.style.width = prog + '%';
    }, 200);

    try {
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('imagem', file);

        const res = await apiFormData(formData);
        clearInterval(iv);
        Dom.progressFill.style.width = '100%';

        setTimeout(() => {
            Dom.projImg.value = res.url;
            setUploadPreviewImage(res.url);
            Dom.uploadProgress.classList.add('hidden');
            Dom.uploadPreview.classList.remove('hidden');
            showToast('Imagem enviada com sucesso!', 'success');
        }, 400);
    } catch (err) {
        clearInterval(iv);
        Dom.uploadProgress.classList.add('hidden');
        Dom.uploadPreview.classList.remove('hidden');
        showToast('Erro ao enviar imagem: ' + (err.message || 'tente novamente'), 'error');
    }
}

function setUploadPreviewImage(url) {
    Dom.uploadPreview.classList.remove('hidden');
    Dom.uploadPreview.classList.add('has-image');
    Dom.uploadPreview.innerHTML = `
        <img src="${url}" alt="Preview">
        <div class="img-overlay">
            <i class="fa-solid fa-camera"></i>
            Trocar imagem
        </div>`;
}

function clearUploadPreview() {
    Dom.uploadPreview.classList.remove('has-image');
    Dom.uploadPreview.innerHTML = `
        <i class="fa-solid fa-image"></i>
        <p>Clique ou arraste uma foto aqui</p>
        <small>JPEG, PNG ou WebP • máx. 8MB</small>`;
}

// ── DELETE ────────────────────────────────────────────────────────────────────
window.confirmDeleteProject = function(projIdx) {
    const proj = State.data.categorias[State.catIndex].projetos[projIdx];
    State.pendingDelete = { type: 'proj', catIdx: State.catIndex, projIdx };
    Dom.confirmMsg.textContent = `Excluir o projeto "${proj.titulo || 'sem título'}"?`;
    showConfirm();
};

function executeDelete() {
    const { type, catIdx, projIdx } = State.pendingDelete;

    if (type === 'proj') {
        State.data.categorias[catIdx].projetos.splice(projIdx, 1);
        showToast('Projeto excluído.', 'success');
        renderProjects();
        renderSidebar();
    } else if (type === 'cat') {
        State.data.categorias.splice(catIdx, 1);
        showToast('Categoria excluída.', 'success');
        showDashboard();
    }

    markUnsaved();
    closeConfirm();
    State.pendingDelete = null;
}

function showConfirm() { Dom.confirmOverlay.classList.remove('hidden'); }
function closeConfirm() { Dom.confirmOverlay.classList.add('hidden'); }

// ── SALVAR ────────────────────────────────────────────────────────────────────
async function saveData() {
    if (!State.data) return;

    Dom.saveIndicator.classList.remove('hidden');
    Dom.btnSaveTop.disabled  = true;
    Dom.btnSaveMain.disabled = true;

    try {
        const res = await api('save', { data: State.data });
        showToast(`✓ Publicado! ${res.projetos} projetos no ar.`, 'success');
        State.unsaved = false;
        updateUnsavedIndicator();
    } catch (err) {
        showToast('Erro ao publicar: ' + (err.message || 'tente novamente'), 'error');
    } finally {
        Dom.saveIndicator.classList.add('hidden');
        Dom.btnSaveTop.disabled  = false;
        Dom.btnSaveMain.disabled = false;
    }
}

// ── UI HELPERS ────────────────────────────────────────────────────────────────
function toggleSidebar() {
    if (window.innerWidth < 768) {
        Dom.adminSidebar.classList.toggle('open');
    } else {
        Dom.adminSidebar.classList.toggle('collapsed');
        Dom.adminMain.classList.toggle('full');
    }
}

function markUnsaved() {
    State.unsaved = true;
    updateUnsavedIndicator();
}

function updateUnsavedIndicator() {
    Dom.btnSaveTop.querySelector('span').textContent = State.unsaved ? 'Publicar *' : 'Publicar';
}

let toastTimeout;
function showToast(msg, type = 'info') {
    Dom.adminToast.className = `admin-toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    Dom.adminToast.innerHTML = `<i class="fa-solid ${icons[type] || 'fa-circle-info'}"></i> ${msg}`;
    Dom.adminToast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => Dom.adminToast.classList.remove('show'), 5000);
}

// ── API ───────────────────────────────────────────────────────────────────────
async function api(action, body = {}, withToken = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (withToken && State.token) headers['X-Admin-Token'] = State.token;

    const res = await fetch('admin-backend.php', {
        method: 'POST', headers,
        body: JSON.stringify({ action, ...body }),
    });

    let json;
    try { json = await res.json(); }
    catch { throw new Error('O servidor não retornou JSON válido. Verifique se o PHP está ativo no XAMPP.'); }

    if (res.status === 401) {
        sessionStorage.removeItem('sg_admin_token');
        Dom.loginScreen.classList.remove('hidden');
        Dom.adminPanel.classList.add('hidden');
        throw new Error(json.erro || 'Sessão expirada');
    }

    if (!json.ok) throw new Error(json.erro || 'Erro desconhecido');
    return json;
}

async function apiFormData(formData) {
    if (State.token) formData.append('token', State.token);

    const res = await fetch('admin-backend.php', {
        method: 'POST',
        headers: { 'X-Admin-Token': State.token || '' },
        body: formData,
    });

    let json;
    try { json = await res.json(); }
    catch { throw new Error('Resposta inválida do servidor.'); }

    if (!json.ok) throw new Error(json.erro || 'Erro no upload');
    return json;
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function generateId(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40)
        + '-' + Date.now().toString(36);
}

function slugify(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
}