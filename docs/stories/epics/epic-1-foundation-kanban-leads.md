# Epic 1: Foundation, Kanban & Leads Core

## Epic Metadata

| Field | Value |
|-------|-------|
| **Epic ID** | EPIC-1 |
| **Title** | Foundation, Kanban & Leads Core |
| **Status** | Draft |
| **Priority** | P0 — Critical Path |
| **Owner** | Morgan (PM) |
| **Created** | 2026-03-26 |
| **PRD Ref** | `docs/prd.md` Section 6, Epic 1 |
| **Architecture Ref** | `docs/architecture/fullstack-architecture.md` |

---

## Goal

Criar a base do sistema com Kanban funcional e gestão completa de leads. Ao final deste epic, o usuário poderá visualizar seu pipeline de vendas em um Kanban visual, configurar stages (criar, editar, reordenar, excluir), cadastrar leads e movê-los entre stages com drag-and-drop. Toda a infraestrutura (React + Node + Supabase) estará operacional.

---

## Business Value

- Entrega a view principal do sistema (Kanban) — valor imediato para o usuário
- Estabelece toda a infraestrutura necessária para os epics seguintes
- Permite que o usuário comece a gerenciar leads mesmo sem WhatsApp integrado

---

## Functional Requirements Covered

| FR | Description |
|----|------------|
| FR1 | CRUD de stages do Kanban |
| FR2 | Cadastro de leads |
| FR3 | Drag-and-drop entre stages |
| FR4 | Histórico de movimentação |
| FR13 | Central de Leads (busca, filtros) |
| FR14 | Detalhe do lead |
| FR15 | Edição e exclusão de leads |

---

## Stories

### Story 1.1: Project Setup & Database Schema

| Field | Value |
|-------|-------|
| **Story ID** | 1.1 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | M (Medium) |
| **Prerequisites** | None |

> Como desenvolvedor,
> Quero ter o projeto configurado com React, Node, Express e Supabase com o schema do banco criado,
> Para que a equipe possa começar a desenvolver funcionalidades.

**Acceptance Criteria:**
- [ ] AC1: Projeto monorepo criado com `client/` (React+Vite+Tailwind) e `server/` (Node+Express)
- [ ] AC2: Conexão com Supabase configurada via variáveis de ambiente
- [ ] AC3: Migration executada criando tabelas: `leads`, `kanban_stages`, `lead_stage_history`, `auto_messages`, `message_log`, `whatsapp_instances`, `scheduled_messages`
- [ ] AC4: Tabela `kanban_stages` populada com stages padrão: Novo Lead, Contato Inicial, Qualificado, Proposta Enviada, Negociação, Fechado Ganho, Fechado Perdido
- [ ] AC5: Servidor Express rodando com health-check em `GET /api/health`
- [ ] AC6: Frontend React renderizando página inicial com conexão confirmada ao backend

**Technical Notes:**
- Supabase Project: `aula_2` (ID: `cfzkvgazkurcknkmpknz`)
- Supabase URL: `https://cfzkvgazkurcknkmpknz.supabase.co`
- Schema completo em `docs/architecture/fullstack-architecture.md` Section 5
- Indexes de performance devem ser criados junto com as tabelas

**File List:**
- [ ] `client/package.json`
- [ ] `client/vite.config.js`
- [ ] `client/tailwind.config.js`
- [ ] `client/src/main.jsx`
- [ ] `client/src/App.jsx`
- [ ] `client/src/lib/supabase.js`
- [ ] `server/package.json`
- [ ] `server/src/index.js`
- [ ] `server/src/lib/supabase.js`
- [ ] `.env.example`
- [ ] `package.json` (root workspace)

---

### Story 1.2: Kanban Board & Stage Management

| Field | Value |
|-------|-------|
| **Story ID** | 1.2 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | L (Large) |
| **Prerequisites** | Story 1.1 |

> Como usuário,
> Quero visualizar meus leads em um quadro Kanban e configurar os stages,
> Para que eu tenha visibilidade do meu pipeline de vendas.

**Acceptance Criteria:**
- [ ] AC1: Kanban exibe colunas por stage com cards dos leads (nome, telefone, tag, tempo no stage)
- [ ] AC2: Drag-and-drop funcional para mover leads entre stages (usando @dnd-kit)
- [ ] AC3: Movimentação registra entrada em `lead_stage_history` com timestamp automático
- [ ] AC4: Tela de configuração permite criar, editar (nome, cor), reordenar e excluir stages
- [ ] AC5: Stages exibem contagem de leads
- [ ] AC6: Kanban atualiza em tempo real via Supabase Realtime

**Technical Notes:**
- Library: `@dnd-kit/core` + `@dnd-kit/sortable` para drag-and-drop
- Supabase Realtime subscription na tabela `leads`
- API routes: `GET/POST/PUT/DELETE /api/stages` + `PATCH /api/stages/reorder`
- API route: `PATCH /api/leads/:id/stage` para movimentação

**File List:**
- [ ] `server/src/routes/stages.js`
- [ ] `client/src/pages/KanbanPage.jsx`
- [ ] `client/src/components/kanban/KanbanBoard.jsx`
- [ ] `client/src/components/kanban/KanbanColumn.jsx`
- [ ] `client/src/components/kanban/LeadCard.jsx`
- [ ] `client/src/components/kanban/StageConfigModal.jsx`
- [ ] `client/src/hooks/useKanban.js`
- [ ] `client/src/hooks/useRealtime.js`

---

### Story 1.3: Lead Management (CRUD & Central)

| Field | Value |
|-------|-------|
| **Story ID** | 1.3 |
| **Status** | [ ] Not Started |
| **Agent** | @dev |
| **Complexity** | M (Medium) |
| **Prerequisites** | Story 1.1, Story 1.2 |

> Como usuário,
> Quero cadastrar, editar, buscar e visualizar meus leads em uma central,
> Para que eu tenha controle completo sobre minha base de contatos.

**Acceptance Criteria:**
- [ ] AC1: Formulário de cadastro de lead com campos: nome, telefone (obrigatório), email, empresa, tags, notas
- [ ] AC2: Central de leads com listagem paginada, busca por nome/telefone/email
- [ ] AC3: Filtros por stage e por tags
- [ ] AC4: Tela de detalhe do lead com dados cadastrais, stage atual, e histórico de movimentação entre stages
- [ ] AC5: Edição inline dos dados do lead
- [ ] AC6: Exclusão de lead com confirmação
- [ ] AC7: Leads novos entram automaticamente no primeiro stage do Kanban

**Technical Notes:**
- API routes: `GET/POST/PUT/DELETE /api/leads` + `GET /api/leads/:id`
- Paginação: `?page=1&limit=20&search=&stage=&tags=`
- React Hook Form para formulários
- Lead detail usa slide-over panel (não navegação completa)

**File List:**
- [ ] `server/src/routes/leads.js`
- [ ] `server/src/services/leadService.js`
- [ ] `client/src/pages/LeadsPage.jsx`
- [ ] `client/src/pages/LeadDetailPage.jsx`
- [ ] `client/src/components/leads/LeadsList.jsx`
- [ ] `client/src/components/leads/LeadDetail.jsx`
- [ ] `client/src/components/leads/LeadForm.jsx`
- [ ] `client/src/components/leads/LeadFilters.jsx`
- [ ] `client/src/hooks/useLeads.js`

---

## Definition of Done

- [ ] Todas as 3 stories com ACs atendidos
- [ ] Kanban funcional com drag-and-drop
- [ ] Central de leads com CRUD completo
- [ ] Supabase Realtime funcionando
- [ ] Stages configuráveis (criar, editar, reordenar, excluir)
- [ ] Sem erros no console do browser
- [ ] Layout responsivo (desktop + mobile)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Supabase Realtime latency | Medium | Optimistic UI updates + Realtime como confirmação |
| dnd-kit complexity on mobile | Low | Testar touch events, fallback com botões |
| Migration falhar | Medium | Testar SQL localmente antes de aplicar |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-26 | Epic criado a partir do PRD | Morgan (PM) |
