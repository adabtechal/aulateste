# LeadTrack Pro — Product Requirements Document (PRD)

## 1. Goals and Background Context

### 1.1 Goals

- Centralizar a gestao de leads em um Kanban visual com stages configuráveis (criar, editar, reordenar, excluir stages)
- Automatizar follow-up de leads via WhatsApp com mensagens programáveis por stage e período
- Integrar com Evolution API v2 para gerenciamento de instâncias WhatsApp (criar instância, QR code, envio de texto e imagem)
- Fornecer visibilidade completa do pipeline de vendas com histórico de movimentação e comunicação por lead
- Permitir gestão centralizada de leads com busca, filtros, tags e importação

### 1.2 Background Context

Vendedores e equipes comerciais perdem oportunidades por falta de acompanhamento sistemático — leads esfriam sem contato adequado e não há visibilidade do pipeline. O sistema resolve isso combinando um Kanban visual para gestão do pipeline com automação de mensagens via WhatsApp (Evolution API v2). Cada stage do Kanban pode ter mensagens automáticas de follow-up com períodos configuráveis, garantindo que nenhum lead fique sem acompanhamento. A integração direta com WhatsApp via Evolution API elimina a necessidade de ferramentas externas, centralizando comunicação e gestão em um único sistema.

### 1.3 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-26 | 0.1 | Draft inicial | Morgan (PM) |

---

## 2. Requirements

### 2.1 Functional Requirements

- **FR1:** O sistema deve permitir criar, editar, reordenar e excluir stages do Kanban
- **FR2:** O sistema deve permitir cadastrar leads com nome, telefone (obrigatório), email, empresa, tags e notas
- **FR3:** O sistema deve permitir mover leads entre stages do Kanban via drag-and-drop
- **FR4:** O sistema deve registrar automaticamente o histórico de movimentação de cada lead entre stages com timestamp
- **FR5:** O sistema deve permitir configurar mensagens automáticas por stage com template de texto, tipo de mídia (texto/imagem), e período de delay (ex: "enviar após 2h de entrada no stage")
- **FR6:** O sistema deve executar o envio automático de follow-up via WhatsApp quando o período configurado for atingido
- **FR7:** O sistema deve permitir criar instâncias da Evolution API com nome configurável
- **FR8:** O sistema deve exibir o QR code da Evolution API para conexão do WhatsApp
- **FR9:** O sistema deve mostrar o status de conexão da instância WhatsApp em tempo real (conectado/desconectado)
- **FR10:** O sistema deve permitir enviar mensagens de texto via WhatsApp para qualquer lead
- **FR11:** O sistema deve permitir enviar imagens com legenda via WhatsApp para qualquer lead
- **FR12:** O sistema deve manter um log completo de todas as mensagens enviadas e recebidas por lead
- **FR13:** O sistema deve fornecer uma Central de Leads com listagem, busca por nome/telefone/email, e filtros por stage/tags
- **FR14:** O sistema deve permitir visualizar o detalhe de um lead com seus dados, histórico de stages e histórico de mensagens
- **FR15:** O sistema deve permitir editar e excluir leads
- **FR16:** O sistema deve permitir pausar e retomar mensagens automáticas por lead individual
- **FR17:** O sistema deve receber webhooks da Evolution API para registrar mensagens recebidas dos leads

### 2.2 Non-Functional Requirements

- **NFR1:** O frontend deve ser responsivo e funcionar em desktop e mobile
- **NFR2:** O Kanban deve usar Supabase Realtime para atualizações em tempo real entre múltiplos usuários
- **NFR3:** As mensagens automáticas devem ser processadas com precisão de +/- 1 minuto do período configurado
- **NFR4:** O sistema deve suportar no mínimo 1.000 leads ativos sem degradação perceptível de performance
- **NFR5:** Todas as credenciais da Evolution API (apikey, URLs) devem ser armazenadas de forma segura via variáveis de ambiente
- **NFR6:** O sistema deve tratar falhas de envio da Evolution API com retry (max 3 tentativas) e log de erro

---

## 3. User Interface Design Goals

### 3.1 Overall UX Vision

Interface limpa e focada em produtividade. O Kanban é a view principal — o usuário deve conseguir ver todo seu pipeline em uma tela e agir rapidamente (mover leads, enviar mensagens, ver status). Design moderno com TailwindCSS, cores por stage, e interações fluidas de drag-and-drop.

### 3.2 Key Interaction Paradigms

- **Drag & Drop:** Movimentação de leads entre stages do Kanban
- **Inline Actions:** Ações rápidas no card do lead (enviar mensagem, ver detalhes)
- **Slide-over Panel:** Detalhe do lead abre em painel lateral sem sair do Kanban
- **Modal:** Configurações de stage e mensagens automáticas em modais
- **Toast Notifications:** Feedback de ações (mensagem enviada, lead movido, erro)

### 3.3 Core Screens and Views

1. **Dashboard/Kanban** — View principal com pipeline visual de leads por stage
2. **Central de Leads** — Listagem com busca, filtros e ações em lote
3. **Detalhe do Lead** — Dados, histórico de stages, histórico de mensagens, ações
4. **Configuração do Kanban** — CRUD de stages, cores, ordem
5. **Configuração de Follow-up** — Mensagens automáticas por stage (template, tipo, período)
6. **WhatsApp Config** — Criar instância, QR code, status de conexão
7. **Message Log** — Histórico geral de mensagens enviadas/recebidas

### 3.4 Accessibility

WCAG AA — Contraste adequado, navegação por teclado, labels em formulários.

### 3.5 Branding

Sem branding definido. Design system neutro com TailwindCSS. Cores do Kanban configuráveis pelo usuário por stage.

### 3.6 Target Platforms

Web Responsive (Desktop + Mobile).

---

## 4. Technical Assumptions

### 4.1 Repository Structure

**Monorepo** — Frontend e backend no mesmo repositório para simplificar desenvolvimento e deploy.

```
/
├── client/          # React + Vite + TailwindCSS
├── server/          # Node.js + Express
├── supabase/        # Migrations e tipos gerados
└── docs/            # PRD, stories, architecture
```

### 4.2 Service Architecture

**Monolith modular** — Um servidor Express que expõe a API REST para o frontend e gerencia a comunicação com a Evolution API e Supabase.

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) via MCP |
| WhatsApp | Evolution API v2 |
| Realtime | Supabase Realtime (WebSocket) |
| Scheduler | Node-cron ou setInterval para mensagens automáticas |

### 4.3 Testing Requirements

Unit + Integration — Testes unitários para services do backend e testes de integração para endpoints da API.

### 4.4 Additional Technical Assumptions

- **Evolution API v2** — Endpoints mapeados:
  - `POST /instance/create` — Criar instância
  - `GET /instance/connect/{instance}` — QR Code
  - `GET /instance/connectionState/{instance}` — Status conexão
  - `POST /message/sendText/{instance}` — Enviar texto
  - `POST /message/sendMedia/{instance}` — Enviar imagem
  - `POST /webhook/set/{instance}` — Configurar webhook
  - `DELETE /instance/delete/{instance}` — Deletar instância
- **Autenticação Evolution API:** Header `apikey` em todas as requests
- **Supabase:** Projeto `aula_2` (ID: `cfzkvgazkurcknkmpknz`, região: `us-east-2`) — banco limpo, pronto para migrations
- **Supabase URL:** `https://cfzkvgazkurcknkmpknz.supabase.co`

---

## 5. Epic List

### Epic 1: Foundation, Kanban & Leads Core
Estabelecer infraestrutura do projeto (React + Node + Supabase), criar o schema do banco, implementar o Kanban visual com stages configuráveis e o CRUD de leads. Ao final, o usuário consegue gerenciar seu pipeline visualmente.

### Epic 2: WhatsApp Integration
Integrar com Evolution API v2 — criar instâncias, exibir QR code, monitorar conexão, enviar mensagens de texto e imagem. Ao final, o usuário consegue se conectar ao WhatsApp e enviar mensagens direto do sistema.

### Epic 3: Follow-up Automático & Message Log
Implementar o sistema de mensagens automáticas por stage com período configurável, scheduler de envio, e histórico completo de comunicação. Ao final, leads recebem follow-up automático e toda comunicação é rastreável.

---

## 6. Epic Details

### Epic 1: Foundation, Kanban & Leads Core

**Goal:** Criar a base do sistema com Kanban funcional e gestão completa de leads. O usuário poderá visualizar seu pipeline, configurar stages, cadastrar leads e movê-los entre stages com drag-and-drop.

#### Story 1.1: Project Setup & Database Schema

> Como desenvolvedor,
> Quero ter o projeto configurado com React, Node, Express e Supabase com o schema do banco criado,
> Para que a equipe possa começar a desenvolver funcionalidades.

**Acceptance Criteria:**
1. Projeto monorepo criado com `client/` (React+Vite+Tailwind) e `server/` (Node+Express)
2. Conexão com Supabase configurada via variáveis de ambiente
3. Migration executada criando tabelas: `leads`, `kanban_stages`, `lead_stage_history`, `auto_messages`, `message_log`, `whatsapp_instances`, `scheduled_messages`
4. Tabela `kanban_stages` populada com stages padrão: Novo Lead, Contato Inicial, Qualificado, Proposta Enviada, Negociação, Fechado Ganho, Fechado Perdido
5. Servidor Express rodando com health-check em `GET /api/health`
6. Frontend React renderizando página inicial com conexão confirmada ao backend

#### Story 1.2: Kanban Board & Stage Management

> Como usuário,
> Quero visualizar meus leads em um quadro Kanban e configurar os stages,
> Para que eu tenha visibilidade do meu pipeline de vendas.

**Acceptance Criteria:**
1. Kanban exibe colunas por stage com cards dos leads (nome, telefone, tag, tempo no stage)
2. Drag-and-drop funcional para mover leads entre stages
3. Movimentação registra entrada em `lead_stage_history` com timestamp automático
4. Tela de configuração permite criar, editar (nome, cor), reordenar e excluir stages
5. Stages exibem contagem de leads
6. Kanban atualiza em tempo real via Supabase Realtime

#### Story 1.3: Lead Management (CRUD & Central)

> Como usuário,
> Quero cadastrar, editar, buscar e visualizar meus leads em uma central,
> Para que eu tenha controle completo sobre minha base de contatos.

**Acceptance Criteria:**
1. Formulário de cadastro de lead com campos: nome, telefone (obrigatório), email, empresa, tags, notas
2. Central de leads com listagem paginada, busca por nome/telefone/email
3. Filtros por stage e por tags
4. Tela de detalhe do lead com dados cadastrais, stage atual, e histórico de movimentação entre stages
5. Edição inline dos dados do lead
6. Exclusão de lead com confirmação
7. Leads novos entram automaticamente no primeiro stage do Kanban

### Epic 2: WhatsApp Integration

**Goal:** Conectar o sistema à Evolution API v2 para que o usuário possa gerenciar sua instância WhatsApp e enviar mensagens de texto e imagem diretamente para os leads.

#### Story 2.1: Instance Management & QR Code

> Como usuário,
> Quero criar uma instância WhatsApp e conectar meu número via QR code,
> Para que o sistema possa enviar e receber mensagens.

**Acceptance Criteria:**
1. Tela de configuração WhatsApp com botão "Criar Instância" (nome configurável)
2. Após criar, exibe QR code para scan via `GET /instance/connect/{instance}`
3. QR code atualiza automaticamente se expirar
4. Status de conexão exibido em tempo real (conectado/desconectado) via polling de `GET /instance/connectionState/{instance}`
5. Botão para desconectar/reconectar instância
6. Dados da instância salvos em `whatsapp_instances` no Supabase

#### Story 2.2: Send Text & Media Messages

> Como usuário,
> Quero enviar mensagens de texto e imagens para meus leads via WhatsApp,
> Para que eu possa me comunicar diretamente pelo sistema.

**Acceptance Criteria:**
1. Na tela de detalhe do lead, campo para enviar mensagem de texto via `POST /message/sendText/{instance}`
2. Opção de anexar imagem com legenda via `POST /message/sendMedia/{instance}`
3. Mensagens enviadas registradas em `message_log` com timestamp, tipo, conteúdo e status
4. Feedback visual de sucesso/erro no envio
5. Histórico de mensagens exibido no detalhe do lead em ordem cronológica
6. Tratamento de erro quando instância não está conectada

#### Story 2.3: Webhook & Incoming Messages

> Como usuário,
> Quero ver as respostas dos leads diretamente no sistema,
> Para ter o histórico completo da conversa em um só lugar.

**Acceptance Criteria:**
1. Endpoint `POST /api/webhook/messages` no backend para receber eventos da Evolution API
2. Webhook configurado na instância via `POST /webhook/set/{instance}` com eventos `MESSAGES_UPSERT`
3. Mensagens recebidas salvas em `message_log` com direction = 'incoming'
4. Histórico do lead atualiza em tempo real quando mensagem chega (Supabase Realtime)
5. Notificação visual (badge/toast) quando nova mensagem recebida

### Epic 3: Follow-up Automático & Message Log

**Goal:** Automatizar o envio de mensagens de follow-up baseado no stage do lead e tempo de permanência, com log completo de toda comunicação.

#### Story 3.1: Auto-Message Configuration per Stage

> Como usuário,
> Quero configurar mensagens automáticas para cada stage do Kanban com período definido,
> Para que leads recebam follow-up sem intervenção manual.

**Acceptance Criteria:**
1. Na configuração de cada stage, seção "Mensagens Automáticas" com lista de mensagens
2. Cada mensagem configurável com: template de texto, tipo (texto/imagem), URL da imagem (se aplicável), e delay em minutos/horas/dias após entrada no stage
3. Múltiplas mensagens por stage (ex: 1h, 24h, 72h)
4. Possibilidade de ativar/desativar cada mensagem individualmente
5. Preview da mensagem antes de salvar
6. Dados salvos na tabela `auto_messages`

#### Story 3.2: Message Scheduler & Auto-Send

> Como sistema,
> Quero processar automaticamente a fila de mensagens agendadas,
> Para que os follow-ups sejam enviados no momento configurado.

**Acceptance Criteria:**
1. Quando lead entra em um stage, `scheduled_messages` é populada com as mensagens automáticas desse stage e seus horários de envio calculados
2. Scheduler roda a cada 1 minuto verificando mensagens pendentes com `scheduled_at <= NOW()`
3. Mensagens enviadas via Evolution API (texto ou mídia conforme configuração)
4. Status atualizado em `scheduled_messages` (pending → sent / failed)
5. Retry automático até 3 vezes em caso de falha, com intervalo exponencial
6. Quando lead sai do stage, mensagens pendentes desse stage são canceladas
7. Possibilidade de pausar/retomar automação por lead individual
8. Log de envio registrado em `message_log`

#### Story 3.3: Message Log & Communication History

> Como usuário,
> Quero visualizar todo o histórico de comunicação em um só lugar,
> Para ter rastreabilidade completa das interações com cada lead.

**Acceptance Criteria:**
1. Tela "Message Log" com listagem geral de todas as mensagens (enviadas, recebidas, automáticas)
2. Filtros por lead, tipo (texto/imagem), direction (sent/received/auto), período
3. No detalhe do lead, timeline unificada com mensagens + movimentações de stage
4. Indicador visual diferenciando mensagens manuais, automáticas e recebidas
5. Exportação do histórico em CSV

---

## 7. Database Schema Reference

```sql
-- Stages configuráveis do Kanban
kanban_stages (
  id UUID PK DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Leads
leads (
  id UUID PK DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  current_stage_id UUID FK → kanban_stages(id),
  auto_followup_paused BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Histórico de movimentação
lead_stage_history (
  id UUID PK DEFAULT gen_random_uuid(),
  lead_id UUID FK → leads(id) ON DELETE CASCADE,
  from_stage_id UUID FK → kanban_stages(id),
  to_stage_id UUID FK → kanban_stages(id),
  moved_at TIMESTAMPTZ DEFAULT now()
)

-- Mensagens automáticas por stage
auto_messages (
  id UUID PK DEFAULT gen_random_uuid(),
  stage_id UUID FK → kanban_stages(id) ON DELETE CASCADE,
  message_template TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image')) DEFAULT 'text',
  media_url TEXT,
  delay_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Log de mensagens
message_log (
  id UUID PK DEFAULT gen_random_uuid(),
  lead_id UUID FK → leads(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('outgoing', 'incoming', 'auto')) NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image')) DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  whatsapp_message_id TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT now()
)

-- Instâncias WhatsApp
whatsapp_instances (
  id UUID PK DEFAULT gen_random_uuid(),
  instance_name TEXT UNIQUE NOT NULL,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Fila de mensagens agendadas
scheduled_messages (
  id UUID PK DEFAULT gen_random_uuid(),
  lead_id UUID FK → leads(id) ON DELETE CASCADE,
  auto_message_id UUID FK → auto_messages(id) ON DELETE CASCADE,
  stage_id UUID FK → kanban_stages(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

---

## 8. Next Steps

### 8.1 Architect Prompt

> @architect — Analise o PRD em `docs/prd.md` para o sistema LeadTrack Pro. Crie a arquitetura técnica detalhada cobrindo: estrutura do monorepo (client/server), API routes do Express, integração com Evolution API v2, schema Supabase (migrations), Realtime subscriptions, e o scheduler de mensagens automáticas. Stack: React+Vite+Tailwind, Node+Express, Supabase.

### 8.2 UX Expert Prompt

> @ux-design-expert — Analise o PRD em `docs/prd.md` e crie o frontend spec para o LeadTrack Pro. Foco no Kanban board (drag-and-drop, cards de leads, configuração de stages), Central de Leads (listagem, filtros, busca), Detalhe do Lead (timeline de mensagens + stages), e configuração de WhatsApp (QR code, status). Stack: React + TailwindCSS. Web Responsive.
