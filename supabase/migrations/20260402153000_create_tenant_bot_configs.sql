create table if not exists public.tenant_bot_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  enabled boolean not null default true,
  agent_name text not null default 'Atendimento WhatsApp',
  namespace text not null default 'company.bot',
  flow_id text not null default 'tenant-conversation-agent',
  whatsapp_instance text,
  webhook_path text not null default '/api/webhook/messages',
  provider text not null default 'openai',
  model text not null default 'gpt-4.1-mini',
  temperature numeric(4,2) not null default 0.30,
  max_tokens integer not null default 900,
  max_sequential_tools_invocations integer not null default 6,
  memory_enabled boolean not null default true,
  memory_key text not null default 'lead_phone',
  welcome_message text,
  system_prompt text not null default 'Você é o agente conversacional oficial desta tenant. Responda em português do Brasil, com contexto comercial, use o histórico do lead quando disponível e nunca invente status, preços ou promessas. Quando faltar contexto, peça confirmação antes de agir.',
  execution_labels jsonb not null default '{}'::jsonb,
  handoff_instructions text,
  safety_notes text,
  tools jsonb not null default '[]'::jsonb,
  last_published_at timestamp with time zone,
  last_published_flow_revision integer,
  last_published_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint tenant_bot_configs_tenant_id_key unique (tenant_id),
  constraint tenant_bot_configs_provider_check check (provider in ('openai', 'anthropic', 'mistral', 'openrouter'))
);

create index if not exists idx_tenant_bot_configs_tenant_id on public.tenant_bot_configs(tenant_id);

create or replace function public.set_tenant_bot_configs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenant_bot_configs_set_updated_at on public.tenant_bot_configs;

create trigger tenant_bot_configs_set_updated_at
before update on public.tenant_bot_configs
for each row
execute function public.set_tenant_bot_configs_updated_at();
