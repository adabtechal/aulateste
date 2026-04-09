alter table public.tenant_bot_configs
add column if not exists provider_api_key text;
