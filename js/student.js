// ==========================================================
// JS DIRETO, SIMPLES E 100% FUNCIONAL
// ==========================================================

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

let currentTurma = 'A';
let currentAluno = null;
let todosFormandos = [];

// Carregar dados salvos
async function carregarDados() {
    try {
        const res = await fetch(`/api/formandos?t=${Date.now()}`);
        if (res.ok) {
            todosFormandos = await res.json();
            return;
        }
    } catch (e) {}

    try {
        const res2 = await fetch(`data/formandos.json?t=${Date.now()}`);
        if (res2.ok) {
            todosFormandos = await res2.json();
        }
    } catch (e) {}
}

function normalizar(txt) {
    return (txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.trim().match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Renderizar Alunos da Turma
function renderAlunos(busca = '') {
    const listaEl = document.getElementById('alunosList');
    const nomes = currentTurma === 'A' ? TURMA_A : TURMA_B;
    const q = normalizar(busca);

    const filtrados = nomes.filter(nome => normalizar(nome).includes(q));

    if (filtrados.length === 0) {
        listaEl.innerHTML = `<p style="text-align:center; padding:30px; color:#64748b;">Nenhum formando encontrado com esse nome.</p>`;
        return;
    }

    listaEl.innerHTML = filtrados.map(nome => {
        const dados = todosFormandos.find(f => normalizar(f.name) === normalizar(nome) && f.turma === currentTurma) || {};
        const musica = dados.musicTitle ? `🎵 ${dados.musicTitle}` : 'Nenhuma música escolhida';
        const status = dados.status || 'PENDENTE';
        const badgeClass = status === 'APROVADO' ? 'badge-aprovado' : (status === 'ESCOLHIDO' ? 'badge-escolhido' : 'badge-pendente');
        const statusLabel = status === 'APROVADO' ? 'APROVADO 🟢' : (status === 'ESCOLHIDO' ? 'EM ANÁLISE 🔵' : 'PENDENTE 🟡');

        return `
            <div class="aluno-item" onclick="abrirModalAluno('${encodeURIComponent(nome)}')">
                <div class="aluno-info">
                    <h4>${nome}</h4>
                    <p>${musica}</p>
                </div>
                <span class="aluno-status-badge ${badgeClass}">${statusLabel}</span>
            </div>
        `;
    }).join('');
}

// Abrir Modal do Aluno
window.abrirModalAluno = function(nomeEncoded) {
    const nome = decodeURIComponent(nomeEncoded);
    const dados = todosFormandos.find(f => normalizar(f.name) === normalizar(nome) && f.turma === currentTurma) || {
        name: nome,
        turma: currentTurma,
        musicTitle: '',
        musicArtist: '',
        musicLink: '',
        snippetStart: '',
        snippetEnd: '',
        status: 'PENDENTE'
    };

    currentAluno = dados;

    document.getElementById('modalTurmaTag').textContent = `TURMA ${currentTurma}`;
    document.getElementById('modalAlunoNome').textContent = nome;

    // Situação
    const sitStatus = document.getElementById('sitStatusTag');
    const sitTxt = document.getElementById('sitMusicaTxt');

    if (dados.status === 'APROVADO') {
        sitStatus.textContent = 'MÚSICA APROVADA 🟢';
        sitStatus.style.color = '#34d399';
        sitTxt.textContent = `${dados.musicTitle} (${dados.musicArtist || 'Artista'})`;
    } else if (dados.status === 'ESCOLHIDO') {
        sitStatus.textContent = 'SUGESTÃO EM ANÁLISE 🔵';
        sitStatus.style.color = '#93c5fd';
        sitTxt.textContent = `${dados.musicTitle} (${dados.musicArtist || 'Artista'})`;
    } else {
        sitStatus.textContent = 'PENDENTE 🟡';
        sitStatus.style.color = '#fbbf24';
        sitTxt.textContent = 'Você ainda não enviou sua música.';
    }

    // Formulário
    document.getElementById('inputYtLink').value = dados.musicLink || '';
    document.getElementById('inputNomeMusica').value = dados.musicTitle || '';
    document.getElementById('inputArtista').value = dados.musicArtist || '';
    document.getElementById('inputInicio').value = dados.snippetStart || '';
    document.getElementById('inputFim').value = dados.snippetEnd || '';
    document.getElementById('detectResult').textContent = '';

    document.getElementById('modalAluno').classList.add('open');
};

function fecharModal() {
    document.getElementById('modalAluno').classList.remove('open');
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();

    // Botões Turma A e B
    document.querySelectorAll('.turma-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTurma = btn.dataset.turma;
            document.getElementById('turmaActiveBadge').textContent = `3º ANO ${currentTurma}`;
            document.getElementById('searchInput').value = '';

            document.getElementById('stepTurma').classList.remove('active');
            document.getElementById('stepAlunos').classList.add('active');

            renderAlunos();
        });
    });

    // Voltar para tela de turmas
    document.getElementById('btnVoltarTurma').addEventListener('click', () => {
        document.getElementById('stepAlunos').classList.remove('active');
        document.getElementById('stepTurma').classList.add('active');
    });

    // Busca
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderAlunos(e.target.value);
    });

    // Fechar modal
    document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
    document.getElementById('modalAluno').addEventListener('click', (e) => {
        if (e.target.id === 'modalAluno') fecharModal();
    });

    // Detectar YouTube
    document.getElementById('btnDetectar').addEventListener('click', async () => {
        const url = document.getElementById('inputYtLink').value.trim();
        const resEl = document.getElementById('detectResult');

        if (!url) {
            alert('Cole o link do YouTube primeiro!');
            return;
        }

        resEl.textContent = 'Buscando dados da música...';

        try {
            const res = await fetch(`/api/youtube-info?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.song) document.getElementById('inputNomeMusica').value = data.song;
                if (data.artist) document.getElementById('inputArtista').value = data.artist;
                resEl.textContent = `✨ Reconhecido: ${data.song || ''} ${data.artist ? '• ' + data.artist : ''}`;
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
                        document.getElementById('inputNomeMusica').value = parts.length > 1 ? parts[1].trim() : d2.title;
                        document.getElementById('inputArtista').value = parts.length > 1 ? parts[0].trim() : (d2.author_name || '');
                        resEl.textContent = '✨ Reconhecido!';
                        return;
                    }
                }
            } catch (err) {}
        }

        resEl.textContent = 'Preencha o nome da música e artista abaixo.';
    });

    // Salvar formulário
    document.getElementById('formMusica').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentAluno) return;

        const musica = document.getElementById('inputNomeMusica').value.trim();
        const artista = document.getElementById('inputArtista').value.trim();
        const link = document.getElementById('inputYtLink').value.trim();
        const inicio = document.getElementById('inputInicio').value.trim();
        const fim = document.getElementById('inputFim').value.trim();

        const atualizado = {
            id: currentAluno.id || `seed_${currentTurma}_${normalizar(currentAluno.name).replace(/\s+/g, '_')}`,
            name: currentAluno.name,
            turma: currentTurma,
            musicTitle: musica,
            musicArtist: artista,
            musicLink: link,
            snippetStart: inicio,
            snippetEnd: fim,
            status: currentAluno.status === 'APROVADO' ? 'APROVADO' : 'ESCOLHIDO',
            updatedAt: new Date().toISOString()
        };

        const idx = todosFormandos.findIndex(f => normalizar(f.name) === normalizar(atualizado.name) && f.turma === currentTurma);
        if (idx !== -1) {
            todosFormandos[idx] = atualizado;
        } else {
            todosFormandos.push(atualizado);
        }

        try {
            await fetch('/api/formandos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todosFormandos)
            });
        } catch (e) {}

        localStorage.setItem('formando_musix_data_v2', JSON.stringify(todosFormandos));

        fecharModal();
        renderAlunos(document.getElementById('searchInput').value);
        showToast('Música salva com sucesso! ✓');
    });
});
