// ============================================================================
// State and Data Management (Servidor + LocalStorage + GitHub Pages)
// ============================================================================

const DEFAULT_PRE_SAVED = [
    {
        id: "default_1",
        name: "Ana Júlia Santos",
        turma: "A",
        musicTitle: "Viva La Vida",
        musicArtist: "Coldplay",
        musicLink: "https://www.youtube.com/watch?v=tbneQDc2H3I",
        musicMp3: "",
        snippetStart: "0:40",
        snippetEnd: "1:15",
        status: "APROVADO",
        createdAt: "2026-11-03T00:00:00.000Z"
    },
    {
        id: "default_2",
        name: "Lucas Oliveira Ramos",
        turma: "B",
        musicTitle: "We Are the Champions",
        musicArtist: "Queen",
        musicLink: "https://www.youtube.com/watch?v=04854XqcfCY",
        musicMp3: "",
        snippetStart: "0:30",
        snippetEnd: "1:00",
        status: "ESCOLHIDO",
        createdAt: "2026-11-04T00:00:00.000Z"
    },
    {
        id: "default_3",
        name: "Beatriz M. Costa",
        turma: "A",
        musicTitle: "Hear Me Now",
        musicArtist: "Alok, Bruno Martini",
        musicLink: "https://www.youtube.com/watch?v=JVpY84y172k",
        musicMp3: "",
        snippetStart: "1:05",
        snippetEnd: "1:40",
        status: "APROVADO",
        createdAt: "2026-11-05T00:00:00.000Z"
    },
    {
        id: "default_4",
        name: "Gabriel Almeida Lima",
        turma: "B",
        musicTitle: "",
        musicArtist: "",
        musicLink: "",
        musicMp3: "",
        snippetStart: "",
        snippetEnd: "",
        status: "PENDENTE",
        createdAt: "2026-11-06T00:00:00.000Z"
    }
];

const TURMA_A = [
    "Alicia Nicolly da Silva Souza", "Ana Beatriz de Araujo Costa", "Ana Julia Trindade Coutinho Ferreira",
    "Ana Leticia Barbosa da Silva", "Ana Livia da Silva", "Annally Carla Santana de Lima",
    "Ayala Maria do Nascimento Alencar", "Camila Felipe de Morais", "Carlos Emanuel Santos da Silva",
    "Clarice Maria da Silva", "Emily Gabrieli Guedes da Silva", "Everton Thyago Maurino da Silva",
    "Ewerton de Freitas Pereira Filho", "Fabio de Souza Costa Filho", "Gabriela Ribeiro de Lima",
    "Genivaldo Marinho de Barros Neto", "Gloria Maria de Barros Moura", "Heitor Vitor Moura do Nascimento",
    "Heloisa Vitoria dos Santos Pedrosa", "Humberto Victor Costa e Silva", "Joao Batista do Bomfim Neto",
    "Joao Pedro Morais da Costa", "Joicylania Tereza Marinho Chaves", "Julia Beatriz de Lima Santana",
    "Julia Vitoria Bezerra de Andrade Chagas", "Lavinea Macedo Leleu Ribeiro dos Santos",
    "Maria Clara de Oliveira Santos", "Maria Giovanna Dias Mota", "Marianne Tavares Silva Lacerda",
    "Marilly Saffiry da Silva Lima", "Mateus Ferrari Cavalcanti de Melo", "Milena Maria Bezerra",
    "Paulo Jose de Santana Junior", "Rachel Germano de Lira e Sousa", "Raquel Sthefrany Lopes de Lima Silva",
    "Sabrina Gabrielly de Lima", "Samara Beatriz de Araujo Silva", "Syllas Miguel do Nascimento Silva",
    "Viviane Beatriz Souza de Melo"
];

const TURMA_B = [
    "Alvaro Nascimento de Araujo Lima", "Ana Livia de Figueiredo Oliveira", "Anderson Alexsandro da Silva",
    "Arthur Antonio Magalhaes da Silva", "Aryane Leticia de Araujo Barboza", "Cynthia Gabrielle Oliveira da Cunha Lopes",
    "David Lucas Ferreira Cavalcanti", "Deysiany Kariny da Silva Melo", "Efigenio Barrozo de Morais Filho",
    "Emanuel de Barros Barbosa", "Guilherme Gabriel Barbosa da Cruz Cardoso", "Inalda Regina Menezes de Souza",
    "Ivson Luiz Ferreira Cardoso", "Joao Gabriel Tavares da Silva", "Joao Pedro de Albuquerque Santiago",
    "Jose Thiago Torres Gomes da Silva", "Kamila Melo de Farias", "Larissa Pereira Ferreira da Silva",
    "Laura Beatriz de Andrade Santana", "Laura Mendes da Silva", "Luanna Letycia de Lima Coelho",
    "Lucas Araujo Ferreira", "Lucas Rozendo dos Santos", "Luis Felipe Figueiredo Rocha",
    "Luiz Gustavo Cavalcante de Lira", "Luiz Henrique Pedrosa Pereira da Silva", "Maria Clara Alves Pereira",
    "Maria Eduarda Ferreira da Silva", "Pedro Henrique Vilarim Ribeiro Viana", "Rafael Mateus Farias da Silva",
    "Raissa Agra de Alencar Cruz Modesto Duarte", "Ruan Vinicius Mendes da Silva", "Samyra Cavalcanti do Nascimento Melo",
    "Thayse Milena Santana de Oliveira"
];

function normalizeName(name) {
    if (!name) return '';
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function nameAlreadyExists(list, name) {
    const norm = normalizeName(name);
    return list.some(f => normalizeName(f.name) === norm);
}

// ============================================================================
// Auth & Security Manager (Modo Administrador)
// ============================================================================

const AuthManager = {
    tokenKey: 'formando_musix_admin_token',
    localPassKey: 'formando_musix_admin_local_pw',
    defaultPasswordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // sha256 de 'admin2026'
    isAdmin: false,
    pendingAction: null,

    async hash(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    init() {
        const storedToken = sessionStorage.getItem(this.tokenKey) || localStorage.getItem(this.tokenKey);
        if (storedToken) {
            this.isAdmin = true;
        }
        this.updateUI();
        this.setupEventListeners();
    },

    updateUI() {
        const loginBtn = document.getElementById('btnOpenLoginModal');
        const activeBadge = document.getElementById('adminActiveBadge');
        const visitorBanner = document.getElementById('visitorBanner');

        if (this.isAdmin) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (activeBadge) activeBadge.style.display = 'inline-flex';
            if (visitorBanner) visitorBanner.style.display = 'none';
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (activeBadge) activeBadge.style.display = 'none';
            if (visitorBanner) visitorBanner.style.display = 'block';
        }
    },

    setupEventListeners() {
        // Abertura do modal de login
        const openLogin = () => {
            const modal = document.getElementById('adminLoginModal');
            document.getElementById('adminLoginForm').reset();
            document.getElementById('loginErrorMessage').style.display = 'none';
            modal.classList.add('active');
            setTimeout(() => document.getElementById('adminPasswordInput').focus(), 150);
        };

        const btnOpenLogin = document.getElementById('btnOpenLoginModal');
        const btnBannerLogin = document.getElementById('btnBannerLogin');
        if (btnOpenLogin) btnOpenLogin.addEventListener('click', openLogin);
        if (btnBannerLogin) btnBannerLogin.addEventListener('click', openLogin);

        // Fechar modais de login e troca de senha
        document.getElementById('btnCloseLoginModal').addEventListener('click', () => {
            document.getElementById('adminLoginModal').classList.remove('active');
            this.pendingAction = null;
        });
        document.getElementById('btnCancelLoginModal').addEventListener('click', () => {
            document.getElementById('adminLoginModal').classList.remove('active');
            this.pendingAction = null;
        });

        // Submit do formulário de Login
        document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPasswordInput').value;
            const success = await this.login(password);
            if (success) {
                document.getElementById('adminLoginModal').classList.remove('active');
                if (this.pendingAction) {
                    const action = this.pendingAction;
                    this.pendingAction = null;
                    action();
                }
            } else {
                const errBox = document.getElementById('loginErrorMessage');
                errBox.textContent = "Senha de administrador incorreta. Tente novamente.";
                errBox.style.display = 'block';
            }
        });

        // Logout
        document.getElementById('btnLogoutAdmin').addEventListener('click', () => {
            if (confirm("Deseja sair do Modo Administrador?")) {
                this.logout();
            }
        });

        // Modal Alterar Senha
        document.getElementById('btnOpenChangePassModal').addEventListener('click', () => {
            const modal = document.getElementById('adminPasswordModal');
            document.getElementById('adminChangePassForm').reset();
            document.getElementById('changePassErrorMessage').style.display = 'none';
            document.getElementById('changePassSuccessMessage').style.display = 'none';
            modal.classList.add('active');
        });

        document.getElementById('btnCloseChangePassModal').addEventListener('click', () => {
            document.getElementById('adminPasswordModal').classList.remove('active');
        });
        document.getElementById('btnCancelChangePassModal').addEventListener('click', () => {
            document.getElementById('adminPasswordModal').classList.remove('active');
        });

        // Submit Alterar Senha
        document.getElementById('adminChangePassForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const cur = document.getElementById('currentAdminPassInput').value;
            const nw = document.getElementById('newAdminPassInput').value;
            const cf = document.getElementById('confirmAdminPassInput').value;
            const errBox = document.getElementById('changePassErrorMessage');
            const succBox = document.getElementById('changePassSuccessMessage');

            errBox.style.display = 'none';
            succBox.style.display = 'none';

            if (nw !== cf) {
                errBox.textContent = "A nova senha e a confirmação não coincidem!";
                errBox.style.display = 'block';
                return;
            }
            if (nw.length < 4) {
                errBox.textContent = "A nova senha deve ter pelo menos 4 caracteres!";
                errBox.style.display = 'block';
                return;
            }

            const result = await this.changePassword(cur, nw);
            if (result.success) {
                succBox.textContent = "Senha alterada com sucesso!";
                succBox.style.display = 'block';
                setTimeout(() => {
                    document.getElementById('adminPasswordModal').classList.remove('active');
                }, 1500);
            } else {
                errBox.textContent = result.message || "Erro ao alterar senha.";
                errBox.style.display = 'block';
            }
        });
    },

    async login(password) {
        // 1. Tenta API do servidor
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
                    this.isAdmin = true;
                    this.updateUI();
                    UIManager.render();
                    return true;
                }
            }
        } catch (e) {
            console.warn("Servidor offline, verificando autenticação local", e);
        }

        // 2. Fallback de autenticação local (quando hospedado estaticamente no GitHub Pages)
        const enteredHash = await this.hash(password);
        const storedHash = localStorage.getItem(this.localPassKey) || this.defaultPasswordHash;

        if (enteredHash === storedHash) {
            sessionStorage.setItem(this.tokenKey, enteredHash);
            localStorage.setItem(this.tokenKey, enteredHash);
            this.isAdmin = true;
            this.updateUI();
            UIManager.render();
            return true;
        }

        return false;
    },

    async changePassword(currentPassword, newPassword) {
        // 1. Tenta servidor
        try {
            const res = await fetch('/api/admin-change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    sessionStorage.setItem(this.tokenKey, data.token);
                    localStorage.setItem(this.tokenKey, data.token);
                    return { success: true };
                }
            } else {
                const err = await res.json();
                return { success: false, message: err.message };
            }
        } catch (e) {
            console.warn("Servidor offline, alterando senha localmente", e);
        }

        // 2. Fallback local
        const currentHash = await this.hash(currentPassword);
        const storedHash = localStorage.getItem(this.localPassKey) || this.defaultPasswordHash;
        if (currentHash !== storedHash) {
            return { success: false, message: "Senha atual incorreta!" };
        }

        const newHash = await this.hash(newPassword);
        localStorage.setItem(this.localPassKey, newHash);
        sessionStorage.setItem(this.tokenKey, newHash);
        localStorage.setItem(this.tokenKey, newHash);
        return { success: true };
    },

    logout() {
        sessionStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.tokenKey);
        this.isAdmin = false;
        this.updateUI();
        UIManager.render();
    },

    requireAdmin(callback) {
        if (this.isAdmin) {
            callback();
        } else {
            this.pendingAction = callback;
            document.getElementById('btnOpenLoginModal').click();
        }
    }
};

// ============================================================================
// State Management
// ============================================================================

const State = {
    key: 'formando_musix_data_v2',
    formandos: [],
    isServerConnected: false,

    async init() {
        this.updateSyncUI("loading", "Conectando ao site...");

        let loaded = false;

        // 1. Tenta carregar do servidor (/api/formandos) ou arquivo estático (data/formandos.json)
        try {
            let res = await fetch('/api/formandos');
            if (!res.ok) {
                res = await fetch('data/formandos.json');
            }
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    this.formandos = data;
                    loaded = true;
                    this.isServerConnected = true;
                }
            }
        } catch (e) {
            try {
                const resStatic = await fetch('data/formandos.json');
                if (resStatic.ok) {
                    const data = await resStatic.json();
                    if (Array.isArray(data) && data.length > 0) {
                        this.formandos = data;
                        loaded = true;
                    }
                }
            } catch (err) {}
        }

        // 2. Se falhou na rede, usa LocalStorage
        if (!loaded) {
            const stored = localStorage.getItem(this.key) || localStorage.getItem('formando_musix_data_v1');
            if (stored) {
                try {
                    this.formandos = JSON.parse(stored);
                    loaded = true;
                } catch (e) {
                    console.error("Erro ao ler LocalStorage", e);
                }
            }
        }

        // 3. Garante que os pré-salvos e todos os alunos de A e B estejam presentes
        this._ensureAllStudentsPresent();

        // 4. Salva no servidor e no LocalStorage
        await this.save(false);

        if (this.isServerConnected) {
            this.updateSyncUI("online", "Salvo no site 🟢");
        } else {
            this.updateSyncUI("offline", "Salvo no navegador");
        }
    },

    _ensureAllStudentsPresent() {
        DEFAULT_PRE_SAVED.forEach(preset => {
            const found = this.formandos.find(f => normalizeName(f.name) === normalizeName(preset.name));
            if (!found) {
                this.formandos.unshift(preset);
            } else if (!found.musicTitle && preset.musicTitle) {
                found.musicTitle = preset.musicTitle;
                found.musicArtist = preset.musicArtist;
                found.musicLink = preset.musicLink;
                found.snippetStart = preset.snippetStart;
                found.snippetEnd = preset.snippetEnd;
                found.status = preset.status;
            }
        });

        TURMA_A.forEach(nome => {
            if (!nameAlreadyExists(this.formandos, nome)) {
                this.formandos.push({
                    id: 'seed_A_' + normalizeName(nome).replace(/\s+/g, '_'),
                    name: nome,
                    turma: 'A',
                    musicTitle: '',
                    musicArtist: '',
                    musicLink: '',
                    musicMp3: '',
                    snippetStart: '',
                    snippetEnd: '',
                    status: 'PENDENTE',
                    createdAt: new Date().toISOString()
                });
            } else {
                const item = this.formandos.find(f => normalizeName(f.name) === normalizeName(nome));
                if (item && !item.turma) item.turma = 'A';
            }
        });

        TURMA_B.forEach(nome => {
            if (!nameAlreadyExists(this.formandos, nome)) {
                this.formandos.push({
                    id: 'seed_B_' + normalizeName(nome).replace(/\s+/g, '_'),
                    name: nome,
                    turma: 'B',
                    musicTitle: '',
                    musicArtist: '',
                    musicLink: '',
                    musicMp3: '',
                    snippetStart: '',
                    snippetEnd: '',
                    status: 'PENDENTE',
                    createdAt: new Date().toISOString()
                });
            } else {
                const item = this.formandos.find(f => normalizeName(f.name) === normalizeName(nome));
                if (item && !item.turma) item.turma = 'B';
            }
        });
    },

    async save(showFeedback = true) {
        if (showFeedback) {
            this.updateSyncUI("saving", "Salvando no site...");
        }

        // Salva sempre no LocalStorage como segurança
        localStorage.setItem(this.key, JSON.stringify(this.formandos));

        // Envia para o servidor salvar no arquivo data/formandos.json
        try {
            const res = await fetch('/api/formandos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formandos)
            });
            if (res.ok) {
                this.isServerConnected = true;
                if (showFeedback) {
                    this.updateSyncUI("online", "Salvo no site 🟢");
                }
                return true;
            }
        } catch (e) {
            this.isServerConnected = false;
            if (showFeedback) {
                this.updateSyncUI("offline", "Salvo no navegador");
            }
        }
        return false;
    },

    updateSyncUI(status, message) {
        const badge = document.getElementById('syncBadge');
        const text = document.getElementById('syncText');
        if (!badge || !text) return;

        badge.className = 'sync-badge';
        if (status === 'saving' || status === 'loading') {
            badge.classList.add('saving');
        } else if (status === 'offline') {
            badge.classList.add('offline');
        }
        text.textContent = message;
    },

    add(formando) {
        formando.id = Date.now().toString();
        formando.createdAt = new Date().toISOString();
        this.formandos.push(formando);
        this.save();
        return formando;
    },

    update(id, updatedFields) {
        const index = this.formandos.findIndex(f => f.id === id);
        if (index !== -1) {
            this.formandos[index] = { ...this.formandos[index], ...updatedFields };
            this.save();
            return this.formandos[index];
        }
        return null;
    },

    delete(id) {
        const index = this.formandos.findIndex(f => f.id === id);
        if (index !== -1) {
            this.formandos.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    },

    getById(id) {
        return this.formandos.find(f => f.id === id) || null;
    },

    getByTurma(turma) {
        if (turma === 'todos') return this.formandos;
        return this.formandos.filter(f => f.turma === turma);
    }
};

// ============================================================================
// Helper Utilities & YouTube Parser
// ============================================================================

function getYouTubeId(url) {
    if (!url) return null;
    url = url.trim();
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    timeStr = timeStr.toString().trim();
    if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10) || 0;
            const seconds = parseInt(parts[1], 10) || 0;
            return (minutes * 60) + seconds;
        }
    }
    return parseInt(timeStr, 10) || 0;
}

function formatSecondsToMMSS(seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

async function autoFetchYouTubeDetails(url) {
    const videoId = getYouTubeId(url);
    if (!videoId) return null;

    const badges = [document.getElementById('autoDetectStatus1'), document.getElementById('autoDetectStatus2')];
    badges.forEach(b => {
        if (b) {
            b.style.display = 'flex';
            b.innerHTML = `<span>⏳ Identificando música e artista...</span>`;
        }
    });

    try {
        const res = await fetch(`/api/youtube-info?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && (data.song || data.artist)) {
                applyAutoDetectedSong(data.song, data.artist);
                return data;
            }
        }
    } catch (e) {}

    try {
        const res2 = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.title) {
                const parts = data2.title.split(/ - | – | — /);
                let artist = parts.length > 1 ? parts[0].trim() : data2.author_name || '';
                let song = parts.length > 1 ? parts[1].trim() : data2.title.trim();
                applyAutoDetectedSong(song, artist);
                return { song, artist };
            }
        }
    } catch (err) {}

    badges.forEach(b => { if (b) b.style.display = 'none'; });
    return null;
}

function applyAutoDetectedSong(song, artist) {
    const titleInput = document.getElementById('musicTitle');
    const artistInput = document.getElementById('musicArtist');
    const statusSelect = document.getElementById('choiceStatus');

    if (song && titleInput) titleInput.value = song;
    if (artist && artistInput) artistInput.value = artist;
    if (statusSelect && statusSelect.value === 'PENDENTE') statusSelect.value = 'ESCOLHIDO';

    const badges = [document.getElementById('autoDetectStatus1'), document.getElementById('autoDetectStatus2')];
    badges.forEach(b => {
        if (b) {
            b.style.display = 'flex';
            b.innerHTML = `<span>✨ Identificado: <strong>${song || 'Música'}</strong> ${artist ? '• ' + artist : ''}</span>`;
        }
    });
}

// ============================================================================
// YouTube Iframe Player Integration (Player Flutuante Global)
// ============================================================================

let ytPlayer = null;
let currentPlayingId = null;
let currentStartSeconds = 0;
let currentEndSeconds = 0;
let progressInterval = null;

const PlayerManager = {
    dock: document.getElementById('playerDock'),
    titleEl: document.getElementById('playerSongTitle'),
    metaEl: document.getElementById('playerSongMeta'),
    progressFillEl: document.getElementById('playerProgressFill'),
    playPauseBtn: document.getElementById('playerPlayPauseBtn'),
    playIcon: document.getElementById('playIconSvg'),
    pauseIcon: document.getElementById('pauseIconSvg'),

    init() {
        document.getElementById('playerCloseBtn').addEventListener('click', () => this.stop());
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    },

    play(formando) {
        const videoId = getYouTubeId(formando.musicLink);
        if (!videoId) {
            alert("Este formando não possui um link de música do YouTube válido!");
            return;
        }

        CutterManager.stop();

        document.querySelectorAll('.formando-card').forEach(card => {
            if (card.dataset.id === formando.id) {
                card.classList.add('playing');
            } else {
                card.classList.remove('playing');
            }
        });

        currentPlayingId = formando.id;
        currentStartSeconds = parseTimeToSeconds(formando.snippetStart) || 0;
        currentEndSeconds = parseTimeToSeconds(formando.snippetEnd) || (currentStartSeconds + 30);

        this.titleEl.textContent = formando.musicTitle || "Sem título";
        this.metaEl.textContent = `${formando.musicArtist || "Artista Desconhecido"} • ${formando.name}`;
        this.progressFillEl.style.width = '0%';
        this.dock.classList.add('active');

        if (typeof YT !== 'undefined' && YT.loaded) {
            this.setupOrLoadVideo(videoId);
        } else {
            setTimeout(() => this.play(formando), 500);
        }
    },

    setupOrLoadVideo(videoId) {
        if (!ytPlayer) {
            ytPlayer = new YT.Player('youtubePlayerTarget', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,
                    'disablekb': 1,
                    'fs': 0,
                    'rel': 0,
                    'modestbranding': 1
                },
                events: {
                    'onReady': () => {
                        this.loadSnippet(videoId);
                    },
                    'onStateChange': (event) => {
                        this.handleStateChange(event.data);
                    }
                }
            });
        } else {
            this.loadSnippet(videoId);
        }
    },

    loadSnippet(videoId) {
        try {
            ytPlayer.cueVideoById({
                videoId: videoId,
                startSeconds: currentStartSeconds
            });
            setTimeout(() => {
                ytPlayer.seekTo(currentStartSeconds, true);
                ytPlayer.playVideo();
            }, 100);
        } catch (e) {
            console.error("Erro ao carregar vídeo no player flutuante", e);
        }
    },

    handleStateChange(state) {
        if (state === 1) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
            this.startProgressTracker();
        } else {
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
            this.stopProgressTracker();
        }
    },

    startProgressTracker() {
        this.stopProgressTracker();
        progressInterval = setInterval(() => {
            if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
                const currentTime = ytPlayer.getCurrentTime();
                if (currentTime >= currentEndSeconds) {
                    this.stop();
                    return;
                }
                const elapsed = currentTime - currentStartSeconds;
                const duration = currentEndSeconds - currentStartSeconds;
                const percentage = Math.min(100, Math.max(0, (elapsed / duration) * 100));
                this.progressFillEl.style.width = `${percentage}%`;
            }
        }, 100);
    },

    stopProgressTracker() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    },

    togglePlayPause() {
        if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') return;
        const state = ytPlayer.getPlayerState();
        if (state === 1) {
            ytPlayer.pauseVideo();
        } else {
            ytPlayer.playVideo();
        }
    },

    stop() {
        this.stopProgressTracker();
        if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
            ytPlayer.stopVideo();
        }
        this.dock.classList.remove('active');
        document.querySelectorAll('.formando-card').forEach(card => {
            card.classList.remove('playing');
        });
        currentPlayingId = null;
    }
};

// ============================================================================
// YouTube Cutter Manager (Escolher e Cortar no Modal)
// ============================================================================

const CutterManager = {
    modalPlayer: null,
    timerInterval: null,
    currentVideoId: null,
    debounceTimer: null,

    init() {
        document.querySelectorAll('.modal-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const target = document.getElementById('pane-' + btn.dataset.modaltab);
                if (target) target.classList.add('active');
            });
        });

        document.getElementById('btnGoToCutter').addEventListener('click', () => {
            const link = document.getElementById('musicLink').value.trim();
            if (link) {
                document.getElementById('cutterUrlInput').value = link;
                this.loadVideo(link);
            }
            document.querySelector('[data-modaltab="cutter"]').click();
        });

        document.getElementById('btnCutterLoad').addEventListener('click', () => {
            const val = document.getElementById('cutterUrlInput').value.trim();
            if (val) {
                this.loadVideo(val);
                autoFetchYouTubeDetails(val);
            }
        });

        document.getElementById('cutterUrlInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btnCutterLoad').click();
            }
        });

        const handleLinkInput = (url) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                if (getYouTubeId(url)) {
                    autoFetchYouTubeDetails(url);
                    this.loadVideo(url);
                }
            }, 600);
        };

        document.getElementById('musicLink').addEventListener('input', (e) => {
            document.getElementById('cutterUrlInput').value = e.target.value;
            handleLinkInput(e.target.value.trim());
        });

        document.getElementById('cutterUrlInput').addEventListener('input', (e) => {
            document.getElementById('musicLink').value = e.target.value;
            handleLinkInput(e.target.value.trim());
        });

        document.getElementById('btnCutterSearchYoutube').addEventListener('click', () => {
            const song = document.getElementById('musicTitle').value.trim();
            const artist = document.getElementById('musicArtist').value.trim();
            const custom = document.getElementById('cutterUrlInput').value.trim();
            const query = custom || `${song} ${artist}`.trim();
            if (query) {
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
            } else {
                window.open('https://www.youtube.com', '_blank');
            }
        });

        document.getElementById('btnSetStartStamp').addEventListener('click', () => {
            if (this.modalPlayer && typeof this.modalPlayer.getCurrentTime === 'function') {
                const sec = Math.floor(this.modalPlayer.getCurrentTime());
                const formatted = formatSecondsToMMSS(sec);
                document.getElementById('cutterSnippetStart').value = formatted;
                document.getElementById('snippetStart').value = formatted;
                this.updateDuration();
            }
        });

        document.getElementById('btnSetEndStamp').addEventListener('click', () => {
            if (this.modalPlayer && typeof this.modalPlayer.getCurrentTime === 'function') {
                const sec = Math.ceil(this.modalPlayer.getCurrentTime());
                const formatted = formatSecondsToMMSS(sec);
                document.getElementById('cutterSnippetEnd').value = formatted;
                document.getElementById('snippetEnd').value = formatted;
                this.updateDuration();
            }
        });

        ['cutterSnippetStart', 'cutterSnippetEnd'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                document.getElementById('snippetStart').value = document.getElementById('cutterSnippetStart').value;
                document.getElementById('snippetEnd').value = document.getElementById('cutterSnippetEnd').value;
                this.updateDuration();
            });
        });

        ['snippetStart', 'snippetEnd'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                document.getElementById('cutterSnippetStart').value = document.getElementById('snippetStart').value;
                document.getElementById('cutterSnippetEnd').value = document.getElementById('snippetEnd').value;
                this.updateDuration();
            });
        });

        document.getElementById('btnTestModalSnippet').addEventListener('click', () => {
            this.testSnippet();
        });

        document.getElementById('btnStopModalSnippet').addEventListener('click', () => {
            if (this.modalPlayer && typeof this.modalPlayer.pauseVideo === 'function') {
                this.modalPlayer.pauseVideo();
            }
        });

        document.getElementById('musicMp3').addEventListener('input', (e) => {
            const player = document.getElementById('mp3AudioPlayer');
            const wrapper = document.getElementById('mp3PlayerWrapper');
            if (e.target.value.trim()) {
                player.src = e.target.value.trim();
                wrapper.style.display = 'block';
            } else {
                player.src = '';
                wrapper.style.display = 'none';
            }
        });
    },

    loadVideo(urlOrId) {
        let videoId = getYouTubeId(urlOrId);
        if (!videoId && urlOrId.length === 11) videoId = urlOrId;
        if (!videoId) return;

        this.currentVideoId = videoId;
        document.getElementById('musicLink').value = `https://www.youtube.com/watch?v=${videoId}`;
        document.getElementById('cutterUrlInput').value = `https://www.youtube.com/watch?v=${videoId}`;
        document.getElementById('cutterPlaceholder').style.display = 'none';
        document.getElementById('modalYoutubeTarget').style.display = 'block';

        if (!this.modalPlayer) {
            this.modalPlayer = new YT.Player('modalYoutubeTarget', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 1,
                    'modestbranding': 1,
                    'rel': 0
                },
                events: {
                    'onReady': () => {
                        this.startTimerTracker();
                    },
                    'onStateChange': (e) => {
                        if (e.data === 1) {
                            this.startTimerTracker();
                        }
                    }
                }
            });
        } else {
            this.modalPlayer.loadVideoById(videoId);
            this.startTimerTracker();
        }
    },

    startTimerTracker() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.modalPlayer && typeof this.modalPlayer.getCurrentTime === 'function') {
                const currentSec = Math.floor(this.modalPlayer.getCurrentTime());
                const formatted = formatSecondsToMMSS(currentSec);
                const liveEl = document.getElementById('modalLiveTime');
                const startLive = document.getElementById('previewStartLive');
                const endLive = document.getElementById('previewEndLive');
                if (liveEl) liveEl.textContent = formatted;
                if (startLive) startLive.textContent = formatted;
                if (endLive) endLive.textContent = formatted;
            }
        }, 200);
    },

    updateDuration() {
        const startSec = parseTimeToSeconds(document.getElementById('cutterSnippetStart').value) || 0;
        const endSec = parseTimeToSeconds(document.getElementById('cutterSnippetEnd').value) || 0;
        const badge = document.getElementById('cutterDurationBadge');
        if (endSec > startSec) {
            const diff = endSec - startSec;
            badge.textContent = `Duração: ${diff}s (${formatSecondsToMMSS(diff)})`;
        } else {
            badge.textContent = `Duração: --`;
        }
    },

    testSnippet() {
        if (!this.modalPlayer) {
            alert("Carregue um vídeo primeiro!");
            return;
        }
        const startSec = parseTimeToSeconds(document.getElementById('cutterSnippetStart').value) || 0;
        const endSec = parseTimeToSeconds(document.getElementById('cutterSnippetEnd').value) || (startSec + 30);

        this.modalPlayer.seekTo(startSec, true);
        this.modalPlayer.playVideo();

        const checkEndInterval = setInterval(() => {
            if (this.modalPlayer && typeof this.modalPlayer.getCurrentTime === 'function') {
                const cur = this.modalPlayer.getCurrentTime();
                if (cur >= endSec) {
                    this.modalPlayer.pauseVideo();
                    clearInterval(checkEndInterval);
                }
            }
        }, 200);
    },

    resetForStudent(formando) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.modalPlayer && typeof this.modalPlayer.stopVideo === 'function') {
            this.modalPlayer.stopVideo();
        }

        const videoId = getYouTubeId(formando?.musicLink);
        document.getElementById('cutterUrlInput').value = formando?.musicLink || '';
        document.getElementById('cutterSnippetStart').value = formando?.snippetStart || '';
        document.getElementById('cutterSnippetEnd').value = formando?.snippetEnd || '';
        this.updateDuration();

        [document.getElementById('autoDetectStatus1'), document.getElementById('autoDetectStatus2')].forEach(b => {
            if (b) b.style.display = 'none';
        });

        if (videoId) {
            this.loadVideo(videoId);
        } else {
            document.getElementById('cutterPlaceholder').style.display = 'flex';
            document.getElementById('modalYoutubeTarget').style.display = 'none';
            document.getElementById('modalLiveTime').textContent = '0:00';
            document.getElementById('previewStartLive').textContent = '0:00';
            document.getElementById('previewEndLive').textContent = '0:00';
        }
    },

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.modalPlayer && typeof this.modalPlayer.stopVideo === 'function') {
            this.modalPlayer.stopVideo();
        }
    }
};

window.onYouTubeIframeAPIReady = function() {
    console.log("YouTube API pronta.");
};

// ============================================================================
// Export & Report Manager (TXT, CSV, WhatsApp, Impressão/PDF)
// ============================================================================

const ExportManager = {
    modal: document.getElementById('exportModal'),
    filterTurma: document.getElementById('exportFilterTurma'),
    filterStatus: document.getElementById('exportFilterStatus'),
    previewText: document.getElementById('exportPreviewTextarea'),
    countLabel: document.getElementById('exportSelectedCount'),

    init() {
        // Abertura do modal de exportação
        const openModal = () => {
            this.updatePreview();
            this.modal.classList.add('active');
        };

        const btnOpen = document.getElementById('btnOpenExportModal');
        const btnTop = document.getElementById('btnOpenExportModalTop');
        if (btnOpen) btnOpen.addEventListener('click', openModal);
        if (btnTop) btnTop.addEventListener('click', openModal);

        document.getElementById('btnCloseExportModal').addEventListener('click', () => {
            this.modal.classList.remove('active');
        });
        document.getElementById('btnDoneExportModal').addEventListener('click', () => {
            this.modal.classList.remove('active');
        });

        // Atualização de filtros
        this.filterTurma.addEventListener('change', () => this.updatePreview());
        this.filterStatus.addEventListener('change', () => this.updatePreview());

        // Botões dentro do modal de exportação
        document.getElementById('cardExportTxt').querySelector('button').addEventListener('click', () => this.downloadTxt());
        document.getElementById('cardExportCsv').querySelector('button').addEventListener('click', () => this.downloadCsv());
        document.getElementById('cardExportWhatsapp').querySelector('button').addEventListener('click', () => this.copyWhatsapp());
        document.getElementById('cardExportPrint').querySelector('button').addEventListener('click', () => this.openPrintView());

        // Botões rápidos do rodapé
        document.getElementById('btnQuickExportTxt').addEventListener('click', () => this.downloadTxt());
        document.getElementById('btnQuickExportCsv').addEventListener('click', () => this.downloadCsv());
        document.getElementById('btnQuickWhatsapp').addEventListener('click', () => this.copyWhatsapp());
        document.getElementById('btnExportJson').addEventListener('click', () => UIManager.exportBackup());
    },

    getFilteredData() {
        const turmaVal = this.filterTurma.value;
        const statusVal = this.filterStatus.value;

        return State.formandos.filter(f => {
            const matchesTurma = turmaVal === 'todos' || f.turma === turmaVal;
            const matchesStatus = statusVal === 'todos' || f.status === statusVal;
            return matchesTurma && matchesStatus;
        });
    },

    updatePreview() {
        const data = this.getFilteredData();
        this.countLabel.textContent = `${data.length} formandos selecionados`;
        this.previewText.value = this.generateTxtContent(data);
    },

    generateTxtContent(list = null) {
        const data = list || this.getFilteredData();
        let content = `==================================================================\n`;
        content += `🎓 LISTA OFICIAL DE MÚSICAS DE FORMATURA - 3º ANO 2026\n`;
        content += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n`;
        content += `Total Selecionado: ${data.length} formandos\n`;
        content += `==================================================================\n\n`;

        const turmas = ['A', 'B'];
        turmas.forEach(turma => {
            const sub = data.filter(f => f.turma === turma);
            if (sub.length > 0) {
                content += `------------------------------------------------------------------\n`;
                content += `📌 TURMA 3º ANO ${turma} (${sub.length} formandos)\n`;
                content += `------------------------------------------------------------------\n\n`;

                sub.forEach((f, idx) => {
                    content += `${idx + 1}. [${f.status}] ${f.name}\n`;
                    if (f.musicTitle) {
                        content += `   🎵 Música: ${f.musicTitle}\n`;
                        content += `   🎤 Artista: ${f.musicArtist || 'Não informado'}\n`;
                        const start = f.snippetStart || '0:00';
                        const end = f.snippetEnd || 'Fim';
                        const sSec = parseTimeToSeconds(f.snippetStart) || 0;
                        const eSec = parseTimeToSeconds(f.snippetEnd) || 0;
                        const dur = (eSec > sSec) ? ` (${eSec - sSec} segundos)` : '';
                        content += `   ⏱️ Trecho de Corte: ${start} até ${end}${dur}\n`;
                        content += `   🔗 Link YouTube: ${f.musicLink || 'Não informado'}\n`;
                        if (f.musicMp3) content += `   🎧 Áudio MP3: ${f.musicMp3}\n`;
                    } else {
                        content += `   🎵 Música: (Pendente de escolha)\n`;
                    }
                    content += `\n`;
                });
            }
        });

        const aprovadas = data.filter(f => f.status === 'APROVADO').length;
        const escolhidas = data.filter(f => f.status === 'ESCOLHIDO').length;
        const pendentes = data.filter(f => f.status === 'PENDENTE').length;

        content += `==================================================================\n`;
        content += `📊 RESUMO ESTATÍSTICO:\n`;
        content += `  • Aprovadas: ${aprovadas}\n`;
        content += `  • Escolhidas (Aguardando Aprovação): ${escolhidas}\n`;
        content += `  • Pendentes: ${pendentes}\n`;
        content += `  • Total: ${data.length}\n`;
        content += `==================================================================\n`;

        return content;
    },

    downloadTxt() {
        const content = this.generateTxtContent();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `musicas-formatura-2026-${Date.now().toString().slice(-4)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    downloadCsv() {
        const data = this.getFilteredData();
        const headers = ["ID", "Nome do Formando", "Turma", "Status", "Nome da Musica", "Artista/Banda", "Inicio do Trecho", "Fim do Trecho", "Duracao (s)", "Link YouTube", "Link MP3"];
        
        let csvContent = "\uFEFF"; // BOM UTF-8 para Excel abrir com acentuação correta
        csvContent += headers.map(h => `"${h}"`).join(";") + "\n";

        data.forEach(f => {
            const sSec = parseTimeToSeconds(f.snippetStart) || 0;
            const eSec = parseTimeToSeconds(f.snippetEnd) || 0;
            const dur = (eSec > sSec) ? (eSec - sSec).toString() : "";

            const row = [
                f.id,
                f.name,
                `3º ${f.turma}`,
                f.status,
                f.musicTitle || "",
                f.musicArtist || "",
                f.snippetStart || "",
                f.snippetEnd || "",
                dur,
                f.musicLink || "",
                f.musicMp3 || ""
            ];

            csvContent += row.map(val => `"${(val || "").replace(/"/g, '""')}"`).join(";") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planilha-musicas-formatura-2026.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    async copyWhatsapp() {
        const data = this.getFilteredData();
        let msg = `🎓 *LISTA DE MÚSICAS DE FORMATURA 2026*\n`;
        msg += `📅 _Atualizado em ${new Date().toLocaleDateString('pt-BR')}_\n\n`;

        const subA = data.filter(f => f.turma === 'A');
        if (subA.length > 0) {
            msg += `*🅰️ 3º ANO A (${subA.length} alunos):*\n`;
            subA.forEach((f, idx) => {
                const statusEmoji = f.status === 'APROVADO' ? '✅' : (f.status === 'ESCOLHIDO' ? '🔵' : '🟡');
                if (f.musicTitle) {
                    msg += `${idx + 1}. *${f.name}*: ${f.musicTitle} - ${f.musicArtist || 'Artista'} ${statusEmoji}\n`;
                } else {
                    msg += `${idx + 1}. *${f.name}*: _(Pendente)_ 🟡\n`;
                }
            });
            msg += `\n`;
        }

        const subB = data.filter(f => f.turma === 'B');
        if (subB.length > 0) {
            msg += `*🅱️ 3º ANO B (${subB.length} alunos):*\n`;
            subB.forEach((f, idx) => {
                const statusEmoji = f.status === 'APROVADO' ? '✅' : (f.status === 'ESCOLHIDO' ? '🔵' : '🟡');
                if (f.musicTitle) {
                    msg += `${idx + 1}. *${f.name}*: ${f.musicTitle} - ${f.musicArtist || 'Artista'} ${statusEmoji}\n`;
                } else {
                    msg += `${idx + 1}. *${f.name}*: _(Pendente)_ 🟡\n`;
                }
            });
            msg += `\n`;
        }

        const aprovadas = data.filter(f => f.status === 'APROVADO').length;
        const pendentes = data.filter(f => f.status === 'PENDENTE').length;
        msg += `📊 *Resumo:* ${aprovadas} Aprovadas | ${pendentes} Pendentes de ${data.length} formandos.`;

        try {
            await navigator.clipboard.writeText(msg);
            alert("✅ Mensagem formatada copiada para a área de transferência! Basta colar no WhatsApp.");
        } catch (e) {
            // Fallback manual
            this.previewText.value = msg;
            this.previewText.select();
            document.execCommand('copy');
            alert("✅ Texto copiado!");
        }
    },

    openPrintView() {
        const data = this.getFilteredData();
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Permita pop-ups no navegador para visualizar a folha de impressão.");
            return;
        }

        let html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Músicas de Formatura 2026</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #222; }
                h1 { text-align: center; margin-bottom: 4px; font-size: 18pt; }
                p.sub { text-align: center; margin-top: 0; color: #666; font-size: 10pt; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 9.5pt; }
                th, td { border: 1px solid #bbb; padding: 6px 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .status-aprovado { color: #047857; font-weight: bold; }
                .status-escolhido { color: #1d4ed8; font-weight: bold; }
                .status-pendente { color: #b45309; font-weight: bold; }
                @media print {
                    @page { margin: 15mm; size: A4; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <button onclick="window.print()" style="padding: 10px 18px; margin-bottom: 16px; font-size: 11pt; cursor: pointer;">🖨️ Imprimir / Salvar PDF</button>
            <h1>🎓 Músicas de Formatura - 3º Ano 2026</h1>
            <p class="sub">Relatório emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} • Total: ${data.length} formandos</p>
            <table>
                <thead>
                    <tr>
                        <th style="width: 35px;">#</th>
                        <th>Formando</th>
                        <th style="width: 50px;">Turma</th>
                        <th>Música</th>
                        <th>Artista</th>
                        <th style="width: 80px;">Trecho</th>
                        <th style="width: 80px;">Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((f, idx) => {
            const statusClass = f.status === 'APROVADO' ? 'status-aprovado' : (f.status === 'ESCOLHIDO' ? 'status-escolhido' : 'status-pendente');
            const trecho = (f.snippetStart || f.snippetEnd) ? `${f.snippetStart || '0:00'} - ${f.snippetEnd || 'Fim'}` : '-';
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${f.name}</strong></td>
                    <td>${f.turma}</td>
                    <td>${f.musicTitle || '<em>(Pendente)</em>'}</td>
                    <td>${f.musicArtist || '-'}</td>
                    <td>${trecho}</td>
                    <td class="${statusClass}">${f.status}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }
};

// ============================================================================
// UI Render and Flow Controllers
// ============================================================================

const UIManager = {
    grid: document.getElementById('formandosGrid'),
    modal: document.getElementById('formandoModal'),
    form: document.getElementById('formandoForm'),
    modalTitle: document.getElementById('modalTitle'),
    modalSubtitle: document.getElementById('modalSubtitle'),
    searchInput: document.getElementById('searchInput'),
    filterStatus: document.getElementById('filterStatus'),
    sortOrder: document.getElementById('sortOrder'),
    tabButtons: document.querySelectorAll('.tab-btn'),

    statTotalA: document.getElementById('statTotalA'),
    statAprovadasA: document.getElementById('statAprovadasA'),
    statEscolhidasA: document.getElementById('statEscolhidasA'),
    statPendentesA: document.getElementById('statPendentesA'),

    statTotalB: document.getElementById('statTotalB'),
    statAprovadasB: document.getElementById('statAprovadasB'),
    statEscolhidasB: document.getElementById('statEscolhidasB'),
    statPendentesB: document.getElementById('statPendentesB'),

    statTotalTodos: document.getElementById('statTotalTodos'),
    statAprovadasTodos: document.getElementById('statAprovadasTodos'),
    statEscolhidasTodos: document.getElementById('statEscolhidasTodos'),
    statPendentesTodos: document.getElementById('statPendentesTodos'),

    activeTurma: 'A',

    init() {
        this.render();
        this.setupEventListeners();
    },

    setupEventListeners() {
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTurma = btn.dataset.turma;
                this.render();
            });
        });

        // Botão Novo Formando (Requer Admin)
        document.getElementById('btnOpenAddModal').addEventListener('click', () => {
            AuthManager.requireAdmin(() => this.openModal(null));
        });

        document.getElementById('btnCloseModal').addEventListener('click', () => this.closeModal());
        document.getElementById('btnCancelModal').addEventListener('click', () => this.closeModal());

        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
            const exportM = document.getElementById('exportModal');
            if (e.target === exportM) exportM.classList.remove('active');
            const loginM = document.getElementById('adminLoginModal');
            if (e.target === loginM) loginM.classList.remove('active');
            const passM = document.getElementById('adminPasswordModal');
            if (e.target === passM) passM.classList.remove('active');
        });

        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        this.searchInput.addEventListener('input', () => this.render());
        this.filterStatus.addEventListener('change', () => this.render());
        this.sortOrder.addEventListener('change', () => this.render());

        // Import Backup (Requer Admin)
        const btnImport = document.getElementById('btnImportPrompt');
        if (btnImport) {
            btnImport.addEventListener('click', (e) => {
                if (!AuthManager.isAdmin) {
                    e.preventDefault();
                    AuthManager.requireAdmin(() => {
                        document.getElementById('importFile').click();
                    });
                }
            });
        }
        document.getElementById('importFile').addEventListener('change', (e) => this.importBackup(e));
    },

    updateStats() {
        const computeStats = (list) => ({
            total: list.length,
            aprovadas: list.filter(f => f.status === 'APROVADO').length,
            escolhidas: list.filter(f => f.status === 'ESCOLHIDO').length,
            pendentes: list.filter(f => f.status === 'PENDENTE').length,
        });

        const statsA = computeStats(State.getByTurma('A'));
        const statsB = computeStats(State.getByTurma('B'));
        const statsTodos = computeStats(State.formandos);

        if (this.statTotalA) this.statTotalA.textContent = statsA.total;
        if (this.statAprovadasA) this.statAprovadasA.textContent = statsA.aprovadas;
        if (this.statEscolhidasA) this.statEscolhidasA.textContent = statsA.escolhidas;
        if (this.statPendentesA) this.statPendentesA.textContent = statsA.pendentes;

        if (this.statTotalB) this.statTotalB.textContent = statsB.total;
        if (this.statAprovadasB) this.statAprovadasB.textContent = statsB.aprovadas;
        if (this.statEscolhidasB) this.statEscolhidasB.textContent = statsB.escolhidas;
        if (this.statPendentesB) this.statPendentesB.textContent = statsB.pendentes;

        if (this.statTotalTodos) this.statTotalTodos.textContent = statsTodos.total;
        if (this.statAprovadasTodos) this.statAprovadasTodos.textContent = statsTodos.aprovadas;
        if (this.statEscolhidasTodos) this.statEscolhidasTodos.textContent = statsTodos.escolhidas;
        if (this.statPendentesTodos) this.statPendentesTodos.textContent = statsTodos.pendentes;

        const tcA = document.getElementById('tabCountA');
        const tcB = document.getElementById('tabCountB');
        const tcTodos = document.getElementById('tabCountTodos');
        if (tcA) tcA.textContent = statsA.total;
        if (tcB) tcB.textContent = statsB.total;
        if (tcTodos) tcTodos.textContent = statsTodos.total;
    },

    render() {
        this.updateStats();

        const search = this.searchInput.value.toLowerCase().trim();
        const status = this.filterStatus.value;
        const sort = this.sortOrder.value;

        let baseList = State.getByTurma(this.activeTurma);

        let filtered = baseList.filter(f => {
            const matchesSearch =
                f.name.toLowerCase().includes(search) ||
                (f.musicTitle && f.musicTitle.toLowerCase().includes(search)) ||
                (f.musicArtist && f.musicArtist.toLowerCase().includes(search));

            const matchesStatus = status === 'todos' || f.status === status;
            return matchesSearch && matchesStatus;
        });

        filtered.sort((a, b) => {
            if (sort === 'nome-asc') return a.name.localeCompare(b.name);
            if (sort === 'nome-desc') return b.name.localeCompare(a.name);
            if (sort === 'recente') return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
        });

        this.grid.innerHTML = '';

        if (filtered.length === 0) {
            this.grid.innerHTML = `
                <div class="no-results animate-up">
                    <div class="no-results-icon">🔎</div>
                    <h3>Nenhum formando encontrado</h3>
                    <p>Tente ajustar os termos da busca ou os filtros aplicados.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(f => {
            const card = this.createCard(f);
            this.grid.appendChild(card);
        });
    },

    createCard(formando) {
        const card = document.createElement('div');
        card.className = `formando-card animate-up`;
        card.dataset.id = formando.id;
        if (currentPlayingId === formando.id) {
            card.classList.add('playing');
        }

        const hasMusic = formando.musicTitle && formando.musicLink;
        const videoId = getYouTubeId(formando.musicLink);

        let statusClass = 'badge-pendente';
        let statusLabel = 'Pendente';
        if (formando.status === 'APROVADO') {
            statusClass = 'badge-aprovado';
            statusLabel = 'Aprovado';
        } else if (formando.status === 'ESCOLHIDO') {
            statusClass = 'badge-escolhido';
            statusLabel = 'Escolhido';
        }

        const turmaBadge = formando.turma
            ? `<span class="badge-turma badge-turma-${formando.turma}">Turma ${formando.turma}</span>`
            : '';

        let thumbHtml = '';
        if (videoId) {
            thumbHtml = `
                <div class="card-yt-thumb" onclick="UIManager.handleEditRequest('${formando.id}', 'cutter')" title="Clique para ver no Cortador">
                    <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Capa YouTube" loading="lazy">
                    <span class="card-yt-thumb-badge">▶ YouTube</span>
                </div>
            `;
        }

        let musicHtml = `
            <div class="no-music" onclick="UIManager.handleEditRequest('${formando.id}', 'cutter')" style="cursor: pointer;" title="Clique para escolher música">
                Nenhuma música escolhida ainda.
                <div style="margin-top: 6px; color: var(--primary-blue-light); font-weight: 600;">+ Escolher no YouTube</div>
            </div>
        `;

        if (hasMusic) {
            const startSec = parseTimeToSeconds(formando.snippetStart) || 0;
            const endSec = parseTimeToSeconds(formando.snippetEnd) || 0;
            const rangeStr = (startSec || endSec) ? `${formando.snippetStart} até ${formando.snippetEnd}` : 'Música Inteira';

            musicHtml = `
                <div class="music-title-wrapper">
                    <div class="music-icon">🎵</div>
                    <div class="music-title-info">
                        <div class="music-title" title="${formando.musicTitle}">${formando.musicTitle}</div>
                        <div class="music-artist" title="${formando.musicArtist || 'Desconhecido'}">${formando.musicArtist || 'Artista Desconhecido'}</div>
                    </div>
                </div>
                <div class="snippet-box">
                    <span class="snippet-label">Trecho:</span>
                    <span class="snippet-value">${rangeStr}</span>
                </div>
            `;
        }

        // Seção de ações do card (com ícones de segurança se for visitante)
        let actionsHtml = '';
        if (hasMusic && videoId) {
            actionsHtml += `
                <button class="action-btn btn-play-snippet" onclick="PlayerManager.play(State.getById('${formando.id}'))">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Ouvir Trecho
                </button>
            `;
        } else {
            actionsHtml += `
                <button class="action-btn btn-play-snippet" onclick="UIManager.handleEditRequest('${formando.id}', 'cutter')">
                    🎬 Escolher Vídeo
                </button>
            `;
        }

        if (AuthManager.isAdmin) {
            actionsHtml += `
                <button class="action-btn btn-edit-card" onclick="UIManager.openModal('${formando.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Editar
                </button>
                <button class="action-btn btn-delete-card" onclick="UIManager.deleteFormando('${formando.id}')" title="Excluir">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
        } else {
            actionsHtml += `
                <button class="action-btn btn-edit-card" onclick="UIManager.handleEditRequest('${formando.id}')" title="Requer permissão de Admin">
                    🔒 Editar
                </button>
            `;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="formando-info">
                    <h3 class="formando-name" title="${formando.name}">${formando.name}</h3>
                    <div class="card-badges-row">
                        ${turmaBadge}
                        <span class="badge ${statusClass}">${statusLabel}</span>
                    </div>
                </div>
            </div>
            
            ${thumbHtml}

            <div class="music-details">
                ${musicHtml}
            </div>

            <div class="card-actions">
                ${actionsHtml}
            </div>
        `;

        return card;
    },

    handleEditRequest(id, tab = 'info') {
        AuthManager.requireAdmin(() => {
            this.openModal(id, tab);
        });
    },

    openModal(id = null, tabInitial = 'info') {
        this.form.reset();

        if (id) {
            const formando = State.getById(id);
            if (!formando) return;

            this.modalTitle.textContent = formando.name;
            this.modalSubtitle.textContent = `Turma ${formando.turma} • Painel de Edição da Música`;
            document.getElementById('formandoId').value = formando.id;
            document.getElementById('formandoName').value = formando.name;
            document.getElementById('formandoTurma').value = formando.turma || 'A';
            document.getElementById('musicTitle').value = formando.musicTitle || '';
            document.getElementById('musicArtist').value = formando.musicArtist || '';
            document.getElementById('musicLink').value = formando.musicLink || '';
            document.getElementById('musicMp3').value = formando.musicMp3 || '';
            document.getElementById('snippetStart').value = formando.snippetStart || '';
            document.getElementById('snippetEnd').value = formando.snippetEnd || '';
            document.getElementById('choiceStatus').value = formando.status || 'PENDENTE';

            const mp3Player = document.getElementById('mp3AudioPlayer');
            const mp3Wrapper = document.getElementById('mp3PlayerWrapper');
            if (formando.musicMp3) {
                mp3Player.src = formando.musicMp3;
                mp3Wrapper.style.display = 'block';
            } else {
                mp3Player.src = '';
                mp3Wrapper.style.display = 'none';
            }

            CutterManager.resetForStudent(formando);
        } else {
            this.modalTitle.textContent = "Cadastrar Formando";
            this.modalSubtitle.textContent = "Adicione um novo formando e escolha a sua música";
            document.getElementById('formandoId').value = '';
            document.getElementById('formandoTurma').value = this.activeTurma === 'todos' ? 'A' : this.activeTurma;
            document.getElementById('choiceStatus').value = 'PENDENTE';
            document.getElementById('mp3PlayerWrapper').style.display = 'none';
            CutterManager.resetForStudent(null);
        }

        const targetTabBtn = document.querySelector(`[data-modaltab="${tabInitial}"]`);
        if (targetTabBtn) targetTabBtn.click();

        this.modal.classList.add('active');
        if (tabInitial === 'info') {
            document.getElementById('formandoName').focus();
        }
    },

    closeModal() {
        CutterManager.stop();
        this.modal.classList.remove('active');
        this.form.reset();
    },

    async handleFormSubmit(e) {
        e.preventDefault();

        if (!AuthManager.isAdmin) {
            alert("Apenas o Administrador pode salvar alterações!");
            AuthManager.requireAdmin(() => {});
            return;
        }

        const id = document.getElementById('formandoId').value;
        const name = document.getElementById('formandoName').value.trim();
        const turma = document.getElementById('formandoTurma').value;
        const musicTitle = document.getElementById('musicTitle').value.trim();
        const musicArtist = document.getElementById('musicArtist').value.trim();
        const musicLink = document.getElementById('musicLink').value.trim();
        const musicMp3 = document.getElementById('musicMp3').value.trim();
        const snippetStart = document.getElementById('snippetStart').value.trim();
        const snippetEnd = document.getElementById('snippetEnd').value.trim();
        const status = document.getElementById('choiceStatus').value;

        if (!name) {
            alert("Nome do formando é obrigatório!");
            return;
        }

        if (musicLink && !getYouTubeId(musicLink)) {
            alert("Por favor, insira um link válido do YouTube (ex: https://www.youtube.com/watch?v=...)");
            return;
        }

        const data = {
            name,
            turma,
            musicTitle,
            musicArtist,
            musicLink,
            musicMp3,
            snippetStart,
            snippetEnd,
            status
        };

        if (musicTitle && status === 'PENDENTE') {
            data.status = 'ESCOLHIDO';
        }

        if (id) {
            State.update(id, data);
            if (currentPlayingId === id) {
                PlayerManager.stop();
            }
        } else {
            State.add(data);
        }

        this.closeModal();
        this.render();
    },

    deleteFormando(id) {
        if (!AuthManager.isAdmin) {
            alert("Apenas o Administrador pode excluir formandos!");
            return;
        }

        const formando = State.getById(id);
        if (!formando) return;

        if (confirm(`Tem certeza que deseja excluir o formando "${formando.name}"?`)) {
            if (currentPlayingId === id) {
                PlayerManager.stop();
            }
            State.delete(id);
            this.render();
        }
    },

    exportBackup() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(State.formandos, null, 4));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `backup-formandos-musicas.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    importBackup(e) {
        if (!AuthManager.isAdmin) {
            alert("Apenas o Administrador pode importar backups!");
            e.target.value = '';
            return;
        }

        const fileReader = new FileReader();
        const file = e.target.files[0];
        if (!file) return;

        fileReader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (Array.isArray(parsed)) {
                    const isValid = parsed.every(item => item.name && item.status);
                    if (isValid) {
                        if (confirm(`Deseja importar ${parsed.length} formandos? Isso atualizará o arquivo no site e a lista atual.`)) {
                            PlayerManager.stop();
                            CutterManager.stop();
                            State.formandos = parsed.map(item => ({
                                id: item.id || Date.now().toString() + Math.random().toString().slice(2, 5),
                                name: item.name,
                                turma: item.turma || 'A',
                                musicTitle: item.musicTitle || '',
                                musicArtist: item.musicArtist || '',
                                musicLink: item.musicLink || '',
                                musicMp3: item.musicMp3 || '',
                                snippetStart: item.snippetStart || '',
                                snippetEnd: item.snippetEnd || '',
                                status: item.status || 'PENDENTE',
                                createdAt: item.createdAt || new Date().toISOString()
                            }));
                            await State.save();
                            this.render();
                            alert("Importação concluída e salva no site com sucesso!");
                        }
                    } else {
                        alert("Arquivo inválido. Formato incorreto.");
                    }
                } else {
                    alert("Arquivo inválido. Formato incorreto.");
                }
            } catch (err) {
                alert("Erro ao ler o arquivo JSON: " + err.message);
            }
            e.target.value = '';
        };
        fileReader.readAsText(file);
    }
};

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    PlayerManager.init();
    CutterManager.init();
    ExportManager.init();
    UIManager.init();
    AuthManager.init();
    await State.init();
    UIManager.render();
});
