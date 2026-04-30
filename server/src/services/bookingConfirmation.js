const supabase = require('../lib/supabase');
const evolutionApi = require('./evolutionApi');

/**
 * Resolve or create a lead from booking data.
 * If phone matches existing lead, links booking to it.
 * If new, creates lead and links.
 */
async function resolveLeadFromBooking(booking, tenantId) {
  try {
    // Search existing lead by phone (tenant-scoped)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', booking.client_phone)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    let leadId;

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      // Get first active stage
      const { data: firstStage } = await supabase
        .from('kanban_stages')
        .select('id')
        .order('position')
        .limit(1)
        .single();

      // Create new lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: booking.client_name,
          phone: booking.client_phone,
          tenant_id: tenantId,
          current_stage_id: firstStage?.id,
          tags: ['agendamento'],
          notes: 'Lead criado via agendamento publico'
        })
        .select('id')
        .single();

      if (leadError) {
        // Handle race condition (duplicate phone)
        if (leadError.code === '23505') {
          const { data: retryLead } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', booking.client_phone)
            .eq('tenant_id', tenantId)
            .single();
          leadId = retryLead?.id;
        } else {
          console.error('Error creating lead from booking:', leadError.message);
          return null;
        }
      } else {
        leadId = newLead.id;
        // Record stage history
        if (firstStage?.id) {
          await supabase.from('lead_stage_history').insert({
            lead_id: leadId,
            from_stage_id: null,
            to_stage_id: firstStage.id
          });
        }
      }
    }

    // Link booking to lead
    if (leadId) {
      await supabase
        .from('bookings')
        .update({ lead_id: leadId })
        .eq('id', booking.id);
    }

    return leadId;
  } catch (err) {
    console.error('resolveLeadFromBooking error:', err.message);
    return null;
  }
}

/**
 * Send WhatsApp confirmation with retry (max 3 attempts).
 * Fire-and-forget — does not block the booking response.
 */
async function sendBookingConfirmation(booking, tenantId) {
  try {
    // Resolve/create lead first (to have lead_id for message_log)
    const leadId = await resolveLeadFromBooking(booking, tenantId);

    // Find active WhatsApp instance for tenant
    let instance = null;
    const { data: connectedInstance } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('tenant_id', tenantId)
      .eq('status', 'connected')
      .limit(1)
      .maybeSingle();

    instance = connectedInstance;

    if (!instance) {
      // Try any instance
      const { data: anyInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .limit(1)
        .maybeSingle();

      if (!anyInstance) {
        console.warn('No WhatsApp instance found for booking confirmation');
        return;
      }
      instance = anyInstance;
    }

    // Format confirmation message
    const dateFormatted = new Date(booking.booking_date + 'T12:00:00')
      .toLocaleDateString('pt-BR');
    const timeFormatted = booking.booking_time.substring(0, 5);

    const message = `Ola ${booking.client_name}! ✅\n\nSeu agendamento foi confirmado:\n📋 Servico: ${booking.service_interest}\n📅 Data: ${dateFormatted}\n🕐 Horario: ${timeFormatted}\n\nObrigado pela preferencia!`;

    // Phone format for Evolution API (add 55 prefix if needed)
    let phone = booking.client_phone;
    if (!phone.startsWith('55')) {
      phone = '55' + phone;
    }

    // Retry with progressive backoff (2s, 5s, 10s)
    const delays = [2000, 5000, 10000];
    let sent = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await evolutionApi.sendText(instance.instance_name, phone, message);
        sent = true;
        break;
      } catch (err) {
        console.warn(`Booking confirmation attempt ${attempt + 1} failed:`, err.message);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, delays[attempt]));
        }
      }
    }

    // Log in message_log regardless of send success
    if (sent) {
      await supabase.from('message_log').insert({
        lead_id: leadId,
        tenant_id: tenantId,
        direction: 'outgoing',
        message_type: 'text',
        content: message,
        whatsapp_instance: instance.instance_name,
        status: 'sent'
      });

      // Update booking confirmation status
      await supabase
        .from('bookings')
        .update({
          confirmation_sent: true,
          confirmation_sent_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      console.log(`Booking confirmation sent to ${phone} for booking ${booking.id}`);
    } else {
      console.error(`Failed to send booking confirmation after 3 attempts for booking ${booking.id}`);
    }
  } catch (err) {
    console.error('sendBookingConfirmation error:', err.message);
    // Graceful degradation — booking stays valid
  }
}

module.exports = { sendBookingConfirmation, resolveLeadFromBooking };
