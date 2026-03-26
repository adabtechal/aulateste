# Epic 3: Follow-up Automático & Message Log

## Epic Metadata

| Field | Value |
|-------|-------|
| **Epic ID** | EPIC-3 |
| **Title** | Follow-up Automático & Message Log |
| **Status** | Draft |
| **Priority** | P1 — High |
| **Owner** | Morgan (PM) |
| **Created** | 2026-03-26 |
| **PRD Ref** | `docs/prd.md` Section 6, Epic 3 |
| **Architecture Ref** | `docs/architecture/fullstack-architecture.md` |
| **Depends On** | EPIC-2 (WhatsApp Integration completa) |

---

## Goal

Automatizar o envio de mensagens de follow-up baseado no stage do Kanban e tempo de permanência do lead, com log completo de toda comunicação. Ao final, leads recebem follow-up automático (texto e imagem) nos horários configurados, mensagens pendentes são canceladas ao mudar de stage, e toda comunicação é rastreável com filtros e exportação.

---

## Business Value

- Elimina follow-up manual — nenhum lead fica sem contato
- Permite sequências de mensagens por stage (ex: 1h, 24h, 72h)
- Rastreabilidade completa de toda comunicação
- Aumenta conversão por manter leads engajados automaticamente

---

## Functional Requirements Covered

| FR | Description |
|----|------------|
| FR5 | Configurar mensagens automáticas por stage |
| FR6 | Envio automático de follow-up |
| FR12 | Log completo de mensagens |
| FR16 | Pausar/retomar automação por lead |

---

## Stories

### Story 3.1: Auto-Message Configuration per Stage

| Field | Value |
|-------|-------|
| **Story ID** | 3.1 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | M (Medium) |
| **Prerequisites** | Epic 2 complete |

> Como usuário,
> Quero configurar mensagens automáticas para cada stage do Kanban com período definido,
> Para que leads recebam follow-up sem intervenção manual.

**Acceptance Criteria:**
- [ ] AC1: Na configuração de cada stage, seção "Mensagens Automáticas" com lista de mensagens
- [ ] AC2: Cada mensagem configurável com: template de texto, tipo (texto/imagem), URL da imagem (se aplicável), e delay em minutos/horas/dias após entrada no stage
- [ ] AC3: Múltiplas mensagens por stage (ex: 1h, 24h, 72h)
- [ ] AC4: Possibilidade de ativar/desativar cada mensagem individualmente
- [ ] AC5: Preview da mensagem antes de salvar
- [ ] AC6: Dados salvos na tabela `auto_messages`

**Technical Notes:**
- API routes: `GET/POST/PUT/DELETE /api/auto-messages` + `PATCH /:id/toggle`
- UI: Lista ordenável de mensagens dentro do modal de configuração do stage
- Delay input com seletor de unidade (minutos/horas/dias) → converter para `delay_minutes`
- Preview renderiza o template com dados de exemplo

**File List:**
- [ ] `server/src/routes/autoMessages.js`
- [ ] `client/src/components/messages/AutoMessageConfig.jsx`
- [ ] `client/src/components/messages/AutoMessageForm.jsx`
- [ ] `client/src/components/messages/AutoMessagePreview.jsx`
- [ ] Update `client/src/components/kanban/StageConfigModal.jsx` (add auto-messages tab)

---

### Story 3.2: Message Scheduler & Auto-Send

| Field | Value |
|-------|-------|
| **Story ID** | 3.2 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | L (Large) |
| **Prerequisites** | Story 3.1, Story 2.2 |

> Como sistema,
> Quero processar automaticamente a fila de mensagens agendadas,
> Para que os follow-ups sejam enviados no momento configurado.

**Acceptance Criteria:**
- [ ] AC1: Quando lead entra em um stage, `scheduled_messages` é populada com as mensagens automáticas desse stage e seus horários de envio calculados (NOW() + delay_minutes)
- [ ] AC2: Scheduler roda a cada 1 minuto verificando mensagens pendentes com `scheduled_at <= NOW()`
- [ ] AC3: Mensagens enviadas via Evolution API (texto ou mídia conforme configuração)
- [ ] AC4: Status atualizado em `scheduled_messages` (pending → sent / failed)
- [ ] AC5: Retry automático até 3 vezes em caso de falha, com intervalo exponencial (2^attempts minutos)
- [ ] AC6: Quando lead sai do stage, mensagens pendentes desse stage são canceladas (status → cancelled)
- [ ] AC7: Possibilidade de pausar/retomar automação por lead individual (`auto_followup_paused`)
- [ ] AC8: Log de envio registrado em `message_log` (direction: 'auto')

**Technical Notes:**
- Scheduler: `node-cron` com expressão `* * * * *` (every minute)
- Query: `SELECT * FROM scheduled_messages WHERE status = 'pending' AND scheduled_at <= NOW() LIMIT 50`
- Pular leads com `auto_followup_paused = true`
- Retry backoff: `NOW() + 2^attempts minutes`
- Após 3 falhas: `status = 'failed'`, log em `last_error`
- Cancelamento: trigger no `PATCH /api/leads/:id/stage`

**File List:**
- [ ] `server/src/services/scheduler.js`
- [ ] Update `server/src/services/leadService.js` (schedule on stage change)
- [ ] Update `server/src/routes/leads.js` (PATCH /:id/pause-followup)
- [ ] Update `server/src/services/messageService.js` (sendScheduledMessage)

---

### Story 3.3: Message Log & Communication History

| Field | Value |
|-------|-------|
| **Story ID** | 3.3 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | M (Medium) |
| **Prerequisites** | Story 3.2, Story 2.3 |

> Como usuário,
> Quero visualizar todo o histórico de comunicação em um só lugar,
> Para ter rastreabilidade completa das interações com cada lead.

**Acceptance Criteria:**
- [ ] AC1: Tela "Message Log" com listagem geral de todas as mensagens (enviadas, recebidas, automáticas)
- [ ] AC2: Filtros por lead, tipo (texto/imagem), direction (outgoing/incoming/auto), período
- [ ] AC3: No detalhe do lead, timeline unificada com mensagens + movimentações de stage
- [ ] AC4: Indicador visual diferenciando mensagens manuais (azul), automáticas (verde) e recebidas (cinza)
- [ ] AC5: Exportação do histórico em CSV

**Technical Notes:**
- API: `GET /api/messages?lead=&type=&direction=&from=&to=` com paginação
- API: `GET /api/messages/export?...` retorna CSV (Content-Type: text/csv)
- Timeline do lead combina `message_log` + `lead_stage_history` ordenados por timestamp
- Badges coloridos: outgoing (blue), incoming (gray), auto (green)

**File List:**
- [ ] `client/src/pages/MessageLogPage.jsx`
- [ ] `client/src/components/messages/MessageLog.jsx`
- [ ] `client/src/components/messages/MessageFilters.jsx`
- [ ] Update `client/src/components/messages/MessageTimeline.jsx` (add stage events)
- [ ] Update `server/src/routes/messages.js` (add export endpoint)

---

## Definition of Done

- [ ] Todas as 3 stories com ACs atendidos
- [ ] Mensagens automáticas configuráveis por stage
- [ ] Scheduler enviando follow-ups nos horários corretos
- [ ] Cancelamento automático ao mudar de stage
- [ ] Pause/resume por lead individual
- [ ] Retry com backoff exponencial funcionando
- [ ] Message Log com filtros e exportação CSV
- [ ] Timeline unificada no detalhe do lead

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Scheduler sobrecarregado com muitos leads | Medium | LIMIT 50 por ciclo, processar em lote |
| Mensagens duplicadas se scheduler rodar 2x | High | Status check atômico (WHERE status = 'pending') |
| Evolution API rate limit | Medium | Delay de 1s entre envios no batch |
| Timezone mismatch | Medium | Usar UTC em todo o backend, converter no frontend |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-26 | Epic criado a partir do PRD | Morgan (PM) |
