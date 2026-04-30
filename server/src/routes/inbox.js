const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/inbox — Leads with last message, sorted by most recent activity
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;

    // Get all leads with their stage info
    let leadsQuery = supabase
      .from('leads')
      .select('id, name, phone, email, company, tags, current_stage_id, created_at, kanban_stages(name, color)');

    if (search) {
      leadsQuery = leadsQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: leads, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    if (!leads.length) return res.json([]);

    // Get last message for each lead + unread count (incoming without a reply after)
    const leadIds = leads.map(l => l.id);

    // Get latest message per lead
    const { data: lastMessages, error: msgError } = await supabase
      .from('message_log')
      .select('lead_id, content, direction, message_type, sent_at')
      .in('lead_id', leadIds)
      .order('sent_at', { ascending: false });

    if (msgError) throw msgError;

    // Group: pick first (most recent) per lead, count unread
    const leadMsgMap = {};
    for (const msg of lastMessages) {
      if (!leadMsgMap[msg.lead_id]) {
        // First non-internal message becomes the preview; internal notes don't count as last message
        leadMsgMap[msg.lead_id] = { lastMessage: msg.direction !== 'internal' ? msg : null, unread: 0, totalMessages: 0 };
      }
      // Set lastMessage to first non-internal message if not yet set
      if (!leadMsgMap[msg.lead_id].lastMessage && msg.direction !== 'internal') {
        leadMsgMap[msg.lead_id].lastMessage = msg;
      }
      leadMsgMap[msg.lead_id].totalMessages++;
      // Skip internal notes for unread counting
      if (msg.direction === 'internal') continue;
      // Count incoming messages that came after the last outgoing
      if (msg.direction === 'incoming' && !leadMsgMap[msg.lead_id]._sawOutgoing) {
        leadMsgMap[msg.lead_id].unread++;
      }
      if (msg.direction === 'outgoing') {
        leadMsgMap[msg.lead_id]._sawOutgoing = true;
      }
    }

    // Merge leads with message data
    const conversations = leads.map(lead => {
      const msgData = leadMsgMap[lead.id];
      return {
        ...lead,
        last_message: msgData?.lastMessage || null,
        unread_count: msgData?.unread || 0,
        total_messages: msgData?.totalMessages || 0,
        last_activity: msgData?.lastMessage?.sent_at || lead.created_at,
      };
    });

    // Sort by last activity (most recent first), prioritize those with messages
    conversations.sort((a, b) => {
      // Leads with messages come first
      if (a.last_message && !b.last_message) return -1;
      if (!a.last_message && b.last_message) return 1;
      return new Date(b.last_activity) - new Date(a.last_activity);
    });

    // Clean up internal flags
    conversations.forEach(c => {
      if (leadMsgMap[c.id]) delete leadMsgMap[c.id]._sawOutgoing;
    });

    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
