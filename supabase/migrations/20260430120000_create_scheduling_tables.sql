-- Epic 4 Story 4.1: Scheduling tables (availability + bookings)
-- Idempotent: uses IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS

-- ─── scheduling_availability ───
CREATE TABLE IF NOT EXISTS public.scheduling_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_scheduling_availability_tenant_id
  ON public.scheduling_availability(tenant_id);

CREATE OR REPLACE FUNCTION public.set_scheduling_availability_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scheduling_availability_set_updated_at ON public.scheduling_availability;
CREATE TRIGGER scheduling_availability_set_updated_at
  BEFORE UPDATE ON public.scheduling_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_scheduling_availability_updated_at();

-- ─── bookings ───
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  service_interest text NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  confirmation_sent boolean NOT NULL DEFAULT false,
  confirmation_sent_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(client_phone);

CREATE OR REPLACE FUNCTION public.set_bookings_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;
CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_bookings_updated_at();
