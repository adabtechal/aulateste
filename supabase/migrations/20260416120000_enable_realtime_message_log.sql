-- Habilita Supabase Realtime para message_log e tabelas relacionadas ao chat
-- do lead (mensagens + histórico de stage). Sem isso, a subscription do
-- front nunca recebe eventos de INSERT — o chat só "atualiza" ao recarregar.
--
-- Seguro/idempotente: usa DO block com checagem em pg_publication_tables.
-- Rollback: ALTER PUBLICATION supabase_realtime DROP TABLE <table>;

DO $$
BEGIN
  -- message_log: receber/enviar mensagens
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'message_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_log;
  END IF;

  -- leads: mudanças de stage, tags, etc. refletem no detail page
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;

  -- lead_stage_history: timeline de mudanças de stage
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lead_stage_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_stage_history;
  END IF;
END $$;

-- Garante REPLICA IDENTITY FULL para que o payload do realtime inclua todas
-- as colunas (necessário para filtros server-side como lead_id=eq.X).
ALTER TABLE public.message_log REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.lead_stage_history REPLICA IDENTITY FULL;
