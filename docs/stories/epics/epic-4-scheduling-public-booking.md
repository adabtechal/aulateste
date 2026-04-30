# Epic 4: Agendamento Público & Configuração de Disponibilidade

## Epic Metadata

| Field | Value |
|-------|-------|
| **Epic ID** | EPIC-4 |
| **Title** | Agendamento Público & Configuração de Disponibilidade |
| **Status** | Draft |
| **Priority** | P1 — High |
| **Owner** | Morgan (PM) |
| **Created** | 2026-04-30 |
| **PRD Ref** | `docs/prd.md` |
| **Architecture Ref** | `docs/architecture/fullstack-architecture.md` |
| **Depends On** | EPIC-2 (WhatsApp Integration) |

---

## Goal

Criar um sistema de agendamento com página pública acessível via URL (enviada pelo agente AI ao cliente), onde o cliente escolhe data/horário e preenche um formulário (nome, serviço de interesse, telefone). O painel administrativo terá configuração de dias e horários disponíveis. Ao confirmar, o cliente recebe confirmação via WhatsApp, e o agendamento é registrado na memória do agente para contexto em conversas futuras.

---

## Business Value

- **Conversão direta**: O agente AI envia o link e o cliente agenda sem atrito
- **Autonomia do cliente**: Escolhe data/horário sem depender de interação humana
- **Confirmação automática**: WhatsApp confirma o agendamento instantaneamente
- **Contexto do agente**: O agente não perde contexto quando o cliente menciona o agendamento
- **Redução de no-show**: Confirmação via WhatsApp aumenta comprometimento
- **Gestão de agenda**: Admin controla disponibilidade de forma centralizada

---

## Existing System Context

- **Stack**: React 18 + Vite + TailwindCSS (frontend), Express + Netlify Functions (backend), Supabase (database/auth)
- **WhatsApp**: Evolution API v2 com serviço wrapper (`server/src/services/evolutionApi.js`) — método `sendText()` já funcional
- **Agente AI**: Kestra SDR flow com webhook em Supabase Edge Function (`supabase/functions/webhook-messages/index.ts`)
- **Multi-tenant**: Sistema já suporta multi-tenancy com slugs (`tenants` table)
- **Realtime**: Supabase Realtime habilitado em `message_log`

### Integration Points

1. **Evolution API** → Enviar confirmação WhatsApp ao cliente após agendamento
2. **Supabase** → Tabelas de agendamento, configuração de disponibilidade
3. **Kestra/Webhook** → Registrar agendamento na memória do agente
4. **Frontend Router** → Nova rota pública (sem auth) para página de booking
5. **Admin Panel** → Nova página de configuração de disponibilidade

---

## Stories

### Story 4.1: Schema de Agendamento & Página Admin de Disponibilidade

**Descrição**: Criar as tabelas no Supabase (slots de disponibilidade, agendamentos) e a página administrativa para o tenant configurar dias da semana e faixas de horários disponíveis para agendamento.

**Escopo:**
- Migration Supabase: tabela `scheduling_availability` (tenant_id, day_of_week, start_time, end_time, is_active)
- Migration Supabase: tabela `bookings` (id, tenant_id, client_name, client_phone, service_interest, booking_date, booking_time, status, confirmation_sent, created_at)
- RLS policies para ambas as tabelas (tenant isolation)
- API endpoints CRUD para availability (GET/POST/PUT/DELETE)
- Página admin `SchedulingConfigPage.jsx` com UI para:
  - Selecionar dias da semana ativos
  - Definir faixas de horário por dia (ex: 09:00-12:00, 14:00-18:00)
  - Ativar/desativar slots individuais
- Rota no sidebar do admin panel

**Executor Assignment:**
- `executor`: @data-engineer (schema design + migrations)
- `quality_gate`: @dev (code review + integration validation)
- `quality_gate_tools`: [schema_validation, migration_review, rls_test]

**Quality Gates:**
- Pre-Commit: Schema validation, RLS policy verification, service filter check
- Pre-PR: Migration safety check, backward compatibility

**Acceptance Criteria:**
- [ ] Tabelas `scheduling_availability` e `bookings` criadas com migrations
- [ ] RLS policies isolam dados por tenant
- [ ] Admin pode configurar dias e horários disponíveis
- [ ] Admin pode ativar/desativar dias específicos
- [ ] Configurações persistem corretamente no Supabase
- [ ] UI segue o design system existente (Calm Intelligence)

---

### Story 4.2: Página Pública de Agendamento (Calendário + Formulário)

**Descrição**: Criar a página pública de agendamento acessível sem autenticação. A página exibe um calendário com datas disponíveis (baseado na configuração do admin), slots de horário disponíveis para a data selecionada, e um formulário para o cliente preencher seus dados.

**Escopo:**
- Rota pública: `/booking/:tenantSlug` (sem auth required)
- Componente de calendário interativo mostrando apenas dias com disponibilidade
- Seleção de horário baseada nos slots configurados (excluindo já reservados)
- Formulário: nome, serviço de interesse, número de telefone (com validação)
- API endpoint público: `GET /api/booking/:tenantSlug/availability?date=YYYY-MM-DD`
- API endpoint público: `POST /api/booking/:tenantSlug/confirm`
- Tela de confirmação após agendamento bem-sucedido
- Design responsivo (mobile-first — cliente acessa pelo celular via link do WhatsApp)
- Página de agendamentos no admin para visualizar bookings (lista com filtros por data/status)

**Executor Assignment:**
- `executor`: @dev (frontend + API implementation)
- `quality_gate`: @architect (pattern validation + API design review)
- `quality_gate_tools`: [code_review, pattern_validation, api_contract_validation]

**Quality Gates:**
- Pre-Commit: Security scan (endpoint público), input validation, XSS prevention
- Pre-PR: API contract validation, mobile responsiveness check

**Acceptance Criteria:**
- [ ] Página pública acessível via `/booking/:tenantSlug` sem login
- [ ] Calendário exibe apenas dias com disponibilidade configurada
- [ ] Horários já reservados não aparecem como opção
- [ ] Formulário valida nome, telefone (formato BR) e serviço
- [ ] Agendamento é salvo na tabela `bookings` com status `confirmed`
- [ ] Tela de sucesso exibida após confirmação
- [ ] Layout responsivo funciona bem em mobile
- [ ] Admin consegue visualizar lista de agendamentos com filtros
- [ ] Rate limiting no endpoint público para prevenir abuso

---

### Story 4.3: Confirmação WhatsApp & Integração com Memória do Agente

**Descrição**: Após confirmação do agendamento, enviar mensagem de confirmação via WhatsApp para o cliente com detalhes (data, horário, serviço). Registrar o agendamento no contexto do agente (Kestra/webhook) para que o agente tenha ciência do agendamento em conversas futuras — se o cliente responder "ok" ou mencionar o agendamento, o agente tem o contexto necessário.

**Escopo:**
- Trigger pós-booking: enviar mensagem WhatsApp via Evolution API (`sendText`)
- Template de mensagem de confirmação (nome, data, horário, serviço)
- Registrar agendamento em `message_log` com tipo `booking_confirmation` (direction: outgoing)
- Atualizar campo `confirmation_sent` na tabela `bookings`
- Integração com webhook do agente: inserir contexto de agendamento no fluxo Kestra
- Enriquecer dados do lead (se existente) ou criar lead com dados do booking
- Endpoint para agente consultar agendamentos por telefone: `GET /api/bookings/by-phone/:phone`

**Executor Assignment:**
- `executor`: @dev (integration implementation)
- `quality_gate`: @architect (integration pattern review)
- `quality_gate_tools`: [code_review, integration_validation, security_scan]

**Quality Gates:**
- Pre-Commit: Security scan, error handling validation
- Pre-PR: Integration test, WhatsApp delivery verification

**Acceptance Criteria:**
- [ ] Cliente recebe WhatsApp de confirmação com data, horário e serviço
- [ ] Mensagem de confirmação registrada no `message_log`
- [ ] Campo `confirmation_sent` atualizado no booking
- [ ] Se cliente já é lead, booking é vinculado ao lead existente
- [ ] Se cliente é novo, lead é criado automaticamente com dados do formulário
- [ ] Agente AI tem acesso ao contexto do agendamento via endpoint dedicado
- [ ] Se envio WhatsApp falhar, booking continua válido (graceful degradation)
- [ ] Retry automático para envio de confirmação (max 3 tentativas)

---

## Compatibility Requirements

- [ ] APIs existentes (leads, messages, kanban) permanecem inalteradas
- [ ] Schema changes são backward compatible (novas tabelas apenas)
- [ ] UI do admin segue padrões existentes (sidebar, design system Calm Intelligence)
- [ ] Rotas públicas não interferem com rotas autenticadas
- [ ] Performance do sistema existente não é impactada

## Risk Mitigation

- **Risco Primário**: Endpoint público exposto sem autenticação pode ser alvo de spam/abuso
- **Mitigação**: Rate limiting por IP, validação de telefone BR, honeypot field
- **Rollback Plan**: Desabilitar rota pública via feature flag no `scheduling_availability` (is_active global)

**Quality Assurance Strategy:**

- **Story 4.1 (Schema)**: @data-engineer implementa, @dev valida migrations e RLS
- **Story 4.2 (Frontend/API)**: @dev implementa, @architect valida padrões de API pública
- **Story 4.3 (Integração)**: @dev implementa, @architect valida integração Evolution + Kestra

Risco alinhado por story:
- Story 4.1: LOW RISK (novas tabelas, sem impacto em existentes) → Pre-Commit only
- Story 4.2: MEDIUM RISK (endpoint público) → Pre-Commit + Pre-PR
- Story 4.3: MEDIUM RISK (integração WhatsApp + agente) → Pre-Commit + Pre-PR

---

## Definition of Done

- [ ] Todas as 3 stories completadas com acceptance criteria atendidos
- [ ] Funcionalidade existente verificada (leads, kanban, messages inalterados)
- [ ] Página pública funcional e responsiva em mobile
- [ ] Confirmação WhatsApp enviada com sucesso
- [ ] Agente AI tem contexto dos agendamentos
- [ ] Admin controla disponibilidade de forma intuitiva
- [ ] Sem regressão em features existentes
- [ ] Documentação atualizada

---

## Technical Notes

### URL Pública

O agente AI enviará ao cliente uma URL no formato:
```
https://{domain}/booking/{tenantSlug}
```

Esta URL deve ser acessível sem autenticação. O `tenantSlug` identifica o tenant e carrega a configuração de disponibilidade correspondente.

### Modelo de Dados

```
scheduling_availability
├── id (uuid, PK)
├── tenant_id (uuid, FK → tenants)
├── day_of_week (int, 0=domingo...6=sábado)
├── start_time (time)
├── end_time (time)
├── is_active (boolean, default true)
├── created_at (timestamptz)
└── updated_at (timestamptz)

bookings
├── id (uuid, PK)
├── tenant_id (uuid, FK → tenants)
├── lead_id (uuid, FK → leads, nullable)
├── client_name (text, not null)
├── client_phone (text, not null)
├── service_interest (text, not null)
├── booking_date (date, not null)
├── booking_time (time, not null)
├── status (text: confirmed, cancelled, completed, no_show)
├── confirmation_sent (boolean, default false)
├── confirmation_sent_at (timestamptz, nullable)
├── notes (text, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Fluxo Completo

```
1. Agente AI envia URL → Cliente abre página pública
2. Cliente escolhe data → API retorna horários disponíveis
3. Cliente preenche formulário + escolhe horário → POST /confirm
4. Backend salva booking → Envia WhatsApp confirmação
5. Backend registra em message_log → Atualiza/cria lead
6. Agente AI consulta bookings quando cliente menciona agendamento
```

---

## Handoff to Story Manager

"Desenvolva stories detalhadas para este epic brownfield de agendamento. Considerações-chave:

- Sistema existente: React 18 + Express + Supabase + Evolution API
- Integration points: Evolution API (sendText), Supabase (new tables), Kestra (agent context), Frontend Router (public route)
- Padrões existentes: Multi-tenant com RLS, serviços modulares em `server/src/services/`, hooks React em `client/src/hooks/`
- Compatibilidade crítica: Endpoints existentes inalterados, schema backward-compatible
- Cada story deve verificar que funcionalidade existente permanece intacta

O epic deve manter a integridade do sistema enquanto entrega agendamento público com confirmação WhatsApp e contexto do agente."

---

*Epic created by Morgan (PM) — AIOX Story Development Cycle*
