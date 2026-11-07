// ==========================================================
// JS ADMIN - COM ABAS: TODOS (DEFAULT) E PEDIDOS NOVOS (SEM EMOJIS)
// ==========================================================

const Auth = {
    tokenKey: 'formando_musix_admin_token',
    localPassKey: 'formando_musix_admin_local_pw',
    defaultHash: 'f25ad90715f74930e74f0d65f3381abadca48c52decad495733065b43dbd6df0',
    failedAttemptsKey: 'admin_failed_attempts',
    lockoutUntilKey: 'admin_lockout_until',
    isAuthenticated: false,

    async hash(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    },

    checkLockout() {
        const lockout = localStorage.getItem(this.lockoutUntilKey);
        if (lockout) {
            const remaining = parseInt(lockout, 10) - Date.now();
            if (remaining > 0) {
                const mins = Math.ceil(remaining / 60000);
                return `Painel bloqueado por tentativas excessivas. Tente novamente em ${mins} minuto(s).`;
            } else {
                localStorage.removeItem(this.lockoutUntilKey);
                localStorage.removeItem(this.failedAttemptsKey);
            }
        }
        return null;
    },

    registerFailedAttempt() {
        let attempts = parseInt(localStorage.getItem(this.failedAttemptsKey) || '0', 10) + 1;
        localStorage.setItem(this.failedAttemptsKey, attempts.toString());
        if (attempts >= 5) {
            // Bloqueio de 15 minutos após 5 erros
            const lockUntil = Date.now() + (15 * 60 * 1000);
            localStorage.setItem(this.lockoutUntilKey, lockUntil.toString());
            return 'Muitas tentativas incorretas. Painel bloqueado por 15 minutos.';
        }
        return `Senha incorreta. Tentativa ${attempts} de 5.`;
    },

    resetFailedAttempts() {
        localStorage.removeItem(this.failedAttemptsKey);
        localStorage.removeItem(this.lockoutUntilKey);
    },

    checkSession() {
        const token = sessionStorage.getItem(this.tokenKey);
        const validHash = localStorage.getItem(this.localPassKey) || this.defaultHash;
        if (token && token === validHash) {
            this.isAuthenticated = true;
        } else {
            sessionStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.tokenKey);
            this.isAuthenticated = false;
        }
        return this.isAuthenticated;
    },

    async login(password) {
        const lockMsg = this.checkLockout();
        if (lockMsg) {
            return { ok: false, msg: lockMsg };
        }

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
                    this.isAuthenticated = true;
                    this.resetFailedAttempts();
                    return { ok: true };
                }
            }
        } catch(e) {}

        const entered = await this.hash(password);
        const stored = localStorage.getItem(this.localPassKey) || this.defaultHash;
        if (entered === stored) {
            sessionStorage.setItem(this.tokenKey, entered);
            this.isAuthenticated = true;
            this.resetFailedAttempts();
            return { ok: true };
        }

        const failMsg = this.registerFailedAttempt();
        return { ok: false, msg: failMsg };
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
                    return { ok: true };
                }
                return { ok: false, msg: d.message };
            }
        } catch(e) {}

        const curHash = await this.hash(currentPw);
        const stored = localStorage.getItem(this.localPassKey) || this.defaultHash;
        if (curHash !== stored) return { ok: false, msg: 'Senha atual incorreta.' };
        const newHash = await this.hash(newPw);
        localStorage.setItem(this.localPassKey, newHash);
        sessionStorage.setItem(this.tokenKey, newHash);
        return { ok: true };
    },

    logout() {
        sessionStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.tokenKey);
        window.location.reload();
    }
};

const Data = {
    formandos: [],

    async load() {
        try {
            const res = await fetch(`/api/formandos?t=${Date.now()}`);
            if (res.ok) {
                this.formandos = await res.json();
                return;
            }
        } catch(e) {}

        try {
            const res2 = await fetch(`data/formandos.json?t=${Date.now()}`);
            if (res2.ok) this.formandos = await res2.json();
        } catch(e) {}
    },

    async save() {
        localStorage.setItem('formando_musix_data_v2', JSON.stringify(this.formandos));
        try {
            await fetch('/api/formandos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formandos)
            });
        } catch(e) {}
    },

    add(obj) {
        obj.id = 'aluno_' + Date.now();
        obj.createdAt = new Date().toISOString();
        this.formandos.push(obj);
        this.save();
    },

    update(id, fields) {
        const i = this.formandos.findIndex(f => f.id === id);
        if (i !== -1) {
            this.formandos[i] = { ...this.formandos[i], ...fields };
            this.save();
        }
    },

    delete(id) {
        const i = this.formandos.findIndex(f => f.id === id);
        if (i !== -1) {
            this.formandos.splice(i, 1);
            this.save();
        }
    },

    getById(id) {
        return this.formandos.find(f => f.id === id) || null;
    }
};

// Aba ativa inicial: 'todos'
let currentTab = 'todos';

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function getYouTubeId(url) {
    if (!url) return null;
    const match = url.trim().match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Renderizar Painel
function renderAll() {
    renderStats();
    renderGrid();
}

function renderStats() {
    const list = Data.formandos;
    const aprovados = list.filter(f => f.status === 'APROVADO').length;
    const novos = list.filter(f => f.status === 'ESCOLHIDO').length;
    const pendentes = list.filter(f => !f.status || f.status === 'PENDENTE').length;

    document.getElementById('statTotal').textContent = list.length;
    document.getElementById('statAprovadas').textContent = aprovados;
    document.getElementById('statEscolhidas').textContent = novos;
    document.getElementById('statPendentes').textContent = pendentes;

    // Badges das abas
    document.getElementById('badgeTodos').textContent = list.length;
    document.getElementById('badgePedidosNovos').textContent = novos;
    document.getElementById('badgeA').textContent = list.filter(f => f.turma === 'A').length;
    document.getElementById('badgeB').textContent = list.filter(f => f.turma === 'B').length;
}

function renderGrid() {
    const grid = document.getElementById('adminGrid');
    const search = (document.getElementById('adminSearchInput')?.value || '').toLowerCase().trim();
    const filterStatus = document.getElementById('adminFilterStatus')?.value || 'todos';
    const sort = document.getElementById('adminSortOrder')?.value || 'nome-asc';

    let list = [...Data.formandos];

    // Filtro por Aba
    if (currentTab === 'pedidosNovos') {
        list = list.filter(f => f.status === 'ESCOLHIDO');
    } else if (currentTab === 'turmaA') {
        list = list.filter(f => f.turma === 'A');
    } else if (currentTab === 'turmaB') {
        list = list.filter(f => f.turma === 'B');
    }
    // se currentTab === 'todos', mantém todos os formandos

    // Filtro por Status Select
    if (filterStatus !== 'todos') {
        list = list.filter(f => (f.status || 'PENDENTE') === filterStatus);
    }

    // Filtro por Busca
    if (search) {
        list = list.filter(f => 
            (f.name || '').toLowerCase().includes(search) ||
            (f.musicTitle || '').toLowerCase().includes(search) ||
            (f.musicArtist || '').toLowerCase().includes(search)
        );
    }

    // Ordenação
    if (sort === 'nome-asc') list.sort((a,b) => a.name.localeCompare(b.name));
    else if (sort === 'nome-desc') list.sort((a,b) => b.name.localeCompare(a.name));
    else if (sort === 'recente') list.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));

    if (list.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#7E8DA6;">Nenhum formando encontrado com esses filtros.</div>`;
        return;
    }

    grid.innerHTML = list.map(f => {
        const status = f.status || 'PENDENTE';
        const badgeStatusClass = status === 'APROVADO' ? 'badge-status-aprovado' : (status === 'ESCOLHIDO' ? 'badge-status-escolhido' : 'badge-status-pendente');
        const statusLabel = status === 'APROVADO' ? 'Aprovado' : (status === 'ESCOLHIDO' ? 'Pedido Novo' : 'Pendente');
        const hasMusic = Boolean(f.musicTitle);

        return `
            <div class="admin-card">
                <div>
                    <div class="admin-card-header">
                        <div>
                            <div class="admin-card-name">${f.name}</div>
                            <div class="admin-card-badges">
                                <span class="admin-badge ${f.turma === 'A' ? 'badge-turma-a' : 'badge-turma-b'}">3º Ano ${f.turma}</span>
                                <span class="admin-badge ${badgeStatusClass}">${statusLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div class="admin-card-music" style="margin-top:14px;">
                        ${hasMusic ? `
                            <div class="admin-music-title">Música: ${f.musicTitle}</div>
                            <div class="admin-music-artist">Artista: ${f.musicArtist || 'Não informado'}</div>
                            <div class="admin-music-snippet">
                                <span>Trecho: ${f.snippetStart || '0:00'} a ${f.snippetEnd || '0:45'} (45s)</span>
                                ${f.musicLink ? `<a href="${f.musicLink}" target="_blank" style="color:var(--gold-main); text-decoration:none;">Ver no YouTube</a>` : ''}
                            </div>
                        ` : `<div style="color:#7E8DA6; font-size:0.85rem; font-style:italic;">Nenhuma música escolhida.</div>`}
                    </div>
                </div>

                <div class="admin-card-actions">
                    ${status === 'ESCOLHIDO' ? `
                        <button class="card-action-btn btn-approve" onclick="aprovarMusica('${f.id}')">Aprovar Pedido</button>
                    ` : ''}
                    <button class="card-action-btn" onclick="editarFormando('${f.id}')">Editar</button>
                    <button class="card-action-btn btn-delete" onclick="excluirFormando('${f.id}')" title="Excluir">✕</button>
                </div>
            </div>
        `;
    }).join('');
}

// Ações Rápidas
window.aprovarMusica = function(id) {
    Data.update(id, { status: 'APROVADO' });
    renderAll();
    showToast('Música aprovada com sucesso!');
};

window.excluirFormando = function(id) {
    const f = Data.getById(id);
    if (!f) return;
    if (confirm(`Excluir ${f.name}?`)) {
        Data.delete(id);
        renderAll();
        showToast('Formando excluído.');
    }
};

window.editarFormando = function(id) {
    const f = id ? Data.getById(id) : null;
    // Inicializa campos
    document.getElementById('editFormandoId').value = id || '';
    document.getElementById('editName').value = f?.name || '';
    document.getElementById('editTurma').value = f?.turma || 'A';
    document.getElementById('editMusicTitle').value = f?.musicTitle || '';
    document.getElementById('editMusicArtist').value = f?.musicArtist || '';
    document.getElementById('editMusicLink').value = f?.musicLink || '';
    document.getElementById('editSnippetStart').value = f?.snippetStart || '0:00';
    document.getElementById('editSnippetEnd').value = f?.snippetEnd || '0:45';
    document.getElementById('editStatus').value = f?.status || 'PENDENTE';

    const resEl = document.getElementById('editDetectResult');
    if (resEl) resEl.textContent = '';

    const playerArea = document.getElementById('adminModalPlayerArea');
    if (f?.musicLink && getYouTubeId(f.musicLink)) {
        playerArea.style.display = 'block';
        playerArea.innerHTML = `<iframe style="width:100%; height:260px; border-radius:10px; border:none;" src="https://www.youtube.com/embed/${getYouTubeId(f.musicLink)}" allowfullscreen></iframe>`;
    } else {
        playerArea.style.display = 'none';
        playerArea.innerHTML = '';
    }

    document.getElementById('formandoModalOverlay').classList.add('active');
};

// Exportação (TXT, CSV, WhatsApp, Impressão)
function exportar(tipo) {
    const list = [...Data.formandos].sort((a,b) => a.name.localeCompare(b.name));

    if (tipo === 'txt') {
        const txt = list.map((f, i) => `${i+1}. [3º ${f.turma}] ${f.name}\n   Música: ${f.musicTitle || 'Sem escolha'} - ${f.musicArtist || ''}\n   Trecho: ${f.snippetStart || '0:00'} a ${f.snippetEnd || '0:45'} (45s)\n   Status: ${f.status || 'PENDENTE'}\n`).join('\n');
        baixarArquivo('formandos_musicas_2026.txt', txt, 'text/plain');
    } else if (tipo === 'csv') {
        const header = 'Nome;Turma;Musica;Artista;Inicio;Fim;Status;YouTube\n';
        const rows = list.map(f => `"${f.name}";"${f.turma}";"${f.musicTitle||''}";"${f.musicArtist||''}";"${f.snippetStart||''}";"${f.snippetEnd||''}";"${f.status||'PENDENTE'}";"${f.musicLink||''}"`).join('\n');
        baixarArquivo('formandos_musicas_2026.csv', '\uFEFF' + header + rows, 'text/csv');
    } else if (tipo === 'whatsapp') {
        const txt = list.map((f, i) => `${i+1}. *${f.name}* (3º ${f.turma})\n   ${f.musicTitle ? `Música: ${f.musicTitle} - ${f.musicArtist}` : 'Sem música'} [${f.status||'PENDENTE'}]`).join('\n\n');
        navigator.clipboard.writeText(txt).then(() => showToast('Lista copiada para o WhatsApp!'));
    } else if (tipo === 'print') {
        window.print();
    }
}

function baixarArquivo(nome, conteudo, tipo) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo + ';charset=utf-8;' }));
    a.download = nome;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Download iniciado!');
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    if (Auth.checkSession()) {
        document.getElementById('adminLoginScreen').classList.remove('active');
        document.getElementById('adminPanel').style.display = 'block';
        await Data.load();
        renderAll();
    } else {
        document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const pw = document.getElementById('adminPassInput').value;
            const res = await Auth.login(pw);
            const errEl = document.getElementById('loginError');

            if (res.ok) {
                document.getElementById('adminLoginScreen').classList.remove('active');
                document.getElementById('adminPanel').style.display = 'block';
                await Data.load();
                renderAll();
            } else {
                errEl.textContent = res.msg || 'Senha incorreta. Tente novamente.';
                errEl.style.display = 'block';
            }
        });

        document.getElementById('togglePassBtn').addEventListener('click', () => {
            const inp = document.getElementById('adminPassInput');
            inp.type = inp.type === 'password' ? 'text' : 'password';
        });
    }

    // Abas: Todos (Default), Pedidos Novos, Turma A, Turma B
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderGrid();
        });
    });

    // Controles de Busca e Filtro
    document.getElementById('adminSearchInput').addEventListener('input', renderGrid);
    document.getElementById('adminFilterStatus').addEventListener('change', renderGrid);
    document.getElementById('adminSortOrder').addEventListener('change', renderGrid);

    // Botão Novo Formando
    document.getElementById('btnAddFormando').addEventListener('click', () => editarFormando(null));

    // Botão Carregar no Player e Detectar no Modal Admin
    const detectarYtAdmin = async () => {
        const url = document.getElementById('editMusicLink').value.trim();
        const resEl = document.getElementById('editDetectResult');
        if (!url) return;

        if (resEl) resEl.textContent = 'Detectando título e cantor...';

        try {
            const res = await fetch(`/api/youtube-info?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.song) document.getElementById('editMusicTitle').value = data.song;
                if (data.artist) document.getElementById('editMusicArtist').value = data.artist;
                if (resEl) resEl.textContent = `Identificado: ${data.song || ''} ${data.artist ? '• ' + data.artist : ''}`;
                return;
            }
        } catch (e) {}

        const vidId = getYouTubeId(url);
        if (vidId) {
            try {
                const r2 = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vidId}`);
                if (r2.ok) {
                    const d2 = await r2.json();
                    if (d2.title) {
                        const parts = d2.title.split(/ - | – | — /);
                        document.getElementById('editMusicTitle').value = parts.length > 1 ? parts[1].trim() : d2.title;
                        document.getElementById('editMusicArtist').value = parts.length > 1 ? parts[0].trim() : (d2.author_name || '');
                        if (resEl) resEl.textContent = 'Identificado com sucesso!';
                        return;
                    }
                }
            } catch(err) {}
        }
        if (resEl) resEl.textContent = 'Link carregado. Preencha ou confirme os campos abaixo.';
    };

    document.getElementById('btnEditDetectar')?.addEventListener('click', detectarYtAdmin);
    document.getElementById('editMusicLink')?.addEventListener('change', detectarYtAdmin);

    document.getElementById('btnEditLoadYt')?.addEventListener('click', () => {
        const url = document.getElementById('editMusicLink').value.trim();
        const vidId = getYouTubeId(url);
        if (!vidId) {
            alert('Cole um link válido do YouTube primeiro.');
            return;
        }
        detectarYtAdmin();
        const playerArea = document.getElementById('adminModalPlayerArea');
        playerArea.style.display = 'block';
        playerArea.innerHTML = `<iframe style="width:100%; height:260px; border-radius:10px; border:none;" src="https://www.youtube.com/embed/${vidId}?autoplay=1" allow="autoplay" allowfullscreen></iframe>`;
    });

    // Fechar Modais
    document.getElementById('btnCloseFormModal').addEventListener('click', () => document.getElementById('formandoModalOverlay').classList.remove('active'));
    document.getElementById('btnCancelFormModal').addEventListener('click', () => document.getElementById('formandoModalOverlay').classList.remove('active'));

    // Salvar Formando no Modal
    document.getElementById('formandoEditForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('editFormandoId').value;
        const dados = {
            name: document.getElementById('editName').value.trim(),
            turma: document.getElementById('editTurma').value,
            musicTitle: document.getElementById('editMusicTitle').value.trim(),
            musicArtist: document.getElementById('editMusicArtist').value.trim(),
            musicLink: document.getElementById('editMusicLink').value.trim(),
            snippetStart: document.getElementById('editSnippetStart').value.trim() || '0:00',
            snippetEnd: document.getElementById('editSnippetEnd').value.trim() || '0:45',
            status: document.getElementById('editStatus').value
        };

        if (id) {
            Data.update(id, dados);
            showToast('Formando atualizado com sucesso!');
        } else {
            Data.add(dados);
            showToast('Formando adicionado com sucesso!');
        }

        document.getElementById('formandoModalOverlay').classList.remove('active');
        renderAll();
    });

    // Exportação
    document.getElementById('btnExport').addEventListener('click', () => document.getElementById('exportModalOverlay').classList.add('active'));
    document.getElementById('btnCloseExportModal').addEventListener('click', () => document.getElementById('exportModalOverlay').classList.remove('active'));
    document.getElementById('expTxt').addEventListener('click', () => exportar('txt'));
    document.getElementById('expCsv').addEventListener('click', () => exportar('csv'));
    document.getElementById('expWhatsapp').addEventListener('click', () => exportar('whatsapp'));
    document.getElementById('expPrint').addEventListener('click', () => exportar('print'));

    // Configurações
    document.getElementById('btnSettings').addEventListener('click', () => document.getElementById('settingsModalOverlay').classList.add('active'));
    document.getElementById('btnCloseSettingsModal').addEventListener('click', () => document.getElementById('settingsModalOverlay').classList.remove('active'));
    document.getElementById('btnCancelSettings').addEventListener('click', () => document.getElementById('settingsModalOverlay').classList.remove('active'));
    document.getElementById('changePassForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const cur = document.getElementById('curPassInput').value;
        const nw = document.getElementById('newPassInput').value;
        const conf = document.getElementById('confPassInput').value;
        const msg = document.getElementById('changePassMsg');

        if (nw !== conf) {
            msg.textContent = 'Senhas não coincidem.';
            msg.style.display = 'block';
            return;
        }

        const res = await Auth.changePassword(cur, nw);
        if (res.ok) {
            msg.textContent = 'Senha alterada com sucesso!';
            msg.style.display = 'block';
            setTimeout(() => document.getElementById('settingsModalOverlay').classList.remove('active'), 1500);
        } else {
            msg.textContent = res.msg || 'Erro ao alterar.';
            msg.style.display = 'block';
        }
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
        if (confirm('Deseja sair do painel?')) Auth.logout();
    });

    // Fechar Player Dock
    document.getElementById('playerCloseBtn').addEventListener('click', () => document.getElementById('playerDock').classList.remove('active'));
});
