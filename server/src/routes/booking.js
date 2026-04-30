const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { sendBookingConfirmation } = require('../services/bookingConfirmation');

// ─── PUBLIC BOOKING ENDPOINTS (no auth required) ───

// GET /api/booking/:tenantSlug/availability-month — Days with availability
router.get('/:tenantSlug/availability-month', async (req, res, next) => {
  try {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', req.params.tenantSlug)
      .single();

    if (!tenant) return res.status(404).json({ error: true, message: 'Tenant not found' });

    const { data, error } = await supabase
      .from('scheduling_availability')
      .select('day_of_week')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true);

    if (error) throw error;

    const activeDays = [...new Set(data.map(d => d.day_of_week))];
    res.json({ activeDays });
  } catch (err) {
    next(err);
  }
});

// GET /api/booking/:tenantSlug/availability?date=YYYY-MM-DD — Available slots for date
router.get('/:tenantSlug/availability', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: true, message: 'date query param is required (YYYY-MM-DD)' });

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', req.params.tenantSlug)
      .single();

    if (!tenant) return res.status(404).json({ error: true, message: 'Tenant not found' });

    const dayOfWeek = new Date(date + 'T12:00:00').getDay();

    const { data: availability, error: availError } = await supabase
      .from('scheduling_availability')
      .select('start_time, end_time')
      .eq('tenant_id', tenant.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('start_time');

    if (availError) throw availError;

    // Generate 30-min slots from availability ranges
    const allSlots = [];
    for (const range of availability) {
      const [startH, startM] = range.start_time.split(':').map(Number);
      const [endH, endM] = range.end_time.split(':').map(Number);
      let currentMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      while (currentMin < endMin) {
        const h = String(Math.floor(currentMin / 60)).padStart(2, '0');
        const m = String(currentMin % 60).padStart(2, '0');
        allSlots.push(`${h}:${m}`);
        currentMin += 30;
      }
    }

    // Remove already booked slots
    const { data: booked, error: bookedError } = await supabase
      .from('bookings')
      .select('booking_time')
      .eq('tenant_id', tenant.id)
      .eq('booking_date', date)
      .eq('status', 'confirmed');

    if (bookedError) throw bookedError;

    const bookedTimes = new Set(booked.map(b => b.booking_time.substring(0, 5)));
    const availableSlots = allSlots.filter(s => !bookedTimes.has(s));

    res.json({ date, slots: availableSlots });
  } catch (err) {
    next(err);
  }
});

// POST /api/booking/:tenantSlug/confirm — Confirm a booking
router.post('/:tenantSlug/confirm', async (req, res, next) => {
  try {
    const { client_name, client_phone, service_interest, booking_date, booking_time } = req.body;

    if (!client_name || !client_phone || !service_interest || !booking_date || !booking_time) {
      return res.status(400).json({ error: true, message: 'All fields are required: client_name, client_phone, service_interest, booking_date, booking_time' });
    }

    // Validate phone format (10-11 digits)
    const phoneDigits = client_phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return res.status(400).json({ error: true, message: 'Invalid phone format. Use 10-11 digits.' });
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', req.params.tenantSlug)
      .single();

    if (!tenant) return res.status(404).json({ error: true, message: 'Tenant not found' });

    // Check slot still available (race condition prevention)
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .eq('status', 'confirmed');

    if (count > 0) {
      return res.status(409).json({ error: true, message: 'This time slot is no longer available. Please choose another.' });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenant.id,
        client_name,
        client_phone: phoneDigits,
        service_interest,
        booking_date,
        booking_time,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) throw error;

    // Fire-and-forget: send WhatsApp confirmation + resolve/create lead
    sendBookingConfirmation(booking, tenant.id).catch(err => {
      console.error('Booking confirmation failed (non-blocking):', err.message);
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
