const axios = require('axios');

function trimTrailingSlashes(value = '') {
  return value.replace(/\/+$/, '');
}

function extractFlowIdentity(source = '') {
  const namespace = source.match(/^\s*namespace:\s*([^\r\n]+)/m)?.[1]?.trim();
  const id = source.match(/^\s*id:\s*([^\r\n]+)/m)?.[1]?.trim();

  if (!namespace || !id) {
    return null;
  }

  return { namespace, id };
}

class KestraApiService {
  constructor() {
    const apiUrl = process.env.KESTRA_API_URL;
    const username = process.env.KESTRA_USERNAME;
    const password = process.env.KESTRA_PASSWORD;

    if (!apiUrl || !username || !password) {
      console.warn('Kestra API not configured. Set KESTRA_API_URL, KESTRA_USERNAME and KESTRA_PASSWORD.');
      this.client = null;
      this.baseURL = null;
      this.tenant = process.env.KESTRA_TENANT || 'main';
      return;
    }

    this.baseURL = trimTrailingSlashes(apiUrl);
    this.tenant = process.env.KESTRA_TENANT || 'main';
    this.client = axios.create({
      baseURL: this.baseURL,
      auth: { username, password },
      timeout: 30000
    });
  }

  _ensureClient() {
    if (!this.client) {
      throw Object.assign(new Error('Kestra API not configured'), { statusCode: 503 });
    }
  }

  async _requestWithFallback(config) {
    this._ensureClient();

    const {
      method,
      pathWithTenant,
      pathWithoutTenant,
      params,
      data,
      headers
    } = config;

    try {
      const response = await this.client.request({
        method,
        url: pathWithTenant,
        params,
        data,
        headers
      });
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404 || !pathWithoutTenant) {
        throw error;
      }

      const response = await this.client.request({
        method,
        url: pathWithoutTenant,
        params,
        data,
        headers
      });
      return response.data;
    }
  }

  async testConnection() {
    const data = await this._requestWithFallback({
      method: 'get',
      pathWithTenant: `/api/v1/${this.tenant}/flows/search`,
      pathWithoutTenant: '/api/v1/flows/search',
      params: { page: 1, size: 1 }
    });

    return {
      connected: true,
      baseURL: this.baseURL,
      tenant: this.tenant,
      authMode: 'basic',
      sample: data
    };
  }

  async executeFlow(namespace, flowId, options = {}) {
    const { wait = false, inputs, labels } = options;

    return this._requestWithFallback({
      method: 'post',
      pathWithTenant: `/api/v1/${this.tenant}/executions/${namespace}/${flowId}`,
      pathWithoutTenant: `/api/v1/executions/${namespace}/${flowId}`,
      params: { wait },
      data: {
        ...(inputs ? { inputs } : {}),
        ...(labels ? { labels } : {})
      }
    });
  }

  async getExecution(executionId) {
    return this._requestWithFallback({
      method: 'get',
      pathWithTenant: `/api/v1/${this.tenant}/executions/${executionId}`,
      pathWithoutTenant: `/api/v1/executions/${executionId}`
    });
  }

  async upsertFlow(source) {
    try {
      return await this._requestWithFallback({
        method: 'post',
        pathWithTenant: `/api/v1/${this.tenant}/flows`,
        pathWithoutTenant: '/api/v1/flows',
        data: source,
        headers: {
          'Content-Type': 'application/x-yaml'
        }
      });
    } catch (error) {
      const alreadyExists = error.response?.status === 422 && /already exists/i.test(error.response?.data?.message || '');
      const identity = extractFlowIdentity(source);

      if (!alreadyExists || !identity) {
        throw error;
      }

      return this._requestWithFallback({
        method: 'put',
        pathWithTenant: `/api/v1/${this.tenant}/flows/${identity.namespace}/${identity.id}`,
        pathWithoutTenant: `/api/v1/flows/${identity.namespace}/${identity.id}`,
        data: source,
        headers: {
          'Content-Type': 'application/x-yaml'
        }
      });
    }
  }
}

module.exports = new KestraApiService();
