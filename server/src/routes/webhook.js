const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// POST /api/webhook/messages — Receive Evolution API events
router.post('/messages', async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === 'messages.upsert') {
      const message = data;

      // Only process incoming messages (not from us)
      if (message?.key?.fromMe) {
        return res.status(200).json({ received: true });
      }

      const remoteJid = message?.key?.remoteJid || '';
      const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

      // Skip group messages
      if (remoteJid.includes('@g.us')) {
        return res.status(200).json({ received: true, skipped: 'group' });
      }

      // Extrai nome do contato (pushName da Evolution API)
      const pushName = message?.pushName || message?.verifiedBizName || '';

      // Extrai conteudo da mensagem
      const msg = message.message || {};
      const isImage = !!msg.imageMessage;
      const content = msg.conversation
        || msg.extendedTextMessage?.text
        || msg.imageMessage?.caption
        || '';

      // Busca lead pelo telefone
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      let leadId;

      if (existingLead) {
        // Lead ja existe - sem alteracoes no cadastro
        leadId = existingLead.id;
      } else {
        // Lead NAO existe - cadastra e joga no primeiro stage do kanban
        const { data: firstStage } = await supabase
          .from('kanban_stages')
          .select('id')
          .eq('is_active', true)
          .order('position')
          .limit(1)
          .single();

        if (!firstStage) {
          console.error('Webhook: nenhum stage ativo encontrado no kanban');
          return res.status(200).json({ received: true, error: 'no_active_stage' });
        }

        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            name: pushName || phone,
            phone,
            current_stage_id: firstStage.id,
            tags: ['novo-whatsapp']
          })
          .select('id')
          .single();

        if (leadError) {
          // Race condition: lead criado entre select e insert (unique constraint)
          if (leadError.code === '23505') {
            const { data: retryLead } = await supabase
              .from('leads')
              .select('id')
              .eq('phone', phone)
              .single();
            leadId = retryLead?.id;
          } else {
            console.error('Webhook: erro ao criar lead:', leadError.message);
            return res.status(200).json({ received: true, error: leadError.message });
          }
        } else {
          leadId = newLead.id;

          // Registra historico de entrada no kanban
          await supabase.from('lead_stage_history').insert({
            lead_id: leadId,
            from_stage_id: null,
            to_stage_id: firstStage.id
          });

          // Agenda auto-messages do primeiro stage (se houver)
          const { data: autoMessages } = await supabase
            .from('auto_messages')
            .select('*')
            .eq('stage_id', firstStage.id)
            .eq('is_active', true);

          if (autoMessages?.length) {
            const scheduled = autoMessages.map(am => ({
              lead_id: leadId,
              auto_message_id: am.id,
              stage_id: firstStage.id,
              scheduled_at: new Date(Date.now() + am.delay_minutes * 60000).toISOString(),
              status: 'pending'
            }));
            await supabase.from('scheduled_messages').insert(scheduled);
          }
        }
      }

      // Registra a mensagem no message_log
      if (leadId) {
        await supabase.from('message_log').insert({
          lead_id: leadId,
          direction: 'incoming',
          message_type: isImage ? 'image' : 'text',
          content,
          media_url: msg.imageMessage?.url || null,
          whatsapp_message_id: message.key?.id,
          status: 'received'
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(200).json({ received: true, error: err.message });
  }
});

module.exports = router;
