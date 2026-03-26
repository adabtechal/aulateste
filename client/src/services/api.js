import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

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
export const getInstances = () => api.get('/whatsapp/instances').then(r => r.data);
export const createInstance = (name) => api.post('/whatsapp/instances', { instanceName: name }).then(r => r.data);
export const getQRCode = (name) => api.get(`/whatsapp/instances/${name}/qrcode`).then(r => r.data);
export const getConnectionStatus = (name) => api.get(`/whatsapp/instances/${name}/status`).then(r => r.data);
export const deleteInstance = (name) => api.delete(`/whatsapp/instances/${name}`).then(r => r.data);

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

export default api;
