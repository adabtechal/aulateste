const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../services/bookingConfirmation');

// ─── AVAILABILITY CRUD (authenticated, admin only) ───

// GET /api/scheduling/availability — List availability for tenant
router.get('/availability', requireAuth, async (req, res, next) => {
  try {
    const tenantId = req.auth.profile.tenant_id;
    const { data, error } = await supabase
      .from('scheduling_availability')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/scheduling/availability — Create slot
router.post('/availability', requireAuth, requireRole('superadmin', 'tenant_admin'), async (req, res, next) => {
  try {
    const tenantId = req.auth.profile.tenant_id;
    const { day_of_week, start_time, end_time, is_active } = req.body;

    if (day_of_week == null || !start_time || !end_time) {
      return res.status(400).json({ error: true, message: 'day_of_week, start_time, and end_time are required' });
    }

    const { data, error } = await supabase
      .from('scheduling_availability')
      .insert({
        tenant_id: tenantId,
        day_of_week,
        start_time,
        end_time,
        is_active: is_active !== false
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/scheduling/availability/:id — Update slot
router.put('/availability/:id', requireAuth, requireRole('superadmin', 'tenant_admin'), async (req, res, next) => {
  try {
    const { day_of_week, start_time, end_time, is_active } = req.body;
    const { data, error } = await supabase
      .from('scheduling_availability')
      .update({ day_of_week, start_time, end_time, is_active })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/scheduling/availability/:id — Remove slot
router.delete('/availability/:id', requireAuth, requireRole('superadmin', 'tenant_admin'), async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('scheduling_availability')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/scheduling/availability/:id/toggle — Toggle active state
router.patch('/availability/:id/toggle', requireAuth, requireRole('superadmin', 'tenant_admin'), async (req, res, next) => {
  try {
    const { data: current } = await supabase
      .from('scheduling_availability')
      .select('is_active')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('scheduling_availability')
      .update({ is_active: !current.is_active })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── BOOKINGS (authenticated, admin) ───

// GET /api/scheduling/bookings — List bookings for tenant
router.get('/bookings', requireAuth, async (req, res, next) => {
  try {
    const tenantId = req.auth.profile.tenant_id;
    const { page = 1, limit = 20, date, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (date) query = query.eq('booking_date', date);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('booking_date', { ascending: false })
      .order('booking_time')
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;
    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/scheduling/bookings/by-phone/:phone — Lookup bookings by phone (for agent)
router.get('/bookings/by-phone/:phone', requireAuth, async (req, res, next) => {
  try {
    const tenantId = req.auth.profile.tenant_id;
    const { data, error } = await supabase
      .from('bookings')
      .select('id, client_name, client_phone, service_interest, booking_date, booking_time, status')
      .eq('tenant_id', tenantId)
      .eq('client_phone', req.params.phone)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/scheduling/tenant-slug — Get tenant slug for booking link
router.get('/tenant-slug', requireAuth, async (req, res, next) => {
  try {
    const tenantId = req.auth.profile.tenant_id;
    const { data, error } = await supabase
      .from('tenants')
      .select('slug, name')
      .eq('id', tenantId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
