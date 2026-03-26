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
}

module.exports = new EvolutionApiService();
