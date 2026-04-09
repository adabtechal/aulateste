import axios from 'axios';
import { supabase } from '../lib/supabase';

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredUrl) {
    return '/api';
  }

  if (typeof window !== 'undefined') {
    const isRemoteApp = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const pointsToLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(configuredUrl);

    if (isRemoteApp && pointsToLocalhost) {
      return '/api';
    }
  }

  return configuredUrl;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Lê o access_token direto do localStorage — evita o lock interno do SDK
// Supabase v2 (`getSession()` pode travar em refresh concorrente). O SDK armazena
// a sessão em `sb-<projectRef>-auth-token` como JSON string.
function readTokenFromLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const projectRef = import.meta.env.VITE_SUPABASE_URL?.match(/https?:\/\/([^.]+)\./)?.[1];
    if (!projectRef) return null;
    const raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

// Interceptor: adiciona token JWT do Supabase em todas as requisições.
// Primário: localStorage (rápido, sem lock). Fallback: getSession() com timeout.
api.interceptors.request.use(async (config) => {
  let accessToken = readTokenFromLocalStorage();

  if (!accessToken) {
    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getSession timeout')), 3000)
      );
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
      accessToken = session?.access_token || null;
    } catch (error) {
      console.warn('[api] falha em getSession, seguindo sem token:', error.message);
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Interceptor: redireciona para login se 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Leads
export const getLeads = (params) => api.get('/leads', { params }).then(r => r.data);
export const getLead = (id) => api.get(`/leads/${id}`).then(r => r.data);
export const createLead = (data) => api.post('/leads', data).then(r => r.data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data).then(r => r.data);
export const deleteLead = (id) => api.delete(`/leads/${id}`).then(r => r.data);
export const moveLeadToStage = (id, stageId) => api.patch(`/leads/${id}/stage`, { stageId }).then(r => r.data);
export const toggleFollowup = (id) => api.patch(`/leads/${id}/pause-followup`).then(r => r.data);

// Stages
export const getStages = () => api.get('/stages').then(r => r.data);
export const createStage = (data) => api.post('/stages', data).then(r => r.data);
export const updateStage = (id, data) => api.put(`/stages/${id}`, data).then(r => r.data);
export const deleteStage = (id) => api.delete(`/stages/${id}`).then(r => r.data);
export const reorderStages = (stages) => api.patch('/stages/reorder', { stages }).then(r => r.data);

// WhatsApp
export const getInstances = (tenantId) => api.get('/whatsapp/instances', { params: tenantId ? { tenantId } : undefined }).then(r => r.data);
export const createInstance = (name, tenantId) => api.post('/whatsapp/instances', { instanceName: name, ...(tenantId ? { tenantId } : {}) }).then(r => r.data);
export const getQRCode = (name) => api.get(`/whatsapp/instances/${name}/qrcode`).then(r => r.data);
export const getConnectionStatus = (name, tenantId) => api.get(`/whatsapp/instances/${name}/status`, { params: tenantId ? { tenantId } : undefined }).then(r => r.data);
export const deleteInstance = (name, tenantId) => api.delete(`/whatsapp/instances/${name}`, { params: tenantId ? { tenantId } : undefined }).then(r => r.data);

// Messages
export const getMessages = (params) => api.get('/messages', { params }).then(r => r.data);
export const getLeadMessages = (leadId) => api.get(`/messages/lead/${leadId}`).then(r => r.data);
export const sendText = (data) => api.post('/messages/send-text', data).then(r => r.data);
export const sendMedia = (data) => api.post('/messages/send-media', data).then(r => r.data);
export const exportMessages = (params) => api.get('/messages/export', { params, responseType: 'blob' });

// Auto Messages
export const getAutoMessages = (stageId) => api.get(`/auto-messages/stage/${stageId}`).then(r => r.data);
export const createAutoMessage = (data) => api.post('/auto-messages', data).then(r => r.data);
export const updateAutoMessage = (id, data) => api.put(`/auto-messages/${id}`, data).then(r => r.data);
export const deleteAutoMessage = (id) => api.delete(`/auto-messages/${id}`).then(r => r.data);
export const toggleAutoMessage = (id) => api.patch(`/auto-messages/${id}/toggle`).then(r => r.data);

// Users
export const getUsers = () => api.get('/users').then(r => r.data);
export const getUserTenants = () => api.get('/users/tenants').then(r => r.data);
export const createUser = (data) => api.post('/users', data).then(r => r.data);
export const getKestraHealth = () => api.get('/kestra/health').then(r => r.data);
export const getBotConfig = (tenantId) => api.get('/bot-config', { params: tenantId ? { tenantId } : undefined }).then(r => r.data);
export const saveBotConfig = (tenantId, config) => api.put('/bot-config', { ...(tenantId ? { tenantId } : {}), config }).then(r => r.data);
export const publishBotConfig = (tenantId, config) => api.post('/bot-config/publish', { ...(tenantId ? { tenantId } : {}), config }).then(r => r.data);

export default api;
