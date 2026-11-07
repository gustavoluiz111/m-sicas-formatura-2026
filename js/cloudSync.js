// ==========================================================
// cloudSync.js — Sincronização em Nuvem em Tempo Real
// Permite que qualquer pessoa de qualquer lugar salve e veja
// as alterações instantaneamente sem depender de servidor local
// ==========================================================

const CloudSync = {
    // Banco em Nuvem Global
    cloudApiUrl: 'https://api.restful-api.dev/objects/ff808181a09d98f701a1b7dfd29c5f58',
    // Canal Realtime WebSockets / SSE
    realtimeTopic: 'https://ntfy.sh/formatura_2026_oficial_sync_stream',
    eventSource: null,
    onRemoteUpdateCallback: null,

    // Inicializa a escuta em tempo real (Server-Sent Events)
    initRealtime(onUpdate) {
        this.onRemoteUpdateCallback = onUpdate;
        try {
            if (window.EventSource) {
                if (this.eventSource) this.eventSource.close();
                this.eventSource = new EventSource(`${this.realtimeTopic}/sse`);
                this.eventSource.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload && payload.message) {
                            const data = JSON.parse(payload.message);
                            if (data && data.student) {
                                if (this.onRemoteUpdateCallback) {
                                    this.onRemoteUpdateCallback(data.student);
                                }
                            }
                        }
                    } catch (e) {}
                };
                this.eventSource.onerror = () => {
                    // Reconexão suave em caso de queda de rede
                    setTimeout(() => this.initRealtime(onUpdate), 5000);
                };
            }
        } catch (err) {}
    },

    // Carrega todas as escolhas salvas na nuvem
    async fetchCloudChoices() {
        try {
            const res = await fetch(`${this.cloudApiUrl}?t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                if (json && json.data) {
                    return json.data;
                }
            }
        } catch (e) {
            console.warn("Nuvem temporariamente inacessível, usando cache local.");
        }
        return null;
    },

    // Salva ou atualiza a escolha de um aluno na nuvem e notifica todos em tempo real
    async saveStudentToCloud(student) {
        const studentKey = (student.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '_');

        // 1. Notifica em tempo real via SSE
        try {
            fetch(this.realtimeTopic, {
                method: 'POST',
                body: JSON.stringify({ type: 'UPDATE', student: student }),
                headers: { 'Title': 'update' }
            }).catch(() => {});
        } catch(e) {}

        // 2. Persiste no banco de dados na nuvem
        try {
            const current = (await this.fetchCloudChoices()) || {};
            current[studentKey] = student;

            await fetch(this.cloudApiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'formatura_2026_escolhas',
                    data: current
                })
            });
            return true;
        } catch(err) {
            console.warn("Falha ao persistir na nuvem:", err);
            return false;
        }
    }
};

window.CloudSync = CloudSync;
