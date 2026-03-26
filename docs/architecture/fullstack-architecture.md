# LeadTrack Pro — Fullstack Architecture

> Gerado por Aria (Architect) | 2026-03-26 | Baseado em `docs/prd.md`

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│              React 18 + Vite + TailwindCSS              │
│         http://localhost:5173 (dev)                      │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Kanban   │ │  Leads   │ │ WhatsApp │ │  Messages │  │
│  │  Board    │ │  Central │ │  Config  │ │    Log    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       │             │            │              │        │
│       └─────────────┴────────────┴──────────────┘        │
│                         │                                │
│              Supabase Realtime (WebSocket)               │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP REST
┌─────────────────────────┴───────────────────────────────┐
│                      BACKEND                            │
│              Node.js + Express                          │
│         http://localhost:3001                            │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Leads   │ │  Stages  │ │ Evolution│ │ Scheduler │  │
│  │  Routes  │ │  Routes  │ │  Service │ │  (cron)   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       │             │            │              │        │
│       └─────────────┴────────────┴──────────────┘        │
│                         │                    │           │
└─────────────────────────┼────────────────────┼──────────┘
                          │                    │
              ┌───────────┴──────┐   ┌────────┴──────────┐
              │    SUPABASE      │   │  EVOLUTION API v2  │
              │   PostgreSQL     │   │  WhatsApp Gateway  │
              │   + Realtime     │   │                    │
              └──────────────────┘   └────────────────────┘
```

---

## 2. Monorepo Structure

```
leadtrack-pro/
├── client/                          # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── kanban/
│   │   │   │   ├── KanbanBoard.jsx
│   │   │   │   ├── KanbanColumn.jsx
│   │   │   │   ├── LeadCard.jsx
│   │   │   │   └── StageConfigModal.jsx
│   │   │   ├── leads/
│   │   │   │   ├── LeadsList.jsx
│   │   │   │   ├── LeadDetail.jsx
│   │   │   │   ├── LeadForm.jsx
│   │   │   │   └── LeadFilters.jsx
│   │   │   ├── whatsapp/
│   │   │   │   ├── InstanceManager.jsx
│   │   │   │   ├── QRCodeDisplay.jsx
│   │   │   │   ├── ConnectionStatus.jsx
│   │   │   │   └── MessageComposer.jsx
│   │   │   ├── messages/
│   │   │   │   ├── MessageLog.jsx
│   │   │   │   ├── MessageTimeline.jsx
│   │   │   │   ├── AutoMessageConfig.jsx
│   │   │   │   └── MessageBubble.jsx
│   │   │   └── ui/
│   │   │       ├── Layout.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       ├── Toast.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Badge.jsx
│   │   │       └── ConfirmDialog.jsx
│   │   ├── hooks/
│   │   │   ├── useSupabase.js
│   │   │   ├── useRealtime.js
│   │   │   ├── useLeads.js
│   │   │   ├── useKanban.js
│   │   │   ├── useWhatsApp.js
│   │   │   └── useMessages.js
│   │   ├── services/
│   │   │   └── api.js                # Axios instance + endpoints
│   │   ├── lib/
│   │   │   └── supabase.js           # Supabase client init
│   │   ├── pages/
│   │   │   ├── KanbanPage.jsx
│   │   │   ├── LeadsPage.jsx
│   │   │   ├── LeadDetailPage.jsx
│   │   │   ├── WhatsAppConfigPage.jsx
│   │   │   ├── MessageLogPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                          # Backend Node.js
│   ├── src/
│   │   ├── routes/
│   │   │   ├── leads.js
│   │   │   ├── stages.js
│   │   │   ├── messages.js
│   │   │   ├── whatsapp.js
│   │   │   ├── autoMessages.js
│   │   │   └── webhook.js
│   │   ├── services/
│   │   │   ├── evolutionApi.js       # Evolution API client
│   │   │   ├── scheduler.js          # Message scheduler (cron)
│   │   │   ├── messageService.js     # Send/receive logic
│   │   │   └── leadService.js        # Lead business logic
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── validateRequest.js
│   │   ├── lib/
│   │   │   └── supabase.js           # Supabase server client
│   │   └── index.js                  # Express app entry
│   └── package.json
│
├── docs/
│   ├── prd.md
│   └── architecture/
│       └── fullstack-architecture.md
├── .env
├── .env.example
├── .gitignore
└── package.json                     # Root workspace scripts
```

---

## 3. Backend Architecture

### 3.1 Express Server Setup

```javascript
// server/src/index.js
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const leadsRouter = require('./routes/leads');
const stagesRouter = require('./routes/stages');
const messagesRouter = require('./routes/messages');
const whatsappRouter = require('./routes/whatsapp');
const autoMessagesRouter = require('./routes/autoMessages');
const webhookRouter = require('./routes/webhook');
const { errorHandler } = require('./middleware/errorHandler');
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/leads', leadsRouter);
app.use('/api/stages', stagesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/auto-messages', autoMessagesRouter);
app.use('/api/webhook', webhookRouter);

// Error handling
app.use(errorHandler);

// Start scheduler
startScheduler();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 3.2 API Routes

#### Leads (`/api/leads`)

| Method | Path | Description | FR |
|--------|------|-------------|----|
| GET | `/` | List leads (pagination, search, filters) | FR13 |
| GET | `/:id` | Get lead detail + stage history | FR14 |
| POST | `/` | Create lead (auto-assign first stage) | FR2 |
| PUT | `/:id` | Update lead | FR15 |
| DELETE | `/:id` | Delete lead | FR15 |
| PATCH | `/:id/stage` | Move lead to stage (+ history + schedule) | FR3, FR4 |
| PATCH | `/:id/pause-followup` | Toggle auto followup pause | FR16 |

#### Stages (`/api/stages`)

| Method | Path | Description | FR |
|--------|------|-------------|----|
| GET | `/` | List all stages (ordered) | FR1 |
| POST | `/` | Create stage | FR1 |
| PUT | `/:id` | Update stage (name, color) | FR1 |
| DELETE | `/:id` | Delete stage (move leads first) | FR1 |
| PATCH | `/reorder` | Reorder stages (batch position update) | FR1 |

#### WhatsApp (`/api/whatsapp`)

| Method | Path | Description | FR |
|--------|------|-------------|----|
| GET | `/instances` | List saved instances | FR7 |
| POST | `/instances` | Create Evolution API instance | FR7 |
| GET | `/instances/:name/qrcode` | Get QR code for connection | FR8 |
| GET | `/instances/:name/status` | Get connection state | FR9 |
| DELETE | `/instances/:name` | Delete instance | FR7 |
| POST | `/instances/:name/reconnect` | Reconnect instance | FR9 |

#### Messages (`/api/messages`)

| Method | Path | Description | FR |
|--------|------|-------------|----|
| GET | `/` | List all messages (filters) | FR12 |
| GET | `/lead/:leadId` | Messages for specific lead | FR14 |
| POST | `/send-text` | Send text via WhatsApp | FR10 |
| POST | `/send-media` | Send image via WhatsApp | FR11 |
| GET | `/export` | Export messages as CSV | - |

#### Auto Messages (`/api/auto-messages`)

| Method | Path | Description | FR |
|--------|------|-------------|----|
| GET | `/stage/:stageId` | List auto messages for stage | FR5 |
| POST | `/` | Create auto message config | FR5 |
| PUT | `/:id` | Update auto message | FR5 |
| DELETE | `/:id` | Delete auto message | FR5 |
| PATCH | `/:id/toggle` | Enable/disable auto message | FR5 |

#### Webhook (`/api/webhook`)

| Method | Path | Description | FR |
|--------|------|-------------|----|
| POST | `/messages` | Receive Evolution API webhook events | FR17 |

### 3.3 Evolution API Service

```javascript
// server/src/services/evolutionApi.js
const axios = require('axios');

class EvolutionApiService {
  constructor(apiUrl, apiKey) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: { apikey: apiKey }
    });
  }

  // Instance Management
  async createInstance(instanceName) {
    return this.client.post('/instance/create', {
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
  }

  async getQRCode(instanceName) {
    return this.client.get(`/instance/connect/${instanceName}`);
  }

  async getConnectionState(instanceName) {
    return this.client.get(`/instance/connectionState/${instanceName}`);
  }

  async deleteInstance(instanceName) {
    return this.client.delete(`/instance/delete/${instanceName}`);
  }

  // Messages
  async sendText(instanceName, number, text) {
    return this.client.post(`/message/sendText/${instanceName}`, {
      number,
      text,
      delay: 1000,
      linkPreview: false
    });
  }

  async sendMedia(instanceName, number, mediaUrl, caption, mimetype = 'image/png') {
    return this.client.post(`/message/sendMedia/${instanceName}`, {
      number,
      mediatype: 'image',
      mimetype,
      caption,
      media: mediaUrl,
      fileName: 'image.png'
    });
  }

  // Webhook
  async setWebhook(instanceName, webhookUrl) {
    return this.client.post(`/webhook/set/${instanceName}`, {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: true,
      webhookBase64: false,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED'
      ]
    });
  }
}

module.exports = EvolutionApiService;
```

### 3.4 Message Scheduler

```javascript
// server/src/services/scheduler.js
const cron = require('node-cron');
const supabase = require('../lib/supabase');
const { sendScheduledMessage } = require('./messageService');

function startScheduler() {
  // Run every minute — check for pending scheduled messages
  cron.schedule('* * * * *', async () => {
    const { data: pendingMessages, error } = await supabase
      .from('scheduled_messages')
      .select(`
        *,
        auto_messages (*),
        leads (*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (error || !pendingMessages?.length) return;

    for (const scheduled of pendingMessages) {
      // Skip if lead has followup paused
      if (scheduled.leads.auto_followup_paused) continue;

      try {
        await sendScheduledMessage(scheduled);
        await supabase
          .from('scheduled_messages')
          .update({ status: 'sent' })
          .eq('id', scheduled.id);
      } catch (err) {
        const attempts = scheduled.attempts + 1;
        await supabase
          .from('scheduled_messages')
          .update({
            status: attempts >= 3 ? 'failed' : 'pending',
            attempts,
            last_error: err.message,
            // Exponential backoff: retry after 2^attempts minutes
            scheduled_at: attempts < 3
              ? new Date(Date.now() + Math.pow(2, attempts) * 60000).toISOString()
              : undefined
          })
          .eq('id', scheduled.id);
      }
    }
  });

  console.log('Message scheduler started (every 1 min)');
}

module.exports = { startScheduler };
```

### 3.5 Lead Stage Change Flow

Quando um lead muda de stage, o backend executa:

```
1. UPDATE leads SET current_stage_id = newStageId
2. INSERT lead_stage_history (lead_id, from_stage_id, to_stage_id)
3. UPDATE scheduled_messages SET status = 'cancelled'
   WHERE lead_id = X AND stage_id = oldStageId AND status = 'pending'
4. SELECT auto_messages WHERE stage_id = newStageId AND is_active = true
5. INSERT scheduled_messages para cada auto_message com:
   scheduled_at = NOW() + delay_minutes
```

---

## 4. Frontend Architecture

### 4.1 Routing (React Router)

```
/                    → redirect to /kanban
/kanban              → KanbanPage (Kanban board)
/leads               → LeadsPage (Central de Leads)
/leads/:id           → LeadDetailPage (Detalhe + timeline)
/whatsapp            → WhatsAppConfigPage (Instances + QR)
/messages            → MessageLogPage (Histórico geral)
/settings            → SettingsPage (Stages config + auto messages)
```

### 4.2 State Management

**Abordagem: Server State com React Query + Local State com useState/useReducer**

| Tipo | Ferramenta | Uso |
|------|-----------|-----|
| Server State | TanStack React Query | Leads, stages, messages, instances |
| Realtime | Supabase Realtime hooks | Kanban updates, new messages |
| UI State | useState/useReducer | Modais, filtros, drag state |
| Form State | React Hook Form | Formulários de lead, config |

### 4.3 Key Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| react | UI framework | ^18.x |
| react-router-dom | Routing | ^6.x |
| @tanstack/react-query | Server state | ^5.x |
| @dnd-kit/core + @dnd-kit/sortable | Drag & drop (Kanban) | ^6.x |
| @supabase/supabase-js | Supabase client + Realtime | ^2.x |
| axios | HTTP client | ^1.x |
| react-hook-form | Forms | ^7.x |
| react-hot-toast | Toast notifications | ^2.x |
| lucide-react | Icons | latest |
| date-fns | Date formatting | ^3.x |
| qrcode.react | QR Code rendering | ^3.x |

### 4.4 Supabase Client (Frontend)

```javascript
// client/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4.5 Realtime Subscriptions

```javascript
// client/src/hooks/useRealtime.js
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRealtimeLeads() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['kanban'] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_log'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        if (payload.new.direction === 'incoming') {
          toast('Nova mensagem recebida!');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}
```

### 4.6 API Service

```javascript
// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Leads
export const getLeads = (params) => api.get('/leads', { params });
export const getLead = (id) => api.get(`/leads/${id}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const moveLeadToStage = (id, stageId) => api.patch(`/leads/${id}/stage`, { stageId });
export const toggleFollowup = (id) => api.patch(`/leads/${id}/pause-followup`);

// Stages
export const getStages = () => api.get('/stages');
export const createStage = (data) => api.post('/stages', data);
export const updateStage = (id, data) => api.put(`/stages/${id}`, data);
export const deleteStage = (id) => api.delete(`/stages/${id}`);
export const reorderStages = (stages) => api.patch('/stages/reorder', { stages });

// WhatsApp
export const getInstances = () => api.get('/whatsapp/instances');
export const createInstance = (name) => api.post('/whatsapp/instances', { instanceName: name });
export const getQRCode = (name) => api.get(`/whatsapp/instances/${name}/qrcode`);
export const getConnectionStatus = (name) => api.get(`/whatsapp/instances/${name}/status`);
export const deleteInstance = (name) => api.delete(`/whatsapp/instances/${name}`);

// Messages
export const getMessages = (params) => api.get('/messages', { params });
export const getLeadMessages = (leadId) => api.get(`/messages/lead/${leadId}`);
export const sendText = (data) => api.post('/messages/send-text', data);
export const sendMedia = (data) => api.post('/messages/send-media', data);
export const exportMessages = (params) => api.get('/messages/export', { params, responseType: 'blob' });

// Auto Messages
export const getAutoMessages = (stageId) => api.get(`/auto-messages/stage/${stageId}`);
export const createAutoMessage = (data) => api.post('/auto-messages', data);
export const updateAutoMessage = (id, data) => api.put(`/auto-messages/${id}`, data);
export const deleteAutoMessage = (id) => api.delete(`/auto-messages/${id}`);
export const toggleAutoMessage = (id) => api.patch(`/auto-messages/${id}/toggle`);

export default api;
```

---

## 5. Database Architecture

### 5.1 Schema Diagram (Relationships)

```
┌──────────────────┐       ┌──────────────────┐
│  kanban_stages   │       │  whatsapp_        │
│                  │       │  instances         │
│  id (PK)         │       │                   │
│  name            │       │  id (PK)           │
│  color           │       │  instance_name     │
│  position        │       │  api_url           │
│  is_active       │       │  api_key           │
│  created_at      │       │  status            │
│  updated_at      │       │  created_at        │
└───────┬──────────┘       │  updated_at        │
        │                  └───────────────────┘
        │ 1:N
        ├──────────────────────────────────────┐
        │                                      │
┌───────┴──────────┐              ┌────────────┴─────┐
│     leads        │              │  auto_messages   │
│                  │              │                  │
│  id (PK)         │              │  id (PK)          │
│  name            │              │  stage_id (FK)    │
│  phone           │              │  message_template │
│  email           │              │  message_type     │
│  company         │              │  media_url        │
│  tags[]          │              │  delay_minutes    │
│  notes           │              │  is_active        │
│  current_stage_  │              │  position         │
│    id (FK)       │              │  created_at       │
│  auto_followup_  │              └──────────┬────────┘
│    paused        │                         │
│  created_at      │                         │
│  updated_at      │                         │
└──┬─────────┬─────┘                         │
   │         │                               │
   │ 1:N     │ 1:N                           │
   │         │                               │
┌──┴─────────┴──┐              ┌─────────────┴──────┐
│ lead_stage_   │              │ scheduled_         │
│ history       │              │ messages           │
│               │              │                    │
│ id (PK)       │              │ id (PK)            │
│ lead_id (FK)  │              │ lead_id (FK)       │
│ from_stage_id │              │ auto_message_      │
│ to_stage_id   │              │   id (FK)          │
│ moved_at      │              │ stage_id (FK)      │
└───────────────┘              │ scheduled_at       │
                               │ status             │
┌───────────────┐              │ attempts           │
│ message_log   │              │ last_error         │
│               │              │ created_at         │
│ id (PK)       │              └────────────────────┘
│ lead_id (FK)  │
│ direction     │
│ message_type  │
│ content       │
│ media_url     │
│ whatsapp_     │
│   message_id  │
│ status        │
│ sent_at       │
└───────────────┘
```

### 5.2 Indexes (Performance)

```sql
-- Queries frequentes de leads por stage (Kanban)
CREATE INDEX idx_leads_current_stage ON leads(current_stage_id);

-- Busca de leads por telefone/email
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;

-- Histórico de stage por lead
CREATE INDEX idx_lead_stage_history_lead ON lead_stage_history(lead_id, moved_at DESC);

-- Mensagens por lead (timeline)
CREATE INDEX idx_message_log_lead ON message_log(lead_id, sent_at DESC);

-- Scheduler: mensagens pendentes por horário
CREATE INDEX idx_scheduled_pending ON scheduled_messages(scheduled_at)
  WHERE status = 'pending';

-- Auto messages por stage
CREATE INDEX idx_auto_messages_stage ON auto_messages(stage_id)
  WHERE is_active = true;
```

### 5.3 Supabase Realtime Config

Habilitar Realtime nas tabelas:
- `leads` — Kanban board updates
- `message_log` — New message notifications
- `kanban_stages` — Stage config changes

---

## 6. Integration Architecture

### 6.1 Evolution API Integration Flow

```
┌────────────┐     ┌──────────┐     ┌───────────────┐
│  Frontend  │────>│ Backend  │────>│ Evolution API  │
│            │     │ Express  │     │     v2         │
│ QR Code    │     │          │     │                │
│ Display    │<────│ Proxy    │<────│ /instance/     │
│            │     │          │     │ connect        │
└────────────┘     └──────────┘     └───────────────┘

Webhook Flow (incoming messages):
┌───────────────┐     ┌──────────┐     ┌──────────┐
│ Evolution API │────>│ Backend  │────>│ Supabase │
│   Webhook     │     │ /api/    │     │ message_ │
│               │     │ webhook/ │     │ log      │
│ MESSAGES_     │     │ messages │     │          │
│ UPSERT        │     │          │     │          │
└───────────────┘     └──────────┘     └──────────┘
                                            │
                                            │ Realtime
                                            v
                                       ┌──────────┐
                                       │ Frontend │
                                       │ toast +  │
                                       │ refresh  │
                                       └──────────┘
```

### 6.2 Webhook Handler

```javascript
// server/src/routes/webhook.js
router.post('/messages', async (req, res) => {
  const { event, data, instance } = req.body;

  if (event === 'messages.upsert') {
    const message = data;
    // Only process incoming messages (not from us)
    if (!message.key.fromMe) {
      const phone = message.key.remoteJid.replace('@s.whatsapp.net', '');

      // Find lead by phone
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', phone)
        .single();

      if (lead) {
        await supabase.from('message_log').insert({
          lead_id: lead.id,
          direction: 'incoming',
          message_type: message.message?.imageMessage ? 'image' : 'text',
          content: message.message?.conversation
            || message.message?.extendedTextMessage?.text
            || message.message?.imageMessage?.caption
            || '',
          media_url: message.message?.imageMessage?.url || null,
          whatsapp_message_id: message.key.id,
          status: 'received'
        });
      }
    }
  }

  res.status(200).json({ received: true });
});
```

### 6.3 Auto-Send Flow (Scheduler)

```
Lead entra no stage "Qualificado"
        │
        v
Backend calcula scheduled_at para cada auto_message do stage:
  - Msg 1: NOW() + 60min  → "Olá! Vimos que você tem interesse..."
  - Msg 2: NOW() + 1440min (24h) → "Tudo bem? Posso ajudar..."
  - Msg 3: NOW() + 4320min (72h) → "Última chance! Oferta especial..."
        │
        v
INSERT scheduled_messages (status: pending)
        │
        v
Scheduler (cron every 1min) picks up when scheduled_at <= NOW()
        │
        v
Evolution API sendText/sendMedia
        │
        ├── Success → status: sent + INSERT message_log
        │
        └── Failure → attempts++ → retry with backoff
              └── attempts >= 3 → status: failed + log error
```

---

## 7. Environment Variables

```env
# Server
PORT=3001
CLIENT_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://cfzkvgazkurcknkmpknz.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Evolution API
EVOLUTION_API_URL=https://your-evolution-instance.com
EVOLUTION_API_KEY=your_api_key

# Webhook (public URL for Evolution API to call back)
WEBHOOK_URL=https://your-public-url.com/api/webhook/messages

# Frontend (VITE_ prefix for Vite)
VITE_SUPABASE_URL=https://cfzkvgazkurcknkmpknz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001/api
```

---

## 8. Security Considerations

| Concern | Solution |
|---------|----------|
| Evolution API key exposure | Stored in `.env`, never sent to frontend. Backend proxies all calls |
| Webhook validation | Validate request origin (IP/header) from Evolution API |
| Supabase RLS | Enable Row Level Security on all tables (future auth) |
| Input sanitization | Validate phone format, sanitize text content before sending |
| Rate limiting | Express rate-limit on webhook and message send endpoints |
| CORS | Restrict to `CLIENT_URL` only |

---

## 9. Development Scripts

```json
// Root package.json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "start": "cd server && npm start"
  }
}
```

---

## 10. Implementation Order (Epic Alignment)

| Order | Component | Epic | Story |
|-------|-----------|------|-------|
| 1 | Supabase migrations + seed | Epic 1 | 1.1 |
| 2 | Express server + health check | Epic 1 | 1.1 |
| 3 | React app + routing + layout | Epic 1 | 1.1 |
| 4 | Stages CRUD (API + UI) | Epic 1 | 1.2 |
| 5 | Kanban board + drag-and-drop | Epic 1 | 1.2 |
| 6 | Leads CRUD + Central | Epic 1 | 1.3 |
| 7 | Evolution API service | Epic 2 | 2.1 |
| 8 | Instance management + QR Code | Epic 2 | 2.1 |
| 9 | Send text/media + message log | Epic 2 | 2.2 |
| 10 | Webhook handler + realtime | Epic 2 | 2.3 |
| 11 | Auto message config UI | Epic 3 | 3.1 |
| 12 | Message scheduler + auto-send | Epic 3 | 3.2 |
| 13 | Message log page + export | Epic 3 | 3.3 |
