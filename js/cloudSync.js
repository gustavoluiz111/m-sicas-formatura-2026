// ==========================================================
// cloudSync.js – Sincronização em Tempo Real via Firebase RTDB
// Dados persistem globalmente e atualizam em tempo real
// ==========================================================

const CloudSync = {
    db: null,
    onRemoteUpdateCallback: null,
    _listener: null,

    // Inicializa o Firebase (chamado antes de qualquer operação)
    init() {
        if (typeof firebase === 'undefined') {
            console.error('[CloudSync] Firebase SDK não carregado!');
            return false;
        }
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp({
                    apiKey: "AIzaSyATU_aqrT0Z2R-1VitPKGvEAsl5ARq2fqE",
                    authDomain: "musicas-b2233.firebaseapp.com",
                    databaseURL: "https://musicas-b2233-default-rtdb.firebaseio.com",
                    projectId: "musicas-b2233",
                    storageBucket: "musicas-b2233.firebasestorage.app",
                    messagingSenderId: "811946327519",
                    appId: "1:811946327519:web:27a28a9960524fcefed86a"
                });
            }
            this.db = firebase.database();
            console.log('[CloudSync] Firebase RTDB conectado com sucesso!');
            return true;
        } catch (err) {
            console.error('[CloudSync] Erro ao inicializar Firebase:', err);
            return false;
        }
    },

    // Normaliza o nome do aluno para usar como chave no banco
    _makeKey(name) {
        return (name || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    },

    // Carrega todas as escolhas salvas no Firebase
    async fetchCloudChoices() {
        if (!this.db) this.init();
        if (!this.db) return null;
        try {
            const snap = await this.db.ref('formandos_escolhas').once('value');
            const val = snap.val();
            if (val) {
                console.log('[CloudSync] Dados carregados do Firebase:', Object.keys(val).length, 'entradas');
                return val;
            }
            return {};
        } catch (err) {
            console.warn('[CloudSync] Erro ao carregar dados do Firebase:', err);
            return null;
        }
    },

    // Salva ou atualiza a escolha de um aluno no Firebase
    async saveStudentToCloud(student) {
        if (!this.db) this.init();
        if (!this.db) return false;
        const key = this._makeKey(student.name || student.nome || '');
        if (!key) {
            console.warn('[CloudSync] Nome do aluno inválido para salvar.');
            return false;
        }
        try {
            await this.db.ref('formandos_escolhas/' + key).set(student);
            console.log('[CloudSync] Aluno salvo no Firebase:', key);
            return true;
        } catch (err) {
            console.error('[CloudSync] Erro ao salvar aluno no Firebase:', err);
            return false;
        }
    },

    // Inicializa escuta em tempo real de alterações no Firebase
    initRealtime(onUpdate) {
        if (!this.db) this.init();
        if (!this.db) return;
        this.onRemoteUpdateCallback = onUpdate;

        // Remove listener anterior se existir
        if (this._listener) {
            this.db.ref('formandos_escolhas').off('child_changed', this._listener);
            this.db.ref('formandos_escolhas').off('child_added', this._listener);
        }

        // Escuta qualquer mudança (atualização ou novo aluno)
        const handler = (snap) => {
            const student = snap.val();
            if (student && this.onRemoteUpdateCallback) {
                this.onRemoteUpdateCallback(student);
            }
        };

        this._listener = handler;
        this.db.ref('formandos_escolhas').on('child_changed', handler);
        this.db.ref('formandos_escolhas').on('child_added', handler);

        console.log('[CloudSync] Escuta em tempo real ativada (Firebase RTDB)');
    },

    // Atualiza o indicador visual de conexão (syncPill no admin)
    _updateSyncIndicator(online) {
        const dot = document.querySelector('.sync-dot');
        const text = document.getElementById('syncText');
        if (dot && text) {
            if (online) {
                dot.style.backgroundColor = '#4ade80';
                text.textContent = 'Firebase Online';
            } else {
                dot.style.backgroundColor = '#f87171';
                text.textContent = 'Reconectando...';
            }
        }
    }
};

// Expõe globalmente
window.CloudSync = CloudSync;

// Auto-inicializa quando o DOM estiver pronto (se Firebase já carregado)
document.addEventListener('DOMContentLoaded', function () {
    if (typeof firebase !== 'undefined') {
        CloudSync.init();
        // Verifica conectividade em tempo real
        if (CloudSync.db) {
            CloudSync.db.ref('.info/connected').on('value', function (snap) {
                CloudSync._updateSyncIndicator(snap.val() === true);
            });
        }
    }
});
