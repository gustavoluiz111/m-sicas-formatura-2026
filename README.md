# 🎓 FormandoMusix - Painel de Músicas de Formatura 2026

Sistema web interativo para gerenciamento das músicas de entrada dos formandos das turmas do **3º Ano A** e **3º Ano B** da formatura de 2026.

## 🌟 Funcionalidades

- **Controle por Turmas:** Abas dedicadas para o **3º Ano A**, **3º Ano B** e visão geral com **Todos Juntos**.
- **Player Integrado e Cortador de Segundos:** Reprodução direta de vídeos do YouTube e corte fino com marcação de início e fim no segundo exato (`0:45 - 1:15`).
- **Detecção Automática do YouTube:** Ao colar qualquer link de vídeo, o sistema detecta automaticamente o nome da música e o artista.
- **Central de Exportação e Relatórios:**
  - 📄 **Exportação em TXT:** Lista formatada e organizada por turma.
  - 📊 **Planilha Excel / CSV:** Arquivo formatado com codificação UTF-8 compatível com Excel e Google Sheets.
  - 💬 **Compartilhamento no WhatsApp:** Mensagem com resumo formatado pronto para envio.
  - 🖨️ **Impressão / PDF:** Layout A4 pronto para impressão física ou geração de PDF.
- **Segurança com Acesso de Administrador:**
  - Modo Visitante para consulta e audição das músicas.
  - Modo Administrador protegido por senha para cadastrar, editar, aprovar e excluir registros.
- **Persistência de Dados:** Salva os dados no arquivo `data/formandos.json` e no navegador para nunca perder as alterações.
- **Design 100% Responsivo:** Adaptado para celulares, tablets e computadores em tema escuro moderno (*Dark Glassmorphism*).

## 🚀 Como Executar Localmente

### Usando Python:
```bash
python server.py
```
Acesse no seu navegador: `http://localhost:8000`

### Acesso de Administrador
- **Senha padrão inicial:** `admin2026`
- A senha pode ser alterada diretamente pelo painel administrativo clicando na engrenagem ⚙️ no topo da página.
