// ============================================================
// student.js — Lógica Oficial Editorial / Fullscreen
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

const AppState = {
    selectedTurma: null,
    currentStudent: null,
    formandos: [],

    async init() {
        await this.loadData();
        this.renderStats();
    },

    async loadData() {
        try {
            // Adiciona timestamp para não pegar cache do navegador
            const res = await fetch(`/api/formandos?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    this.formandos = data;
                    return;
                }
            }
        } catch (e) {
            console.warn("API offline, carregando fallback estático...");
        }

        try {
            const resStatic = await fetch(`data/formandos.json?t=${Date.now()}`);
            if (resStatic.ok) {
                const data = await resStatic.json();
                this.formandos = data;
            }
        } catch (e) {}
    },

    normalize(str) {
        return (str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    },

    getStudentsOfTurma(turma) {
        const norm = this.normalize;
        const validList = turma === 'A' ? TURMA_A : TURMA_B;

        return validList.map(name => {
            const existing = this.formandos.find(f => norm(f.name) === norm(name) && f.turma === turma);
            if (existing) return existing;
            return {
                id: `seed_${turma}_${norm(name).replace(/\s+/g, '_')}`,
                name: name,
                turma: turma,
                musicTitle: '',
                musicArtist: '',
                musicLink: '',
                snippetStart: '',
                snippetEnd: '',
                status: 'PENDENTE'
            };
        });
    },

    async saveStudent(studentData) {
        const norm = this.normalize;
        const idx = this.formandos.findIndex(f => norm(f.name) === norm(studentData.name) && f.turma === studentData.turma);

        if (idx !== -1) {
            this.formandos[idx] = { ...this.formandos[idx], ...studentData };
        } else {
            this.formandos.push(studentData);
        }

        // Tenta salvar via POST no servidor
        try {
            const res = await fetch('/api/formandos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formandos)
            });
            if (res.ok) return true;
        } catch (e) {}

        // Salva no LocalStorage como redundância
        localStorage.setItem('formando_musix_data_v2', JSON.stringify(this.formandos));
        return true;
    }
};

// ==============================================================
// HELPERS
// ==============================================================
function getInitials(name) {
    if (!name) return 'FM';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getYouTubeId(url) {
    if (!url) return null;
    url = url.trim();
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function showToast(msg) {
    const t = document.getElementById('toastMessage');
    const txt = document.getElementById('toastText');
    if (!t || !txt) return;
    txt.textContent = msg;
    t.classList.add('show');
    setTimeout(() => {
        t.classList.remove('show');
    }, 3500);
}

// ==============================================================
// NAVEGAÇÃO ENTRE ETAPAS
// ==============================================================
function switchStage(stageName) {
    document.querySelectorAll('.stage-section').forEach(s => s.classList.remove('active'));

    if (stageName === 'turma') {
        document.getElementById('stepTurma').classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (stageName === 'list') {
        document.getElementById('stepList').classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ==============================================================
// RENDERIZAÇÃO DA TABELA / LISTA DE ALUNOS
// ==============================================================
function renderStudentsList(query = '') {
    const listEl = document.getElementById('studentsScrollList');
    if (!listEl) return;

    const turma = AppState.selectedTurma;
    let students = AppState.getStudentsOfTurma(turma);

    if (query.trim()) {
        const qNorm = AppState.normalize(query);
        students = students.filter(s => 
            AppState.normalize(s.name).includes(qNorm) || 
            AppState.normalize(s.musicTitle || '').includes(qNorm) ||
            AppState.normalize(s.musicArtist || '').includes(qNorm)
        );
    }

    // Atualiza Sidebar Stats
    const total = students.length;
    const aprovadas = students.filter(s => s.status === 'APROVADO').length;
    const pendentes = students.filter(s => !s.status || s.status === 'PENDENTE').length;

    document.getElementById('sideStatTotal').textContent = total;
    document.getElementById('sideStatAprovados').textContent = aprovadas;
    document.getElementById('sideStatPendentes').textContent = pendentes;

    if (students.length === 0) {
        listEl.innerHTML = `
            <div style="padding: 60px 20px; text-align: center; color: var(--text-muted); font-family: var(--font-space);">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
                <h3>Nenhum formando encontrado</h3>
                <p style="margin-top: 6px; font-size: 0.9rem;">Verifique a grafia do nome digitado.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = students.map(s => {
        const initials = getInitials(s.name);
        const hasSong = Boolean(s.musicTitle && s.musicTitle.trim());
        const status = s.status || 'PENDENTE';
        
        const statusLabels = {
            'PENDENTE': 'PENDENTE',
            'ESCOLHIDO': 'AGUARDANDO',
            'APROVADO': 'APROVADO'
        };

        return `
            <div class="student-row-card" data-student-name="${encodeURIComponent(s.name)}">
                <div class="student-cell-name">
                    <div class="student-initials">${initials}</div>
                    <div class="student-full-name">${s.name}</div>
                </div>

                <div class="student-cell-song">
                    ${hasSong ? `
                        <div class="song-main-txt">
                            <span>🎵</span>
                            <span>${s.musicTitle}</span>
                        </div>
                        <div class="song-artist-txt">${s.musicArtist || 'Artista não informado'}</div>
                    ` : `
                        <span class="song-empty-txt">Nenhuma música escolhida</span>
                    `}
                </div>

                <div class="student-cell-status">
                    <span class="status-pill-badge ${status}">
                        <span class="badge-dot"></span>
                        <span>${statusLabels[status] || status}</span>
                    </span>
                </div>

                <div class="student-cell-action">
                    <button class="btn-open-detail">
                        ${hasSong ? 'VER DETALHES ↗' : 'ESCOLHER MÚSICA ↗'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Adiciona listener para abrir drawer
    listEl.querySelectorAll('.student-row-card').forEach(card => {
        card.addEventListener('click', () => {
            const name = decodeURIComponent(card.dataset.studentName);
            const student = students.find(s => s.name === name);
            if (student) openStudentDrawer(student);
        });
    });
}

// ==============================================================
// GESTÃO DO DRAWER / MODAL
// ==============================================================
function openStudentDrawer(student) {
    AppState.currentStudent = student;

    // Atualiza cabeçalho do drawer
    document.getElementById('drawerAvatar').textContent = getInitials(student.name);
    document.getElementById('drawerUserName').textContent = student.name;
    document.getElementById('drawerTurmaBadge').textContent = `3º ANO ${student.turma}`;

    // Atualiza status banner
    const status = student.status || 'PENDENTE';
    const statusDot = document.querySelector('.status-indicator-dot');
    const statusHeading = document.getElementById('drawerStatusTitle');
    const statusSub = document.getElementById('drawerStatusSub');
    const statusPill = document.getElementById('drawerStatusPill');

    if (status === 'APROVADO') {
        statusDot.style.background = 'var(--brand-emerald)';
        statusDot.style.boxShadow = '0 0 10px var(--brand-emerald)';
        statusHeading.textContent = 'MÚSICA APROVADA';
        statusSub.textContent = 'Faixa confirmada para o momento de entrada';
        statusPill.textContent = 'CONFIRMADA 🟢';
        statusPill.style.color = '#34d399';
    } else if (status === 'ESCOLHIDO') {
        statusDot.style.background = 'var(--brand-blue)';
        statusDot.style.boxShadow = '0 0 10px var(--brand-blue)';
        statusHeading.textContent = 'EM ANÁLISE';
        statusSub.textContent = 'Sugestão enviada, aguardando aprovação da comissão';
        statusPill.textContent = 'AGUARDANDO REVISÃO 🔵';
        statusPill.style.color = '#93c5fd';
    } else {
        statusDot.style.background = 'var(--brand-amber)';
        statusDot.style.boxShadow = '0 0 10px var(--brand-amber)';
        statusHeading.textContent = 'PENDENTE';
        statusSub.textContent = 'Você ainda não possui música registrada';
        statusPill.textContent = 'SEM MÚSICA 🟡';
        statusPill.style.color = '#fbbf24';
    }

    // Exibição da música registrada
    const songBox = document.getElementById('drawerCurrentSongBox');
    if (student.musicTitle && student.musicTitle.trim()) {
        songBox.style.display = 'flex';
        document.getElementById('drawerSongTitle').textContent = student.musicTitle;
        document.getElementById('drawerSongArtist').textContent = student.musicArtist || 'Artista não informado';
        
        const snippetEl = document.getElementById('drawerSongSnippet');
        if (student.snippetStart || student.snippetEnd) {
            snippetEl.style.display = 'inline-block';
            snippetEl.innerHTML = `⏱ Trecho do refrão: <strong>${student.snippetStart || '0:00'} → ${student.snippetEnd || 'fim'}</strong>`;
        } else {
            snippetEl.style.display = 'none';
        }

        const ytBtn = document.getElementById('drawerSongYoutubeLink');
        if (student.musicLink) {
            ytBtn.style.display = 'flex';
            ytBtn.href = student.musicLink;
        } else {
            ytBtn.style.display = 'none';
        }
    } else {
        songBox.style.display = 'none';
    }

    // Preenche formulário com os valores existentes para facilitar edição
    document.getElementById('drawerInputLink').value = student.musicLink || '';
    document.getElementById('drawerInputTitle').value = student.musicTitle || '';
    document.getElementById('drawerInputArtist').value = student.musicArtist || '';
    document.getElementById('drawerInputStart').value = student.snippetStart || '';
    document.getElementById('drawerInputEnd').value = student.snippetEnd || '';
    
    document.getElementById('detectStatusMessage').style.display = 'none';
    document.getElementById('submissionAlert').style.display = 'none';

    // Abre modal
    document.getElementById('studentProfileDrawer').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeStudentDrawer() {
    document.getElementById('studentProfileDrawer').classList.remove('open');
    document.body.style.overflow = '';
}

// ==============================================================
// DETECTOR INTELIGENTE DO YOUTUBE
// ==============================================================
async function handleAutoDetect() {
    const linkInput = document.getElementById('drawerInputLink');
    const msg = document.getElementById('detectStatusMessage');
    const url = linkInput.value.trim();

    if (!url) {
        showToast("Cole o link do YouTube primeiro!");
        return;
    }

    const vidId = getYouTubeId(url);
    if (!vidId) {
        showToast("Link do YouTube inválido.");
        return;
    }

    msg.style.display = 'block';
    msg.textContent = "⏳ Analisando dados do vídeo...";

    try {
        const res = await fetch(`/api/youtube-info?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const data = await res.json();
            if (data.song || data.artist) {
                if (data.song) document.getElementById('drawerInputTitle').value = data.song;
                if (data.artist) document.getElementById('drawerInputArtist').value = data.artist;
                msg.innerHTML = `✨ Reconhecido: <strong>${data.song}</strong> • ${data.artist}`;
                return;
            }
        }
    } catch (e) {}

    // Fallback noembed
    try {
        const res2 = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vidId}`);
        if (res2.ok) {
            const d2 = await res2.json();
            if (d2.title) {
                const parts = d2.title.split(/ - | – | — /);
                const song = parts.length > 1 ? parts[1].trim() : d2.title.trim();
                const artist = parts.length > 1 ? parts[0].trim() : (d2.author_name || '');
                document.getElementById('drawerInputTitle').value = song;
                document.getElementById('drawerInputArtist').value = artist;
                msg.innerHTML = `✨ Reconhecido: <strong>${song}</strong> • ${artist}`;
                return;
            }
        }
    } catch (err) {}

    msg.textContent = "💡 Vídeo carregado! Digite o nome da música e o artista abaixo.";
}

// ==============================================================
// SUBMISSÃO DO FORMULÁRIO DE ESCOLHA
// ==============================================================
async function handleFormSubmit(e) {
    e.preventDefault();
    if (!AppState.currentStudent) return;

    const btn = document.getElementById('btnSubmitDrawerForm');
    const alertBox = document.getElementById('submissionAlert');

    const title = document.getElementById('drawerInputTitle').value.trim();
    const artist = document.getElementById('drawerInputArtist').value.trim();
    const link = document.getElementById('drawerInputLink').value.trim();
    const start = document.getElementById('drawerInputStart').value.trim();
    const end = document.getElementById('drawerInputEnd').value.trim();

    if (!title) {
        alert("Por favor, digite o nome da música.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span>ENVIANDO ESCOLHA...</span>`;

    const updated = {
        ...AppState.currentStudent,
        musicTitle: title,
        musicArtist: artist,
        musicLink: link,
        snippetStart: start,
        snippetEnd: end,
        status: AppState.currentStudent.status === 'APROVADO' ? 'APROVADO' : 'ESCOLHIDO',
        updatedAt: new Date().toISOString()
    };

    const success = await AppState.saveStudent(updated);

    if (success) {
        alertBox.className = 'submission-alert success';
        alertBox.innerHTML = `✨ <strong>Música enviada com sucesso!</strong> A comissão já tem acesso à sua escolha.`;
        alertBox.style.display = 'block';

        showToast("Escolha salva com sucesso! 🎓");

        // Atualiza a visualização do card do aluno e a lista
        AppState.currentStudent = updated;
        renderStudentsList(document.getElementById('studentSearchInput').value);

        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = `<span>SALVAR & ENVIAR MINHA ESCOLHA</span> <span class="btn-arrow">→</span>`;
            openStudentDrawer(updated);
        }, 1200);
    } else {
        alert("Ocorreu um erro ao salvar sua sugestão. Tente novamente.");
        btn.disabled = false;
        btn.innerHTML = `<span>SALVAR & ENVIAR MINHA ESCOLHA</span> <span class="btn-arrow">→</span>`;
    }
}

// ==============================================================
// INICIALIZAÇÃO E EVENT LISTENERS
// ==============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await AppState.init();

    // 1. Botões de Seleção de Turma no Hero
    document.querySelectorAll('.turma-card-modern').forEach(btn => {
        btn.addEventListener('click', () => {
            const turma = btn.dataset.turma;
            AppState.selectedTurma = turma;

            document.getElementById('sidebarTurmaPill').textContent = `3º ANO ${turma}`;
            document.getElementById('studentSearchInput').value = '';
            document.getElementById('clearSearchBtn').style.display = 'none';

            renderStudentsList();
            switchStage('list');
        });
    });

    // 2. Voltar para Escolha de Turma
    document.getElementById('btnBackToHero').addEventListener('click', () => {
        switchStage('turma');
    });

    // 3. Campo de Busca com Limpeza Rápida
    const searchInput = document.getElementById('studentSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', () => {
        const val = searchInput.value;
        clearBtn.style.display = val ? 'block' : 'none';
        renderStudentsList(val);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        renderStudentsList('');
        searchInput.focus();
    });

    // 4. Fechar Drawer
    document.getElementById('btnCloseDrawer').addEventListener('click', closeStudentDrawer);
    document.getElementById('drawerBackdrop').addEventListener('click', closeStudentDrawer);

    // 5. Detectar dados no YouTube
    document.getElementById('btnAutoDetect').addEventListener('click', handleAutoDetect);

    // 6. Enviar formulário
    document.getElementById('drawerSuggestionForm').addEventListener('submit', handleFormSubmit);
});
