-- Epic 4 Story 4.1: RLS policies for scheduling tables
-- Tenant isolation via auth.jwt() ->> 'tenant_id'

-- ─── scheduling_availability RLS ───
ALTER TABLE public.scheduling_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_select_availability" ON public.scheduling_availability;
CREATE POLICY "tenant_select_availability" ON public.scheduling_availability
  FOR SELECT USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "tenant_insert_availability" ON public.scheduling_availability;
CREATE POLICY "tenant_insert_availability" ON public.scheduling_availability
  FOR INSERT WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "tenant_update_availability" ON public.scheduling_availability;
CREATE POLICY "tenant_update_availability" ON public.scheduling_availability
  FOR UPDATE USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "tenant_delete_availability" ON public.scheduling_availability;
CREATE POLICY "tenant_delete_availability" ON public.scheduling_availability
  FOR DELETE USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- ─── bookings RLS ───
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_select_bookings" ON public.bookings;
CREATE POLICY "tenant_select_bookings" ON public.bookings
  FOR SELECT USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "tenant_insert_bookings" ON public.bookings;
CREATE POLICY "tenant_insert_bookings" ON public.bookings
  FOR INSERT WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "tenant_update_bookings" ON public.bookings;
CREATE POLICY "tenant_update_bookings" ON public.bookings
  FOR UPDATE USING (tenant_id::text = auth.jwt() ->> 'tenant_id');
