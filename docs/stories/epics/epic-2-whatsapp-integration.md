# Epic 2: WhatsApp Integration

## Epic Metadata

| Field | Value |
|-------|-------|
| **Epic ID** | EPIC-2 |
| **Title** | WhatsApp Integration |
| **Status** | Draft |
| **Priority** | P0 — Critical Path |
| **Owner** | Morgan (PM) |
| **Created** | 2026-03-26 |
| **PRD Ref** | `docs/prd.md` Section 6, Epic 2 |
| **Architecture Ref** | `docs/architecture/fullstack-architecture.md` |
| **Depends On** | EPIC-1 (Foundation completa) |

---

## Goal

Conectar o sistema à Evolution API v2 para que o usuário possa gerenciar sua instância WhatsApp (criar, conectar via QR code, monitorar status) e enviar mensagens de texto e imagem diretamente para os leads. Ao final, toda comunicação manual via WhatsApp será feita pelo sistema, com histórico registrado.

---

## Business Value

- Elimina a necessidade de alternar entre o sistema e o WhatsApp
- Centraliza toda comunicação com leads em um único lugar
- Registra histórico completo de mensagens enviadas e recebidas
- Base necessária para o Epic 3 (automação de follow-up)

---

## Functional Requirements Covered

| FR | Description |
|----|------------|
| FR7 | Criar instâncias Evolution API |
| FR8 | Exibir QR code para conexão |
| FR9 | Status de conexão em tempo real |
| FR10 | Enviar texto via WhatsApp |
| FR11 | Enviar imagem com legenda |
| FR12 | Log de mensagens |
| FR17 | Webhook para mensagens recebidas |

---

## Evolution API Endpoints

| Operation | Method | Endpoint | Auth |
|-----------|--------|----------|------|
| Criar instância | POST | `/instance/create` | `apikey` header |
| QR Code | GET | `/instance/connect/{instance}` | `apikey` header |
| Status conexão | GET | `/instance/connectionState/{instance}` | `apikey` header |
| Enviar texto | POST | `/message/sendText/{instance}` | `apikey` header |
| Enviar mídia | POST | `/message/sendMedia/{instance}` | `apikey` header |
| Config webhook | POST | `/webhook/set/{instance}` | `apikey` header |
| Deletar instância | DELETE | `/instance/delete/{instance}` | `apikey` header |

---

## Stories

### Story 2.1: Instance Management & QR Code

| Field | Value |
|-------|-------|
| **Story ID** | 2.1 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | M (Medium) |
| **Prerequisites** | Epic 1 complete |

> Como usuário,
> Quero criar uma instância WhatsApp e conectar meu número via QR code,
> Para que o sistema possa enviar e receber mensagens.

**Acceptance Criteria:**
- [ ] AC1: Tela de configuração WhatsApp com botão "Criar Instância" (nome configurável)
- [ ] AC2: Após criar, exibe QR code para scan via `GET /instance/connect/{instance}`
- [ ] AC3: QR code atualiza automaticamente se expirar (polling a cada 30s)
- [ ] AC4: Status de conexão exibido em tempo real (conectado/desconectado) via polling de `GET /instance/connectionState/{instance}`
- [ ] AC5: Botão para desconectar/reconectar instância
- [ ] AC6: Dados da instância salvos em `whatsapp_instances` no Supabase

**Technical Notes:**
- Evolution API service class em `server/src/services/evolutionApi.js`
- QR code renderizado com `qrcode.react` no frontend
- Polling de status a cada 10s quando aguardando conexão
- Credenciais (api_url, api_key) armazenadas em `.env`, nunca no frontend

**File List:**
- [ ] `server/src/services/evolutionApi.js`
- [ ] `server/src/routes/whatsapp.js`
- [ ] `client/src/pages/WhatsAppConfigPage.jsx`
- [ ] `client/src/components/whatsapp/InstanceManager.jsx`
- [ ] `client/src/components/whatsapp/QRCodeDisplay.jsx`
- [ ] `client/src/components/whatsapp/ConnectionStatus.jsx`
- [ ] `client/src/hooks/useWhatsApp.js`

---

### Story 2.2: Send Text & Media Messages

| Field | Value |
|-------|-------|
| **Story ID** | 2.2 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | M (Medium) |
| **Prerequisites** | Story 2.1 |

> Como usuário,
> Quero enviar mensagens de texto e imagens para meus leads via WhatsApp,
> Para que eu possa me comunicar diretamente pelo sistema.

**Acceptance Criteria:**
- [ ] AC1: Na tela de detalhe do lead, campo para enviar mensagem de texto via `POST /message/sendText/{instance}`
- [ ] AC2: Opção de anexar imagem com legenda via `POST /message/sendMedia/{instance}`
- [ ] AC3: Mensagens enviadas registradas em `message_log` com timestamp, tipo, conteúdo e status
- [ ] AC4: Feedback visual de sucesso/erro no envio (toast)
- [ ] AC5: Histórico de mensagens exibido no detalhe do lead em ordem cronológica
- [ ] AC6: Tratamento de erro quando instância não está conectada (mensagem informativa)

**Technical Notes:**
- API routes: `POST /api/messages/send-text` + `POST /api/messages/send-media`
- Verificar connection state antes de enviar
- Insert em `message_log` após envio bem-sucedido (direction: 'outgoing')
- Imagens enviadas via URL (mediatype: 'image', media: URL)

**File List:**
- [ ] `server/src/routes/messages.js`
- [ ] `server/src/services/messageService.js`
- [ ] `client/src/components/whatsapp/MessageComposer.jsx`
- [ ] `client/src/components/messages/MessageTimeline.jsx`
- [ ] `client/src/components/messages/MessageBubble.jsx`
- [ ] `client/src/hooks/useMessages.js`

---

### Story 2.3: Webhook & Incoming Messages

| Field | Value |
|-------|-------|
| **Story ID** | 2.3 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | M (Medium) |
| **Prerequisites** | Story 2.2 |

> Como usuário,
> Quero ver as respostas dos leads diretamente no sistema,
> Para ter o histórico completo da conversa em um só lugar.

**Acceptance Criteria:**
- [ ] AC1: Endpoint `POST /api/webhook/messages` no backend para receber eventos da Evolution API
- [ ] AC2: Webhook configurado na instância via `POST /webhook/set/{instance}` com eventos `MESSAGES_UPSERT`
- [ ] AC3: Mensagens recebidas salvas em `message_log` com direction = 'incoming'
- [ ] AC4: Histórico do lead atualiza em tempo real quando mensagem chega (Supabase Realtime)
- [ ] AC5: Notificação visual (toast) quando nova mensagem recebida

**Technical Notes:**
- Webhook URL deve ser pública (usar ngrok em dev ou URL de deploy)
- Configurar webhook automaticamente ao criar instância
- Parsear `message.key.remoteJid` para extrair telefone do remetente
- Match com lead pelo campo `phone`
- Supabase Realtime subscription em `message_log` para push ao frontend

**File List:**
- [ ] `server/src/routes/webhook.js`
- [ ] Update `server/src/routes/whatsapp.js` (auto-configure webhook on create)
- [ ] Update `client/src/hooks/useRealtime.js` (message_log subscription)

---

## Definition of Done

- [ ] Todas as 3 stories com ACs atendidos
- [ ] Instância WhatsApp criada e conectada via QR code
- [ ] Envio de texto e imagem funcionando
- [ ] Mensagens recebidas aparecendo no sistema via webhook
- [ ] Histórico completo no detalhe do lead
- [ ] Evolution API service testado com instância real
- [ ] Credenciais seguras (apenas no backend)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Evolution API indisponível | High | Retry + timeout handling + mensagem de erro clara |
| QR code expira rápido | Low | Auto-refresh com polling |
| Webhook URL não acessível em dev | Medium | Documentar uso de ngrok ou similar |
| Rate limiting da Evolution API | Medium | Queue com delay entre envios (1s default) |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-26 | Epic criado a partir do PRD | Morgan (PM) |
