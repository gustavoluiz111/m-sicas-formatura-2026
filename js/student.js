// ============================================================
// student.js — Página pública dos formandos
// ============================================================

const TURMA_A = [
    "Alicia Nicolly da Silva Souza","Ana Beatriz de Araujo Costa","Ana Julia Trindade Coutinho Ferreira",
    "Ana Leticia Barbosa da Silva","Ana Livia da Silva","Annally Carla Santana de Lima",
    "Ayala Maria do Nascimento Alencar","Camila Felipe de Morais","Carlos Emanuel Santos da Silva",
    "Clarice Maria da Silva","Emily Gabrieli Guedes da Silva","Everton Thyago Maurino da Silva",
    "Ewerton de Freitas Pereira Filho","Fabio de Souza Costa Filho","Gabriela Ribeiro de Lima",
    "Genivaldo Marinho de Barros Neto","Gloria Maria de Barros Moura","Heitor Vitor Moura do Nascimento",
    "Heloisa Vitoria dos Santos Pedrosa","Humberto Victor Costa e Silva","Joao Batista do Bomfim Neto",
    "Joao Pedro Morais da Costa","Joicylania Tereza Marinho Chaves","Julia Beatriz de Lima Santana",
    "Julia Vitoria Bezerra de Andrade Chagas","Lavinea Macedo Leleu Ribeiro dos Santos",
    "Maria Clara de Oliveira Santos","Maria Giovanna Dias Mota","Marianne Tavares Silva Lacerda",
    "Marilly Saffiry da Silva Lima","Mateus Ferrari Cavalcanti de Melo","Milena Maria Bezerra",
    "Paulo Jose de Santana Junior","Rachel Germano de Lira e Sousa","Raquel Sthefrany Lopes de Lima Silva",
    "Sabrina Gabrielly de Lima","Samara Beatriz de Araujo Silva","Syllas Miguel do Nascimento Silva",
    "Viviane Beatriz Souza de Melo"
];

const TURMA_B = [
    "Alvaro Nascimento de Araujo Lima","Ana Livia de Figueiredo Oliveira","Anderson Alexsandro da Silva",
    "Arthur Antonio Magalhaes da Silva","Aryane Leticia de Araujo Barboza","Cynthia Gabrielle Oliveira da Cunha Lopes",
    "David Lucas Ferreira Cavalcanti","Deysiany Kariny da Silva Melo","Efigenio Barrozo de Morais Filho",
    "Emanuel de Barros Barbosa","Guilherme Gabriel Barbosa da Cruz Cardoso","Inalda Regina Menezes de Souza",
    "Ivson Luiz Ferreira Cardoso","Joao Gabriel Tavares da Silva","Joao Pedro de Albuquerque Santiago",
    "Jose Thiago Torres Gomes da Silva","Kamila Melo de Farias","Larissa Pereira Ferreira da Silva",
    "Laura Beatriz de Andrade Santana","Laura Mendes da Silva","Luanna Letycia de Lima Coelho",
    "Lucas Araujo Ferreira","Lucas Rozendo dos Santos","Luis Felipe Figueiredo Rocha",
    "Luiz Gustavo Cavalcante de Lira","Luiz Henrique Pedrosa Pereira da Silva","Maria Clara Alves Pereira",
    "Maria Eduarda Ferreira da Silva","Pedro Henrique Vilarim Ribeiro Viana","Rafael Mateus Farias da Silva",
    "Raissa Agra de Alencar Cruz Modesto Duarte","Ruan Vinicius Mendes da Silva",
    "Samyra Cavalcanti do Nascimento Melo","Thayse Milena Santana de Oliveira"
];

// Estado
const State = {
    turma: null,
    student: null,
    formandos: [],
    loaded: false,

    async load() {
        try {
            let res = await fetch('/api/formandos');
            if (!res.ok) res = await fetch('data/formandos.json');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    this.formandos = data;
                    this.loaded = true;
                    return;
                }
            }
        } catch(e) {
            console.warn('Servidor offline, usando localStorage');
        }
        // fallback localStorage
        try {
            const stored = localStorage.getItem('formando_musix_data_v2');
            if (stored) {
                this.formandos = JSON.parse(stored);
                this.loaded = true;
            }
        } catch(e) {}
    },

    getByName(name) {
        const norm = n => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
        return this.formandos.find(f => norm(f.name) === norm(name)) || null;
    },

    getByTurma(turma) {
        return this.formandos.filter(f => f.turma === turma);
    },

    async saveSuggestion(id, fields) {
        const idx = this.formandos.findIndex(f => f.id === id);
        if (idx === -1) return false;
        this.formandos[idx] = { ...this.formandos[idx], ...fields };

        // Salvar no servidor
        try {
            const res = await fetch('/api/formandos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formandos)
            });
            if (res.ok) {
                localStorage.setItem('formando_musix_data_v2', JSON.stringify(this.formandos));
                return true;
            }
        } catch(e) {}
        // Fallback: só salva localmente
        localStorage.setItem('formando_musix_data_v2', JSON.stringify(this.formandos));
        return true;
    }
};

// Utilitários
function getYouTubeId(url) {
    if (!url) return null;
    url = url.trim();
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;
    const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (m && m[2].length === 11) ? m[2] : null;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = msg;
    toast.style.borderColor = type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)';
    toast.style.color = type === 'error' ? '#F87171' : '#34D399';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Navegação entre telas
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active', 'slide-left');
    });
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}

function slideLeft(fromId, toId) {
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);
    if (from) { from.classList.remove('active'); from.classList.add('slide-left'); }
    if (to) { to.classList.add('active'); }
}

// ===================== TELA 1: TURMA =====================

function initTurmaScreen() {
    document.querySelectorAll('.turma-pick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const turma = btn.dataset.turma;
            State.turma = turma;
            initSearchScreen(turma);
            slideLeft('screenTurma', 'screenSearch');
        });
    });
}

// ===================== TELA 2: BUSCA =====================

function initSearchScreen(turma) {
    // Atualiza pill
    const pill = document.getElementById('turmaPill');
    pill.textContent = `3º Ano ${turma}`;
    pill.className = `turma-pill ${turma}`;

    // Carrega lista
    renderStudentList('');

    // Busca ao digitar
    const input = document.getElementById('studentSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    input.value = '';
    input.focus();

    input.oninput = () => {
        clearBtn.style.display = input.value ? '' : 'none';
        renderStudentList(input.value);
    };

    clearBtn.onclick = () => {
        input.value = '';
        clearBtn.style.display = 'none';
        renderStudentList('');
        input.focus();
    };
}

function renderStudentList(query) {
    const list = document.getElementById('studentsList');
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const q = norm(query.trim());

    // Nomes da turma
    const names = State.turma === 'A' ? TURMA_A : TURMA_B;
    const filtered = q ? names.filter(n => norm(n).includes(q)) : names;

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="search-empty">
                <div class="search-empty-icon">🔍</div>
                <p>Nenhum formando encontrado para "<strong>${query}</strong>"</p>
            </div>`;
        return;
    }

    list.innerHTML = filtered.map(name => {
        const f = State.formandos.find(f2 => norm(f2.name) === norm(name)) || { status: 'PENDENTE', musicTitle: '', musicArtist: '' };
        const music = f.musicTitle ? `🎵 ${f.musicTitle}${f.musicArtist ? ' — ' + f.musicArtist : ''}` : 'Sem música escolhida';
        return `
            <button class="student-item" data-name="${escapeHtml(name)}">
                <div class="student-avatar">${getInitials(name)}</div>
                <div class="student-info">
                    <div class="student-name">${highlightMatch(name, query)}</div>
                    <div class="student-music">${escapeHtml(music)}</div>
                </div>
                <div class="student-status-dot ${f.status || 'PENDENTE'}"></div>
            </button>`;
    }).join('');

    list.querySelectorAll('.student-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            openStudentProfile(name);
        });
    });
}

function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const idx = norm(text).indexOf(norm(query));
    if (idx === -1) return escapeHtml(text);
    return escapeHtml(text.substring(0, idx))
        + `<mark style="background:rgba(59,130,246,0.25);color:inherit;border-radius:2px;">${escapeHtml(text.substring(idx, idx+query.length))}</mark>`
        + escapeHtml(text.substring(idx + query.length));
}

function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===================== TELA 3: PERFIL =====================

function openStudentProfile(name) {
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const f = State.formandos.find(f2 => norm(f2.name) === norm(name)) || {
        name, turma: State.turma, status: 'PENDENTE',
        musicTitle: '', musicArtist: '', musicLink: '', snippetStart: '', snippetEnd: ''
    };
    State.student = f;

    // Avatar e nome
    document.getElementById('profileAvatar').textContent = getInitials(name);
    document.getElementById('profileName').textContent = name;

    // Turma pill
    const pill = document.getElementById('profileTurmaPill');
    pill.textContent = `3º Ano ${f.turma || State.turma}`;
    pill.className = `profile-turma-pill ${f.turma || State.turma}`;

    // Status badge
    const badge = document.getElementById('profileStatusBadge');
    const statusLabels = { PENDENTE: 'Pendente', ESCOLHIDO: 'Aguardando Aprovação', APROVADO: 'Aprovado ✓' };
    badge.className = `profile-status-badge ${f.status || 'PENDENTE'}`;
    badge.innerHTML = `<span class="status-dot"></span><span class="status-text">${statusLabels[f.status] || 'Pendente'}</span>`;

    // Música escolhida ou não
    const chosenCard = document.getElementById('musicChosenCard');
    const noMusicCard = document.getElementById('noMusicCard');
    if (f.musicTitle) {
        chosenCard.style.display = '';
        noMusicCard.style.display = 'none';
        document.getElementById('chosenMusicTitle').textContent = f.musicTitle;
        document.getElementById('chosenMusicArtist').textContent = f.musicArtist || '—';

        const snippetEl = document.getElementById('chosenSnippet');
        if (f.snippetStart || f.snippetEnd) {
            snippetEl.style.display = '';
            document.getElementById('chosenSnippetText').textContent = `${f.snippetStart || '0:00'} → ${f.snippetEnd || '—'}`;
        } else {
            snippetEl.style.display = 'none';
        }

        const ytLink = document.getElementById('chosenYtLink');
        if (f.musicLink && getYouTubeId(f.musicLink)) {
            ytLink.href = f.musicLink;
            ytLink.style.display = '';
        } else {
            ytLink.style.display = 'none';
        }
    } else {
        chosenCard.style.display = 'none';
        noMusicCard.style.display = '';
    }

    // Pré-preenche formulário com dados existentes
    document.getElementById('sugMusicLink').value = f.musicLink || '';
    document.getElementById('sugMusicTitle').value = f.musicTitle || '';
    document.getElementById('sugMusicArtist').value = f.musicArtist || '';
    document.getElementById('sugSnippetStart').value = f.snippetStart || '';
    document.getElementById('sugSnippetEnd').value = f.snippetEnd || '';
    document.getElementById('sugFeedback').style.display = 'none';
    document.getElementById('autoDetectInfo').style.display = 'none';

    slideLeft('screenSearch', 'screenProfile');
}

// ===================== FORMULÁRIO DE SUGESTÃO =====================

function initSuggestionForm() {
    // Detectar música automaticamente
    document.getElementById('btnDetectSong').addEventListener('click', async () => {
        const url = document.getElementById('sugMusicLink').value.trim();
        if (!url) { showToast('Cole o link do YouTube primeiro!', 'error'); return; }
        const id = getYouTubeId(url);
        if (!id) { showToast('Link do YouTube inválido.', 'error'); return; }

        const infoEl = document.getElementById('autoDetectInfo');
        infoEl.style.display = '';
        infoEl.textContent = '⏳ Identificando música...';

        try {
            const res = await fetch(`/api/youtube-info?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.song || data.artist) {
                    if (data.song) document.getElementById('sugMusicTitle').value = data.song;
                    if (data.artist) document.getElementById('sugMusicArtist').value = data.artist;
                    infoEl.innerHTML = `✨ Detectado: <strong>${data.song || '—'}</strong>${data.artist ? ' • ' + data.artist : ''}`;
                    return;
                }
            }
        } catch(e) {}

        // Fallback noembed
        try {
            const r2 = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
            if (r2.ok) {
                const d2 = await r2.json();
                if (d2.title) {
                    const parts = d2.title.split(/ - | – | — /);
                    const song = parts.length > 1 ? parts[1].trim() : d2.title.trim();
                    const artist = parts.length > 1 ? parts[0].trim() : (d2.author_name || '');
                    document.getElementById('sugMusicTitle').value = song;
                    document.getElementById('sugMusicArtist').value = artist;
                    infoEl.innerHTML = `✨ Detectado: <strong>${song}</strong>${artist ? ' • ' + artist : ''}`;
                    return;
                }
            }
        } catch(e) {}

        infoEl.textContent = '⚠ Não foi possível detectar automaticamente. Preencha manualmente.';
    });

    // Submit
    document.getElementById('suggestionForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('sugMusicTitle').value.trim();
        const link = document.getElementById('sugMusicLink').value.trim();

        if (!title) { showToast('Informe o nome da música!', 'error'); return; }

        const feedback = document.getElementById('sugFeedback');
        feedback.className = 'sug-feedback';
        feedback.style.display = '';
        feedback.textContent = '⏳ Enviando sugestão...';

        const fields = {
            musicLink: link,
            musicTitle: title,
            musicArtist: document.getElementById('sugMusicArtist').value.trim(),
            snippetStart: document.getElementById('sugSnippetStart').value.trim(),
            snippetEnd: document.getElementById('sugSnippetEnd').value.trim(),
            status: 'ESCOLHIDO',
            updatedAt: new Date().toISOString()
        };

        // Se não tem ID, procura pelos dados
        if (!State.student || !State.student.id) {
            feedback.textContent = '⚠ Erro: formando não identificado. Volte e tente novamente.';
            feedback.classList.add('error');
            return;
        }

        const ok = await State.saveSuggestion(State.student.id, fields);

        if (ok) {
            feedback.textContent = '✅ Sugestão enviada com sucesso! Aguarde a avaliação da comissão.';
            feedback.classList.add('success');
            showToast('Sugestão enviada! ✓');
            // Atualiza a tela
            const updated = { ...State.student, ...fields };
            State.student = updated;
            openStudentProfile(updated.name);
        } else {
            feedback.textContent = '❌ Erro ao enviar. Tente novamente.';
            feedback.classList.add('error');
        }
    });
}

// ===================== BACK BUTTONS =====================

function initBackButtons() {
    document.getElementById('btnBackToTurma').addEventListener('click', () => {
        slideLeft('screenSearch', 'screenTurma');
        document.getElementById('screenTurma').classList.remove('slide-left');
        document.getElementById('screenTurma').classList.add('active');
        document.getElementById('screenSearch').classList.remove('active');
    });

    document.getElementById('btnBackToSearch').addEventListener('click', () => {
        slideLeft('screenProfile', 'screenSearch');
        document.getElementById('screenSearch').classList.remove('slide-left');
        document.getElementById('screenSearch').classList.add('active');
        document.getElementById('screenProfile').classList.remove('active');
    });
}

// ===================== INIT =====================

async function init() {
    // Atualiza contagem nas turmas
    document.getElementById('countA').textContent = `${TURMA_A.length} formandos`;
    document.getElementById('countB').textContent = `${TURMA_B.length} formandos`;

    await State.load();

    initTurmaScreen();
    initSuggestionForm();
    initBackButtons();
}

document.addEventListener('DOMContentLoaded', init);
