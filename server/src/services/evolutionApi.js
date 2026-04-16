const axios = require('axios');

class EvolutionApiService {
  constructor() {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrl || !apiKey) {
      console.warn('Evolution API not configured. Set EVOLUTION_API_URL and EVOLUTION_API_KEY.');
      this.client = null;
      return;
    }

    this.client = axios.create({
      baseURL: apiUrl,
      headers: { apikey: apiKey },
      timeout: 30000
    });
  }

  _ensureClient() {
    if (!this.client) {
      throw Object.assign(new Error('Evolution API not configured'), { statusCode: 503 });
    }
  }

  async createInstance(instanceName) {
    this._ensureClient();
    const { data } = await this.client.post('/instance/create', {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      rejectCall: false,
      groupsIgnore: true,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false
    });
    return data;
  }

  async getQRCode(instanceName) {
    this._ensureClient();
    const { data } = await this.client.get(`/instance/connect/${instanceName}`);
    return data;
  }

  async getConnectionState(instanceName) {
    this._ensureClient();
    const { data } = await this.client.get(`/instance/connectionState/${instanceName}`);
    return data;
  }

  async deleteInstance(instanceName) {
    this._ensureClient();
    const { data } = await this.client.delete(`/instance/delete/${instanceName}`);
    return data;
  }

  async sendText(instanceName, number, text) {
    this._ensureClient();
    const { data } = await this.client.post(`/message/sendText/${instanceName}`, {
      number,
      text,
      delay: 1000,
      linkPreview: false
    });
    return data;
  }

  async sendMedia(instanceName, number, mediaUrl, caption, mimetype = 'image/png') {
    this._ensureClient();
    const { data } = await this.client.post(`/message/sendMedia/${instanceName}`, {
      number,
      mediatype: 'image',
      mimetype,
      caption,
      media: mediaUrl,
      fileName: 'image.png'
    });
    return data;
  }

  async setWebhook(instanceName, webhookUrl) {
    this._ensureClient();
    const { data } = await this.client.post(`/webhook/set/${instanceName}`, {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: true,
      webhookBase64: false,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
    });
    return data;
  }

  /**
   * Garante que a instância existe e está pronta para conectar.
   * Se a instância não existir (404) ou a Evolution responder com erro
   * 500/erro de servidor, recria a instância e reaplica o webhook.
   *
   * Retorna: { state, recreated, created }
   *   - state: 'open' | 'connecting' | 'close' | undefined
   *   - recreated: true se a instância precisou ser recriada
   *   - created: payload da Evolution quando criada/recriada
   */
  async ensureInstanceReady(instanceName, webhookUrl) {
    this._ensureClient();

    // Helper: classifica se um erro indica "instância ausente / Evolution quebrada"
    // e justifica recriar. 404 (não existe), 500 (instância corrompida no Evolution),
    // 502/503/504 (servidor indisponível mas vamos tentar recriar).
    const shouldRecreate = (err) => {
      const status = err?.response?.status;
      if (!status) return false; // erro de rede sem resposta — NÃO recria
      return status === 404 || status >= 500;
    };

    // 1) Tenta obter o estado atual
    try {
      const stateData = await this.getConnectionState(instanceName);
      const state = stateData?.instance?.state;
      return { state, recreated: false };
    } catch (err) {
      if (!shouldRecreate(err)) {
        throw err; // 401/403/etc — propaga
      }
      // 404 ou 5xx → recria
    }

    // 2) Recria a instância
    let created;
    try {
      created = await this.createInstance(instanceName);
    } catch (createErr) {
      // Se já existe (Evolution retorna 403/conflict), seguimos para o webhook+QR
      const status = createErr?.response?.status;
      if (status !== 403 && status !== 409) {
        throw createErr;
      }
    }

    // 3) Reaplica o webhook (essencial para receber mensagens via edge function)
    if (webhookUrl) {
      try {
        await this.setWebhook(instanceName, webhookUrl);
      } catch (whErr) {
        console.warn(`[evolutionApi.ensureInstanceReady] setWebhook falhou para ${instanceName}:`, whErr.message);
      }
    }

    return { state: 'connecting', recreated: true, created };
  }
}

module.exports = new EvolutionApiService();
