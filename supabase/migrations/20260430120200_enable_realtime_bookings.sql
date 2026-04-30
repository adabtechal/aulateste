-- Epic 4 Story 4.1: Enable Supabase Realtime for bookings table
-- Idempotent: checks pg_publication_tables before adding

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;

ALTER TABLE public.bookings REPLICA IDENTITY FULL;
