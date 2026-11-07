// ============================================================
// admin.js — Painel Administrativo (admin.html)
// ============================================================

// ===================== AUTH =====================
const Auth = {
    tokenKey: 'formando_musix_admin_token',
    localPassKey: 'formando_musix_admin_local_pw',
    defaultHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // sha256('admin2026')
    isAuthenticated: false,

    async hash(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    },

    checkSession() {
        const token = sessionStorage.getItem(this.tokenKey) || localStorage.getItem(this.tokenKey);
        if (token) { this.isAuthenticated = true; }
        return this.isAuthenticated;
    },

    async login(password) {
        // Tenta servidor
        try {
            const res = await fetch('/api/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    sessionStorage.setItem(this.tokenKey, data.token);
                    localStorage.setItem(this.tokenKey, data.token);
                    this.isAuthenticated = true;
                    return true;
                }
                return false;
            }
        } catch(e) { console.warn('Servidor offline, auth local'); }

        // Fallback local
        const entered = await this.hash(password);
        const stored = localStorage.getItem(this.localPassKey) || this.defaultHash;
        if (entered === stored) {
            sessionStorage.setItem(this.tokenKey, entered);
            localStorage.setItem(this.tokenKey, entered);
            this.isAuthenticated = true;
            return true;
        }
        return false;
    },

    async changePassword(currentPw, newPw) {
        try {
            const res = await fetch('/api/admin-change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
            });
            if (res.ok) {
                const d = await res.json();
                if (d.success) {
                    sessionStorage.setItem(this.tokenKey, d.token);
                    localStorage.setItem(this.tokenKey, d.token);
                    return { ok: true };
                }
                return { ok: false, msg: d.message };
            }
            const e = await res.json();
            return { ok: false, msg: e.message || 'Erro' };
        } catch(e) {}

        // Fallback local
        const curHash = await this.hash(currentPw);
        const stored = localStorage.getItem(this.localPassKey) || this.defaultHash;
        if (curHash !== stored) return { ok: false, msg: 'Senha atual incorreta!' };
        const newHash = await this.hash(newPw);
        localStorage.setItem(this.localPassKey, newHash);
        sessionStorage.setItem(this.tokenKey, newHash);
        localStorage.setItem(this.tokenKey, newHash);
        return { ok: true };
    },

    logout() {
        sessionStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.tokenKey);
        this.isAuthenticated = false;
        window.location.reload();
    }
};

// ===================== DATA STATE =====================
const Data = {
    key: 'formando_musix_data_v2',
    formandos: [],
    isOnline: false,

    async load() {
        updateSync('saving', 'Carregando...');
        try {
            let res = await fetch('/api/formandos');
            if (!res.ok) res = await fetch('data/formandos.json');
            if (res.ok) {
                const d = await res.json();
                if (Array.isArray(d) && d.length > 0) {
                    this.formandos = d;
                    this.isOnline = true;
                    updateSync('', 'Online 🟢');
                    return;
                }
            }
        } catch(e) {}
        // localStorage fallback
        try {
            const s = localStorage.getItem(this.key);
            if (s) { this.formandos = JSON.parse(s); }
        } catch(e) {}
        updateSync('offline', 'Offline');
    },

    async save(showFeedback = true) {
        if (showFeedback) updateSync('saving', 'Salvando...');
        localStorage.setItem(this.key, JSON.stringify(this.formandos));
        try {
            const res = await fetch('/api/formandos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formandos)
            });
            if (res.ok) {
                this.isOnline = true;
                if (showFeedback) updateSync('', 'Salvo 🟢');
                return true;
            }
        } catch(e) {
            this.isOnline = false;
            if (showFeedback) updateSync('offline', 'Salvo localmente');
        }
        return false;
    },

    add(obj) {
        obj.id = Date.now().toString();
        obj.createdAt = new Date().toISOString();
        this.formandos.push(obj);
        this.save();
        return obj;
    },

    update(id, fields) {
        const i = this.formandos.findIndex(f => f.id === id);
        if (i !== -1) {
            this.formandos[i] = { ...this.formandos[i], ...fields };
            this.save();
            return this.formandos[i];
        }
        return null;
    },

    delete(id) {
        const i = this.formandos.findIndex(f => f.id === id);
        if (i !== -1) { this.formandos.splice(i, 1); this.save(); return true; }
        return false;
    },

    getById(id) {
        return this.formandos.find(f => f.id === id) || null;
    },

    getFiltered(turma, search, status, sort) {
        let list = turma === 'todos' ? [...this.formandos] : this.formandos.filter(f => f.turma === turma);
        const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        if (search) {
            const q = norm(search);
            list = list.filter(f =>
                norm(f.name||'').includes(q) ||
                norm(f.musicTitle||'').includes(q) ||
                norm(f.musicArtist||'').includes(q)
            );
        }
        if (status !== 'todos') {
            list = list.filter(f => (f.status || 'PENDENTE') === status);
        }
        switch(sort) {
            case 'nome-asc':  list.sort((a,b) => a.name.localeCompare(b.name)); break;
            case 'nome-desc': list.sort((a,b) => b.name.localeCompare(a.name)); break;
            case 'recente':   list.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)); break;
            case 'status': {
                const o = {PENDENTE:0, ESCOLHIDO:1, APROVADO:2};
                list.sort((a,b) => (o[b.status]||0) - (o[a.status]||0));
                break;
            }
        }
        return list;
    },

    statsFor(turma) {
        const list = turma === 'todos' ? this.formandos : this.formandos.filter(f => f.turma === turma);
        return {
            total: list.length,
            aprovados: list.filter(f => f.status === 'APROVADO').length,
            escolhidos: list.filter(f => f.status === 'ESCOLHIDO').length,
            pendentes: list.filter(f => !f.status || f.status === 'PENDENTE').length
        };
    }
};

// ===================== RENDER STATE =====================
let currentTab = 'turmaA';
let turmaMap = { turmaA: 'A', turmaB: 'B', todos: 'todos' };

function getCurrentTurma() { return turmaMap[currentTab]; }

function updateSync(cls, text) {
    const pill = document.getElementById('syncPill');
    const txt = document.getElementById('syncText');
    if (!pill) return;
    pill.className = 'sync-pill' + (cls ? ' ' + cls : '');
    if (txt) txt.textContent = text;
}

function getInitials(name) {
    if (!name) return '?';
    const p = name.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
}

function escapeHtml(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getYouTubeId(url) {
    if (!url) return null;
    url = url.trim();
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;
    const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (m && m[2].length === 11) ? m[2] : null;
}

function parseTime(t) {
    if (!t) return 0;
    t = String(t).trim();
    if (t.includes(':')) {
        const [m,s] = t.split(':');
        return (parseInt(m)||0)*60 + (parseInt(s)||0);
    }
    return parseInt(t)||0;
}

function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec||0));
    return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;
}

// Toast
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    document.getElementById('toastIcon').textContent = type === 'error' ? '✗' : '✓';
    document.getElementById('toastText').textContent = msg;
    t.style.borderColor = type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)';
    t.style.color = type === 'error' ? '#F87171' : '#34D399';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ===================== RENDER GRID =====================
function renderGrid() {
    const turma = getCurrentTurma();
    const search = document.getElementById('adminSearchInput')?.value || '';
    const status = document.getElementById('adminFilterStatus')?.value || 'todos';
    const sort = document.getElementById('adminSortOrder')?.value || 'nome-asc';

    const list = Data.getFiltered(turma, search, status, sort);
    const grid = document.getElementById('adminGrid');
    if (!grid) return;

    if (list.length === 0) {
        grid.innerHTML = `<div class="no-results-state">
            <div class="nr-icon">🎓</div>
            <h3>Nenhum formando encontrado</h3>
            <p>Tente ajustar os filtros ou a busca</p>
        </div>`;
        return;
    }

    grid.innerHTML = list.map(f => {
        const st = f.status || 'PENDENTE';
        const stLabel = { PENDENTE: 'Pendente', ESCOLHIDO: 'Escolhido', APROVADO: 'Aprovado' };
        const hasMusic = f.musicTitle;
        const ytId = getYouTubeId(f.musicLink);

        return `
        <div class="admin-card" data-id="${escapeHtml(f.id)}">
            <div class="admin-card-header">
                <div class="admin-card-info">
                    <div class="admin-card-name">${escapeHtml(f.name)}</div>
                    <div class="admin-card-badges">
                        <span class="admin-badge turma-${f.turma}">Turma ${f.turma}</span>
                        <span class="admin-badge ${st}">${stLabel[st]}</span>
                    </div>
                </div>
            </div>

            <div class="admin-card-music">
                ${hasMusic ? `
                    <div class="admin-card-music-title">🎵 ${escapeHtml(f.musicTitle)}</div>
                    <div class="admin-card-music-artist">${escapeHtml(f.musicArtist || '—')}</div>
                    ${f.snippetStart || f.snippetEnd ? `
                        <div class="admin-card-music-snippet">
                            <span>⏱ ${escapeHtml(f.snippetStart||'0:00')} → ${escapeHtml(f.snippetEnd||'—')}</span>
                            ${ytId ? '<span style="color:#60A5FA;font-size:0.7rem;">▶ YouTube</span>' : ''}
                        </div>` : ''}
                ` : `<div class="admin-card-no-music">Sem música escolhida</div>`}
            </div>

            <div class="admin-card-actions">
                ${hasMusic && ytId ? `
                    <button class="admin-card-btn btn-card-play" data-action="play" data-id="${escapeHtml(f.id)}">
                        ▶ Ouvir
                    </button>` : ''}
                ${st === 'ESCOLHIDO' ? `
                    <button class="admin-card-btn btn-card-approve" data-action="approve" data-id="${escapeHtml(f.id)}">
                        ✓ Aprovar
                    </button>` : ''}
                <button class="admin-card-btn btn-card-edit" data-action="edit" data-id="${escapeHtml(f.id)}">
                    ✏ Editar
                </button>
                <button class="admin-card-btn btn-card-delete" data-action="delete" data-id="${escapeHtml(f.id)}" title="Excluir">
                    🗑
                </button>
            </div>
        </div>`;
    }).join('');

    // Events
    grid.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'play') PlayerManager.play(Data.getById(id));
            else if (action === 'edit') openFormModal(id);
            else if (action === 'approve') approveFormando(id);
            else if (action === 'delete') deleteFormando(id);
        });
    });
}

function renderStats() {
    const turma = getCurrentTurma();
    const s = Data.statsFor(turma);
    document.getElementById('statTotal').textContent = s.total;
    document.getElementById('statAprovadas').textContent = s.aprovados;
    document.getElementById('statEscolhidas').textContent = s.escolhidos;
    document.getElementById('statPendentes').textContent = s.pendentes;

    // Tab badges
    ['A','B'].forEach(t => {
        const tkey = t === 'A' ? 'turmaA' : 'turmaB';
        const count = Data.formandos.filter(f => f.turma === t).length;
        const el = document.getElementById('badge' + t);
        if (el) el.textContent = count;
    });
    const badgeTodos = document.getElementById('badgeTodos');
    if (badgeTodos) badgeTodos.textContent = Data.formandos.length;
}

function renderAll() {
    renderStats();
    renderGrid();
}

// Aprovar e Deletar
function approveFormando(id) {
    Data.update(id, { status: 'APROVADO' });
    showToast('Música aprovada! ✓');
    renderAll();
}

function deleteFormando(id) {
    const f = Data.getById(id);
    if (!f) return;
    if (!confirm(`Excluir ${f.name}? Esta ação não pode ser desfeita.`)) return;
    Data.delete(id);
    showToast('Formando excluído', 'error');
    renderAll();
}

// ===================== MODAL: EDITAR/ADICIONAR =====================
let isAddingNew = false;

function openFormModal(id) {
    const overlay = document.getElementById('formandoModalOverlay');
    const f = id ? Data.getById(id) : null;
    isAddingNew = !id;

    document.getElementById('modalBoxTitle').textContent = isAddingNew ? 'Novo Formando' : 'Editar Formando';
    document.getElementById('modalBoxSub').textContent = isAddingNew ? 'Adicione um novo formando' : (f ? f.name : '');
    document.getElementById('editFormandoId').value = id || '';
    document.getElementById('editName').value = f?.name || '';
    document.getElementById('editTurma').value = f?.turma || getCurrentTurma() !== 'todos' ? (turmaMap[currentTab] !== 'todos' ? turmaMap[currentTab] : 'A') : 'A';
    document.getElementById('editMusicTitle').value = f?.musicTitle || '';
    document.getElementById('editMusicArtist').value = f?.musicArtist || '';
    document.getElementById('editMusicLink').value = f?.musicLink || '';
    document.getElementById('editMusicMp3').value = f?.musicMp3 || '';
    document.getElementById('editSnippetStart').value = f?.snippetStart || '';
    document.getElementById('editSnippetEnd').value = f?.snippetEnd || '';
    document.getElementById('editStatus').value = f?.status || 'PENDENTE';
    document.getElementById('editAutoDetBadge').style.display = 'none';

    // Sync mp3 player
    const mp3Wrap = document.getElementById('editMp3PlayerWrap');
    const mp3Player = document.getElementById('editMp3Player');
    if (f?.musicMp3) {
        mp3Player.src = f.musicMp3;
        mp3Wrap.style.display = '';
    } else {
        mp3Wrap.style.display = 'none';
    }

    // Sync cutter fields
    document.getElementById('cutterUrlInput').value = f?.musicLink || '';
    document.getElementById('cutterStart').value = f?.snippetStart || '';
    document.getElementById('cutterEnd').value = f?.snippetEnd || '';

    // Switch to info tab
    switchModalTab('info');

    overlay.classList.add('active');
}

function switchModalTab(tab) {
    document.querySelectorAll('.modal-inner-tab').forEach(t => t.classList.toggle('active', t.dataset.modalTab === tab));
    document.querySelectorAll('.modal-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${tab}`));
}

function initFormModal() {
    const overlay = document.getElementById('formandoModalOverlay');
    const closeModal = () => overlay.classList.remove('active');

    document.getElementById('btnCloseFormModal').addEventListener('click', closeModal);
    document.getElementById('btnCancelFormModal').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    // Inner tabs
    document.querySelectorAll('.modal-inner-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchModalTab(tab.dataset.modalTab);
            if (tab.dataset.modalTab === 'cutter') {
                // Sync URL from info
                const link = document.getElementById('editMusicLink').value.trim();
                if (link) document.getElementById('cutterUrlInput').value = link;
            }
        });
    });

    // Ir para cortador
    document.getElementById('btnEditGoToCutter').addEventListener('click', () => switchModalTab('cutter'));

    // Auto-detect ao sair do campo de link
    document.getElementById('editMusicLink').addEventListener('blur', () => {
        const url = document.getElementById('editMusicLink').value.trim();
        if (url && getYouTubeId(url)) autoDetectInfo(url, 'editAutoDetBadge', 'editMusicTitle', 'editMusicArtist');
    });

    // MP3 preview
    document.getElementById('editMusicMp3').addEventListener('blur', () => {
        const url = document.getElementById('editMusicMp3').value.trim();
        const wrap = document.getElementById('editMp3PlayerWrap');
        const player = document.getElementById('editMp3Player');
        if (url) { player.src = url; wrap.style.display = ''; }
        else { wrap.style.display = 'none'; }
    });

    // Submit
    document.getElementById('formandoEditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editFormandoId').value;
        const fields = {
            name: document.getElementById('editName').value.trim(),
            turma: document.getElementById('editTurma').value,
            musicTitle: document.getElementById('editMusicTitle').value.trim(),
            musicArtist: document.getElementById('editMusicArtist').value.trim(),
            musicLink: document.getElementById('editMusicLink').value.trim(),
            musicMp3: document.getElementById('editMusicMp3').value.trim(),
            snippetStart: document.getElementById('editSnippetStart').value.trim() || document.getElementById('cutterStart').value.trim(),
            snippetEnd: document.getElementById('editSnippetEnd').value.trim() || document.getElementById('cutterEnd').value.trim(),
            status: document.getElementById('editStatus').value,
        };

        if (!fields.name) { showToast('Nome obrigatório!', 'error'); return; }

        if (isAddingNew) {
            Data.add(fields);
            showToast(`${fields.name} adicionado!`);
        } else {
            Data.update(id, { ...fields, updatedAt: new Date().toISOString() });
            showToast(`${fields.name} atualizado!`);
        }

        overlay.classList.remove('active');
        renderAll();
    });
}

// Auto detect
async function autoDetectInfo(url, badgeId, titleId, artistId) {
    const badge = document.getElementById(badgeId);
    if (!badge) return;
    badge.style.display = '';
    badge.textContent = '⏳ Identificando...';

    try {
        const res = await fetch(`/api/youtube-info?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const d = await res.json();
            if (d.song || d.artist) {
                const tEl = document.getElementById(titleId);
                const aEl = document.getElementById(artistId);
                if (d.song && tEl && !tEl.value) tEl.value = d.song;
                if (d.artist && aEl && !aEl.value) aEl.value = d.artist;
                badge.innerHTML = `✨ ${d.song || ''}${d.artist ? ' • ' + d.artist : ''}`;
                return;
            }
        }
    } catch(e) {}

    // noembed fallback
    try {
        const id = getYouTubeId(url);
        const r2 = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
        if (r2.ok) {
            const d2 = await r2.json();
            if (d2.title) {
                const parts = d2.title.split(/ - | – | — /);
                const song = parts.length > 1 ? parts[1].trim() : d2.title.trim();
                const artist = parts.length > 1 ? parts[0].trim() : (d2.author_name || '');
                const tEl = document.getElementById(titleId);
                const aEl = document.getElementById(artistId);
                if (tEl && !tEl.value) tEl.value = song;
                if (aEl && !aEl.value) aEl.value = artist;
                badge.innerHTML = `✨ ${song}${artist ? ' • ' + artist : ''}`;
                return;
            }
        }
    } catch(e) {}

    badge.style.display = 'none';
}

// ===================== CUTTER =====================
let cutterPlayer = null;
let cutterLiveInterval = null;
let cutterSnippetInterval = null;

function initCutter() {
    document.getElementById('btnCutterLoad').addEventListener('click', () => {
        const url = document.getElementById('cutterUrlInput').value.trim();
        const id = getYouTubeId(url);
        if (!id) { showToast('Link inválido!', 'error'); return; }
        loadCutterVideo(id, url);
    });

    document.getElementById('cutterUrlInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('btnCutterLoad').click();
        }
    });

    document.getElementById('btnCutterSearch').addEventListener('click', () => {
        const url = document.getElementById('cutterUrlInput').value.trim();
        const q = url || (document.getElementById('editMusicTitle')?.value + ' ' + document.getElementById('editMusicArtist')?.value);
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
    });

    document.getElementById('btnSetStart').addEventListener('click', () => {
        if (!cutterPlayer) return;
        const t = cutterPlayer.getCurrentTime();
        document.getElementById('cutterStart').value = formatTime(t);
        document.getElementById('previewStart').textContent = formatTime(t);
        updateCutterDuration();
    });

    document.getElementById('btnSetEnd').addEventListener('click', () => {
        if (!cutterPlayer) return;
        const t = cutterPlayer.getCurrentTime();
        document.getElementById('cutterEnd').value = formatTime(t);
        document.getElementById('previewEnd').textContent = formatTime(t);
        updateCutterDuration();
    });

    document.getElementById('btnTestSnippet').addEventListener('click', () => {
        if (!cutterPlayer) return;
        const start = parseTime(document.getElementById('cutterStart').value);
        const end = parseTime(document.getElementById('cutterEnd').value) || start + 30;
        cutterPlayer.seekTo(start, true);
        cutterPlayer.playVideo();
        clearInterval(cutterSnippetInterval);
        cutterSnippetInterval = setInterval(() => {
            if (cutterPlayer && cutterPlayer.getCurrentTime() >= end) {
                cutterPlayer.pauseVideo();
                clearInterval(cutterSnippetInterval);
            }
        }, 100);
    });

    document.getElementById('btnStopSnippet').addEventListener('click', () => {
        if (cutterPlayer) cutterPlayer.pauseVideo();
        clearInterval(cutterSnippetInterval);
    });

    // Sync cutter → info tab
    ['cutterStart','cutterEnd'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const start = document.getElementById('cutterStart').value;
            const end = document.getElementById('cutterEnd').value;
            document.getElementById('editSnippetStart').value = start;
            document.getElementById('editSnippetEnd').value = end;
            updateCutterDuration();
        });
    });
}

function updateCutterDuration() {
    const s = parseTime(document.getElementById('cutterStart').value);
    const e = parseTime(document.getElementById('cutterEnd').value);
    const dur = e > s ? e - s : 0;
    document.getElementById('cutterDurBadge').textContent = `Duração: ${dur}s`;
}

function loadCutterVideo(videoId, url) {
    const ph = document.getElementById('cutterPlaceholder');
    const target = document.getElementById('cutterYtTarget');
    ph.style.display = 'none';
    target.style.display = 'block';

    // Auto-detect info
    autoDetectInfo(url, 'cutterAutoDetBadge', 'editMusicTitle', 'editMusicArtist');
    document.getElementById('editMusicLink').value = url;

    if (cutterPlayer) {
        cutterPlayer.loadVideoById(videoId);
        return;
    }

    cutterPlayer = new YT.Player('cutterYtTarget', {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
        events: {
            onReady: () => {
                clearInterval(cutterLiveInterval);
                cutterLiveInterval = setInterval(() => {
                    if (!cutterPlayer) return;
                    const t = cutterPlayer.getCurrentTime?.() || 0;
                    document.getElementById('cutterLiveTime').textContent = formatTime(t);
                    document.getElementById('previewStart').textContent = formatTime(parseTime(document.getElementById('cutterStart').value));
                    document.getElementById('previewEnd').textContent = formatTime(parseTime(document.getElementById('cutterEnd').value));
                }, 300);
            }
        }
    });
}

// ===================== PLAYER FLUTUANTE =====================
let ytPlayer = null;
let playerInterval = null;
let playerStart = 0;
let playerEnd = 0;

const PlayerManager = {
    play(f) {
        if (!f || !f.musicLink) return;
        const id = getYouTubeId(f.musicLink);
        if (!id) { showToast('Link YouTube inválido', 'error'); return; }

        playerStart = parseTime(f.snippetStart);
        playerEnd = parseTime(f.snippetEnd) || playerStart + 30;

        document.getElementById('playerDockTitle').textContent = f.musicTitle || 'Sem título';
        document.getElementById('playerDockMeta').textContent = `${f.musicArtist || 'Artista'} • ${f.name}`;
        document.getElementById('playerProgressBar').style.width = '0%';
        document.getElementById('playerDock').classList.add('active');

        if (typeof YT !== 'undefined' && YT.loaded) {
            this._setupOrLoad(id);
        } else {
            setTimeout(() => this.play(f), 600);
        }
    },

    _setupOrLoad(id) {
        if (!ytPlayer) {
            ytPlayer = new YT.Player('adminYoutubePlayerTarget', {
                width: '100%', height: '100%', videoId: id,
                playerVars: { autoplay: 1, controls: 0, disablekb: 1, rel: 0, modestbranding: 1 },
                events: {
                    onReady: () => this._loadSnippet(id),
                    onStateChange: ev => this._onStateChange(ev.data)
                }
            });
        } else {
            this._loadSnippet(id);
        }
    },

    _loadSnippet(id) {
        try {
            ytPlayer.cueVideoById({ videoId: id, startSeconds: playerStart });
            setTimeout(() => { ytPlayer.seekTo(playerStart, true); ytPlayer.playVideo(); }, 150);
        } catch(e) {}
    },

    _onStateChange(state) {
        const pi = document.getElementById('playerPlayIcon');
        const pau = document.getElementById('playerPauseIcon');
        if (state === 1) {
            if (pi) pi.style.display = 'none';
            if (pau) pau.style.display = 'block';
            this._startProgress();
        } else {
            if (pi) pi.style.display = 'block';
            if (pau) pau.style.display = 'none';
            this._stopProgress();
        }
    },

    _startProgress() {
        this._stopProgress();
        playerInterval = setInterval(() => {
            if (!ytPlayer?.getCurrentTime) return;
            const cur = ytPlayer.getCurrentTime();
            if (cur >= playerEnd) { this.stop(); return; }
            const pct = Math.min(100, ((cur - playerStart) / (playerEnd - playerStart)) * 100);
            document.getElementById('playerProgressBar').style.width = pct + '%';
        }, 100);
    },

    _stopProgress() {
        if (playerInterval) { clearInterval(playerInterval); playerInterval = null; }
    },

    togglePlayPause() {
        if (!ytPlayer?.getPlayerState) return;
        ytPlayer.getPlayerState() === 1 ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
    },

    stop() {
        this._stopProgress();
        try { ytPlayer?.stopVideo?.(); } catch(e) {}
        document.getElementById('playerDock').classList.remove('active');
    }
};

function initPlayerDock() {
    document.getElementById('playerPlayPauseBtn').addEventListener('click', () => PlayerManager.togglePlayPause());
    document.getElementById('playerCloseBtn').addEventListener('click', () => PlayerManager.stop());
}

// ===================== EXPORTAÇÃO =====================
function initExportModal() {
    const overlay = document.getElementById('exportModalOverlay');
    const closeExport = () => overlay.classList.remove('active');

    document.getElementById('btnExport').addEventListener('click', () => {
        overlay.classList.add('active');
        updateExportPreview();
    });
    document.getElementById('btnCloseExportModal').addEventListener('click', closeExport);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeExport(); });

    ['expFilterTurma','expFilterStatus'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateExportPreview);
    });

    document.getElementById('expTxt').addEventListener('click', () => exportTxt());
    document.getElementById('expCsv').addEventListener('click', () => exportCsv());
    document.getElementById('expWhatsapp').addEventListener('click', () => exportWhatsapp());
    document.getElementById('expPrint').addEventListener('click', () => exportPrint());
    document.getElementById('expJson').addEventListener('click', () => exportJson());
    document.getElementById('importFileInput').addEventListener('change', importJson);
}

function getExportData() {
    const turma = document.getElementById('expFilterTurma').value;
    const status = document.getElementById('expFilterStatus').value;
    let list = turma === 'todos' ? Data.formandos : Data.formandos.filter(f => f.turma === turma);
    if (status !== 'todos') list = list.filter(f => (f.status||'PENDENTE') === status);
    list.sort((a,b) => a.name.localeCompare(b.name));
    return list;
}

function updateExportPreview() {
    const list = getExportData();
    document.getElementById('expPreviewCount').textContent = `${list.length} formandos`;
    const preview = list.map((f,i) =>
        `${i+1}. [${f.turma}] ${f.name}\n   🎵 ${f.musicTitle||'—'} ${f.musicArtist ? '• '+f.musicArtist : ''}\n   Status: ${f.status||'PENDENTE'}`
    ).join('\n\n');
    document.getElementById('expPreviewArea').value = preview || 'Nenhum resultado com esses filtros.';
}

function exportTxt() {
    const list = getExportData();
    const lines = [`MÚSICAS DE FORMATURA 2026 — 3º ANO\n${'='.repeat(50)}\nGerado em: ${new Date().toLocaleString('pt-BR')}\n`];
    ['A','B'].forEach(t => {
        const sub = list.filter(f => f.turma === t);
        if (!sub.length) return;
        lines.push(`\n${'─'.repeat(50)}\n3º ANO ${t} (${sub.length} formandos)\n${'─'.repeat(50)}`);
        sub.forEach((f,i) => {
            lines.push(`\n${i+1}. ${f.name}`);
            lines.push(`   Música:  ${f.musicTitle||'(sem escolha)'}`);
            if (f.musicArtist) lines.push(`   Artista: ${f.musicArtist}`);
            if (f.snippetStart||f.snippetEnd) lines.push(`   Trecho:  ${f.snippetStart||'0:00'} → ${f.snippetEnd||'—'}`);
            if (f.musicLink) lines.push(`   YouTube: ${f.musicLink}`);
            lines.push(`   Status:  ${f.status||'PENDENTE'}`);
        });
    });
    downloadFile('musicas_formatura_2026.txt', lines.join('\n'), 'text/plain');
}

function exportCsv() {
    const list = getExportData();
    const header = 'Nome;Turma;Música;Artista;Início Trecho;Fim Trecho;Link YouTube;Status\n';
    const rows = list.map(f => [
        f.name, f.turma, f.musicTitle||'', f.musicArtist||'',
        f.snippetStart||'', f.snippetEnd||'', f.musicLink||'', f.status||'PENDENTE'
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    downloadFile('musicas_formatura_2026.csv', '\uFEFF' + header + rows, 'text/csv');
}

function exportWhatsapp() {
    const list = getExportData();
    const lines = ['🎓 *Músicas de Formatura 2026 — 3º Ano*\n'];
    ['A','B'].forEach(t => {
        const sub = list.filter(f => f.turma === t);
        if (!sub.length) return;
        lines.push(`\n*📋 Turma ${t}:*`);
        sub.forEach((f,i) => {
            const music = f.musicTitle ? `🎵 ${f.musicTitle}${f.musicArtist ? ' — ' + f.musicArtist : ''}` : '❓ Sem escolha';
            const status = { PENDENTE:'🟡', ESCOLHIDO:'🔵', APROVADO:'🟢' };
            lines.push(`${i+1}. ${f.name}\n   ${music} ${status[f.status]||'🟡'}`);
        });
    });
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => showToast('Copiado para a área de transferência! 📋'));
}

function exportPrint() {
    const list = getExportData();
    const rows = list.map((f,i) => `
        <tr>
            <td>${i+1}</td>
            <td>${escapeHtml(f.name)}</td>
            <td><span class="t${f.turma}">Turma ${f.turma}</span></td>
            <td>${escapeHtml(f.musicTitle||'—')}</td>
            <td>${escapeHtml(f.musicArtist||'—')}</td>
            <td>${f.snippetStart||'—'} → ${f.snippetEnd||'—'}</td>
            <td><span class="s${f.status||'PENDENTE'}">${f.status||'PENDENTE'}</span></td>
        </tr>`).join('');
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Músicas Formatura 2026</title>
<style>
body{font-family:Arial,sans-serif;padding:30px;color:#111;}
h1{margin-bottom:4px;}p.sub{color:#666;margin-bottom:20px;}
table{width:100%;border-collapse:collapse;font-size:12px;}
th{background:#1e3a5f;color:#fff;padding:9px 10px;text-align:left;}
td{padding:8px 10px;border-bottom:1px solid #eee;}
tr:hover{background:#f9f9f9;}
.tA{color:#1D4ED8;}.tB{color:#7C3AED;}
.sPENDENTE{color:#D97706;}.sESCOLHIDO{color:#1D4ED8;}.sAPROVADO{color:#059669;}
@media print{body{padding:0;}}
</style></head><body>
<h1>🎓 Músicas de Formatura 2026 — 3º Ano</h1>
<p class="sub">Gerado em ${new Date().toLocaleString('pt-BR')} · ${list.length} formandos</p>
<table><thead><tr><th>#</th><th>Nome</th><th>Turma</th><th>Música</th><th>Artista</th><th>Trecho</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

function exportJson() {
    const list = getExportData();
    downloadFile('musicas_formatura_2026.json', JSON.stringify(list, null, 2), 'application/json');
}

function importJson(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) { showToast('Formato inválido!', 'error'); return; }
            if (!confirm(`Importar ${data.length} formandos? Os dados atuais serão mesclados.`)) return;
            // Merge (não substitui existentes)
            const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
            data.forEach(f => {
                const exists = Data.formandos.find(x => norm(x.name) === norm(f.name));
                if (!exists) Data.formandos.push({ ...f, id: f.id || Date.now().toString() });
                else Object.assign(exists, { ...f, id: exists.id });
            });
            Data.save();
            renderAll();
            showToast(`${data.length} formandos importados!`);
        } catch(err) { showToast('Erro ao ler arquivo JSON', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function downloadFile(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8;' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ===================== SETTINGS (ALTERAR SENHA) =====================
function initSettings() {
    const overlay = document.getElementById('settingsModalOverlay');
    const closeSettings = () => { overlay.classList.remove('active'); document.getElementById('changePassForm').reset(); };

    document.getElementById('btnSettings').addEventListener('click', () => {
        overlay.classList.add('active');
        document.getElementById('changePassMsg').style.display = 'none';
    });
    document.getElementById('btnCloseSettingsModal').addEventListener('click', closeSettings);
    document.getElementById('btnCancelSettings').addEventListener('click', closeSettings);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSettings(); });

    document.getElementById('changePassForm').addEventListener('submit', async e => {
        e.preventDefault();
        const cur = document.getElementById('curPassInput').value;
        const nw = document.getElementById('newPassInput').value;
        const cf = document.getElementById('confPassInput').value;
        const msgEl = document.getElementById('changePassMsg');

        if (nw !== cf) {
            msgEl.className = 'change-pass-msg error';
            msgEl.textContent = 'As senhas não coincidem!';
            msgEl.style.display = '';
            return;
        }
        if (nw.length < 4) {
            msgEl.className = 'change-pass-msg error';
            msgEl.textContent = 'A senha deve ter pelo menos 4 caracteres!';
            msgEl.style.display = '';
            return;
        }

        const result = await Auth.changePassword(cur, nw);
        if (result.ok) {
            msgEl.className = 'change-pass-msg success';
            msgEl.textContent = '✓ Senha alterada com sucesso!';
            msgEl.style.display = '';
            setTimeout(closeSettings, 1500);
        } else {
            msgEl.className = 'change-pass-msg error';
            msgEl.textContent = result.msg || 'Erro ao alterar senha.';
            msgEl.style.display = '';
        }
    });
}

// ===================== TABS =====================
function initTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderAll();
        });
    });
}

// ===================== CONTROLES =====================
function initControls() {
    document.getElementById('adminSearchInput').addEventListener('input', () => renderGrid());
    document.getElementById('adminFilterStatus').addEventListener('change', () => renderGrid());
    document.getElementById('adminSortOrder').addEventListener('change', () => renderGrid());
    document.getElementById('btnAddFormando').addEventListener('click', () => openFormModal(null));
    document.getElementById('btnLogout').addEventListener('click', () => {
        if (confirm('Sair do painel administrativo?')) Auth.logout();
    });
}

// ===================== LOGIN SCREEN =====================
function initLoginScreen() {
    const toggleBtn = document.getElementById('togglePassBtn');
    const passInput = document.getElementById('adminPassInput');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');

    toggleBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        eyeIcon.style.display = isPass ? 'none' : '';
        eyeOffIcon.style.display = isPass ? '' : 'none';
    });

    document.getElementById('adminLoginForm').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('loginSubmitBtn');
        btn.disabled = true;
        btn.textContent = 'Entrando...';

        const pw = passInput.value;
        const ok = await Auth.login(pw);

        if (ok) {
            await showAdminPanel();
        } else {
            document.getElementById('loginError').style.display = '';
            btn.disabled = false;
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Entrar no Painel`;
        }
    });
}

async function showAdminPanel() {
    document.getElementById('adminLoginScreen').classList.remove('active');
    const panel = document.getElementById('adminPanel');
    panel.style.display = 'flex';
    await Data.load();
    renderAll();
}

// ===================== MAIN =====================
async function init() {
    if (Auth.checkSession()) {
        document.getElementById('adminLoginScreen').style.display = 'none';
        await showAdminPanel();
    } else {
        initLoginScreen();
    }

    initTabs();
    initControls();
    initFormModal();
    initCutter();
    initPlayerDock();
    initExportModal();
    initSettings();
}

document.addEventListener('DOMContentLoaded', init);
