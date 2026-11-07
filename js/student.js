// ==========================================================
// JS COM REGRA DE 45 SEGUNDOS, YOUTUBE EMBUTIDO E GERADOR PNG
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
let ytPlayer = null;
let playerTimer = null;

// Utilitários de tempo e string
function normalizar(txt) {
    return (txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function parseSegundos(tempoStr) {
    if (!tempoStr) return 0;
    tempoStr = tempoStr.toString().trim();
    if (tempoStr.includes(':')) {
        const parts = tempoStr.split(':');
        return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    return parseInt(tempoStr, 10) || 0;
}

function formatarTempo(segundos) {
    segundos = Math.max(0, Math.floor(segundos || 0));
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
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
    setTimeout(() => t.classList.remove('show'), 3500);
}

// Carregar Dados
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

// Renderizar Alunos da Turma
function renderAlunos(busca = '') {
    const listaEl = document.getElementById('alunosList');
    const nomes = currentTurma === 'A' ? TURMA_A : TURMA_B;
    const q = normalizar(busca);

    const filtrados = nomes.filter(nome => normalizar(nome).includes(q));

    if (filtrados.length === 0) {
        listaEl.innerHTML = `<p style="text-align:center; padding:30px; color:#7E8DA6;">Nenhum formando encontrado com esse nome.</p>`;
        return;
    }

    listaEl.innerHTML = filtrados.map(nome => {
        const dados = todosFormandos.find(f => normalizar(f.name) === normalizar(nome) && f.turma === currentTurma) || {};
        const musica = dados.musicTitle ? `Música: ${dados.musicTitle} ${dados.musicArtist ? '— ' + dados.musicArtist : ''}` : 'Nenhuma música escolhida';
        const status = dados.status || 'PENDENTE';
        const badgeClass = status === 'APROVADO' ? 'badge-aprovado' : (status === 'ESCOLHIDO' ? 'badge-escolhido' : 'badge-pendente');
        const statusLabel = status === 'APROVADO' ? 'APROVADO' : (status === 'ESCOLHIDO' ? 'EM ANÁLISE' : 'PENDENTE');

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

// Abrir Modal
window.abrirModalAluno = function(nomeEncoded) {
    const nome = decodeURIComponent(nomeEncoded);
    const dados = todosFormandos.find(f => normalizar(f.name) === normalizar(nome) && f.turma === currentTurma) || {
        name: nome,
        turma: currentTurma,
        musicTitle: '',
        musicArtist: '',
        musicLink: '',
        snippetStart: '0:00',
        snippetEnd: '0:45',
        status: 'PENDENTE'
    };

    currentAluno = dados;

    document.getElementById('modalTurmaTag').textContent = `TURMA ${currentTurma}`;
    document.getElementById('modalAlunoNome').textContent = nome;

    // Situação
    const sitStatus = document.getElementById('sitStatusTag');
    const sitTxt = document.getElementById('sitMusicaTxt');
    const btnPng = document.getElementById('btnDownloadCardPng');

    if (dados.status === 'APROVADO') {
        sitStatus.textContent = 'MÚSICA APROVADA';
        sitStatus.style.color = 'var(--gold-primary)';
        sitTxt.textContent = `${dados.musicTitle} (${dados.musicArtist || 'Artista'}) • [${dados.snippetStart || '0:00'} a ${dados.snippetEnd || '0:45'}]`;
        btnPng.style.display = 'block';
    } else if (dados.status === 'ESCOLHIDO') {
        sitStatus.textContent = 'SUGESTÃO EM ANÁLISE';
        sitStatus.style.color = '#93C5FD';
        sitTxt.textContent = `${dados.musicTitle} (${dados.musicArtist || 'Artista'}) • [${dados.snippetStart || '0:00'} a ${dados.snippetEnd || '0:45'}]`;
        btnPng.style.display = 'block';
    } else {
        sitStatus.textContent = 'PENDENTE';
        sitStatus.style.color = '#FBBF24';
        sitTxt.textContent = 'Você ainda não enviou sua sugestão.';
        btnPng.style.display = 'none';
    }

    // Formulário
    const startStr = dados.snippetStart || '0:00';
    const startSec = parseSegundos(startStr);
    const endStr = dados.snippetEnd || formatarTempo(startSec + 45);

    document.getElementById('inputYtLink').value = dados.musicLink || '';
    document.getElementById('inputNomeMusica').value = dados.musicTitle || '';
    document.getElementById('inputArtista').value = dados.musicArtist || '';
    document.getElementById('inputInicio').value = startStr;
    document.getElementById('inputFim').value = endStr;
    document.getElementById('detectResult').textContent = '';

    // Carrega vídeo no player se houver link
    if (dados.musicLink && getYouTubeId(dados.musicLink)) {
        carregarVideoNoPlayer(dados.musicLink);
    } else {
        document.getElementById('videoCutterArea').style.display = 'none';
    }

    document.getElementById('modalAluno').classList.add('open');
};

function fecharModal() {
    if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
    clearInterval(playerTimer);
    document.getElementById('modalAluno').classList.remove('open');
}

// Player do YouTube Embutido
function carregarVideoNoPlayer(url) {
    const vidId = getYouTubeId(url);
    if (!vidId) return;

    document.getElementById('videoCutterArea').style.display = 'block';

    if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(vidId);
    } else if (typeof YT !== 'undefined' && YT.loaded) {
        ytPlayer = new YT.Player('youtubePlayerTarget', {
            height: '100%',
            width: '100%',
            videoId: vidId,
            playerVars: { 'autoplay': 1, 'controls': 1, 'modestbranding': 1, 'rel': 0 },
            events: {
                'onReady': () => iniciarMonitorTempo()
            }
        });
    }

    iniciarMonitorTempo();
}

function iniciarMonitorTempo() {
    clearInterval(playerTimer);
    playerTimer = setInterval(() => {
        if (ytPlayer && ytPlayer.getCurrentTime) {
            const cur = ytPlayer.getCurrentTime();
            document.getElementById('liveCurrentTime').textContent = formatarTempo(cur);
        }
    }, 300);
}

// GERAÇÃO DO CARTÃO EM PNG (PARA O ALUNO GUARDAR DE RECORDAÇÃO)
function gerarCartaoPng() {
    if (!currentAluno || !currentAluno.musicTitle) return;

    const canvas = document.getElementById('cardCanvas');
    const ctx = canvas.getContext('2d');

    // Fundo Azul Escuro Elegante
    const bgGradient = ctx.createLinearGradient(0, 0, 900, 540);
    bgGradient.addColorStop(0, '#030814');
    bgGradient.addColorStop(0.5, '#081126');
    bgGradient.addColorStop(1, '#050c1e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 900, 540);

    // Borda Dourada Nobre
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 860, 500);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 30, 840, 480);

    // Cabeçalho
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('COMISSÃO DE FORMATURA 2026', 60, 80);

    ctx.fillStyle = '#C0C0C0';
    ctx.font = '16px "Space Grotesk", sans-serif';
    ctx.fillText(`TRILHA SONORA OFICIAL DE ENTRADA • 3º ANO ${currentAluno.turma}`, 60, 110);

    // Divisória Dourada
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.beginPath();
    ctx.moveTo(60, 135);
    ctx.lineTo(840, 135);
    ctx.stroke();

    // Nome do Formando
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillText(currentAluno.name, 60, 195);

    // Música Selecionada
    ctx.fillStyle = '#D4AF37';
    ctx.font = '16px "Space Grotesk", sans-serif';
    ctx.fillText('MÚSICA ESCOLHIDA:', 60, 255);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Outfit", sans-serif';
    ctx.fillText(currentAluno.musicTitle, 60, 298);

    // Artista
    ctx.fillStyle = '#C0C0C0';
    ctx.font = '22px "Outfit", sans-serif';
    ctx.fillText(currentAluno.musicArtist || 'Artista Não Informado', 60, 335);

    // Trecho de 45 segundos
    ctx.fillStyle = '#0F2B5C';
    ctx.fillRect(60, 370, 480, 55);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 370, 480, 55);

    ctx.fillStyle = '#F3E5AB';
    ctx.font = 'bold 18px "Space Grotesk", sans-serif';
    ctx.fillText(`TRECHO DE ENTRADA: ${currentAluno.snippetStart || '0:00'} até ${currentAluno.snippetEnd || '0:45'} (45s)`, 80, 405);

    // Selo de Registro
    ctx.fillStyle = '#D4AF37';
    ctx.font = '14px "Space Grotesk", sans-serif';
    ctx.fillText('REGISTRADO NO SISTEMA OFICIAL', 60, 475);

    ctx.fillStyle = '#7E8DA6';
    ctx.font = '12px "Space Grotesk", sans-serif';
    ctx.fillText(`STATUS: ${currentAluno.status || 'PENDENTE'} • REGISTRO: ${new Date().toLocaleDateString('pt-BR')}`, 60, 495);

    // Download automático do PNG
    const link = document.createElement('a');
    link.download = `Comprovante_Musica_${currentAluno.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Cartão PNG baixado com sucesso!');
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();

    // Botões de Turma
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

    // Voltar Turma
    document.getElementById('btnVoltarTurma').addEventListener('click', () => {
        document.getElementById('stepAlunos').classList.remove('active');
        document.getElementById('stepTurma').classList.add('active');
    });

    // Busca
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderAlunos(e.target.value);
    });

    // Fechar Modal
    document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
    document.getElementById('modalAluno').addEventListener('click', (e) => {
        if (e.target.id === 'modalAluno') fecharModal();
    });

    // Botão Procurar Vídeo
    document.getElementById('btnProcurarVideo').addEventListener('click', () => {
        const input = document.getElementById('inputYtLink');
        const url = input.value.trim();
        const nomeMusica = document.getElementById('inputNomeMusica').value.trim();
        const artista = document.getElementById('inputArtista').value.trim();

        if (url && getYouTubeId(url)) {
            carregarVideoNoPlayer(url);
            showToast('Vídeo carregado no reprodutor abaixo!');
        } else {
            const query = (nomeMusica + ' ' + artista).trim() || 'musica formatura';
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
            showToast('Pesquisa aberta! Copie o link do vídeo e cole aqui.');
        }
    });

    // Botão Detectar
    document.getElementById('btnDetectar').addEventListener('click', async () => {
        const url = document.getElementById('inputYtLink').value.trim();
        const resEl = document.getElementById('detectResult');

        if (!url) {
            alert('Cole o link do YouTube primeiro!');
            return;
        }

        resEl.textContent = 'Buscando dados da música...';
        carregarVideoNoPlayer(url);

        try {
            const res = await fetch(`/api/youtube-info?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.song) document.getElementById('inputNomeMusica').value = data.song;
                if (data.artist) document.getElementById('inputArtista').value = data.artist;
                resEl.textContent = `Identificado: ${data.song || ''} ${data.artist ? '• ' + data.artist : ''}`;
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
                        resEl.textContent = 'Identificado!';
                        return;
                    }
                }
            } catch (err) {}
        }

        resEl.textContent = 'Vídeo carregado! Digite o nome da música e artista abaixo.';
    });

    // REGRA DE 45 SEGUNDOS: Ao mudar início, calcula fim automaticamente
    document.getElementById('inputInicio').addEventListener('input', (e) => {
        const seg = parseSegundos(e.target.value);
        document.getElementById('inputFim').value = formatarTempo(seg + 45);
    });

    // Botões de carimbar tempo
    document.getElementById('btnStampStart').addEventListener('click', () => {
        if (!ytPlayer || !ytPlayer.getCurrentTime) return;
        const cur = ytPlayer.getCurrentTime();
        document.getElementById('inputInicio').value = formatarTempo(cur);
        document.getElementById('inputFim').value = formatarTempo(cur + 45);
        showToast('Início marcado! Fim ajustado para exatamente 45 segundos.');
    });

    document.getElementById('btnStampEnd').addEventListener('click', () => {
        if (!ytPlayer || !ytPlayer.getCurrentTime) return;
        const cur = ytPlayer.getCurrentTime();
        document.getElementById('inputFim').value = formatarTempo(cur);
        document.getElementById('inputInicio').value = formatarTempo(Math.max(0, cur - 45));
        showToast('Fim marcado! Início ajustado para exatamente 45 segundos.');
    });

    // Download do Cartão PNG
    document.getElementById('btnDownloadCardPng').addEventListener('click', gerarCartaoPng);

    // Salvar Sugestão
    document.getElementById('formMusica').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentAluno) return;

        const musica = document.getElementById('inputNomeMusica').value.trim();
        const artista = document.getElementById('inputArtista').value.trim();
        const link = document.getElementById('inputYtLink').value.trim();
        const inicioStr = document.getElementById('inputInicio').value.trim() || '0:00';
        
        // Garante a regra dos 45 segundos no salvamento
        const inicioSeg = parseSegundos(inicioStr);
        const fimStr = formatarTempo(inicioSeg + 45);

        const atualizado = {
            id: currentAluno.id || `seed_${currentTurma}_${normalizar(currentAluno.name).replace(/\s+/g, '_')}`,
            name: currentAluno.name,
            turma: currentTurma,
            musicTitle: musica,
            musicArtist: artista,
            musicLink: link,
            snippetStart: formatarTempo(inicioSeg),
            snippetEnd: fimStr,
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

        currentAluno = atualizado;
        renderAlunos(document.getElementById('searchInput').value);
        showToast('Sugestão de música salva com sucesso! ✓');

        // Exibe botão de baixar cartão
        document.getElementById('btnDownloadCardPng').style.display = 'block';
    });
});
