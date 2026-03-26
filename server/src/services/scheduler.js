const cron = require('node-cron');
const supabase = require('../lib/supabase');
const { sendScheduledMessage } = require('./messageService');

function startScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      const { data: pendingMessages, error } = await supabase
        .from('scheduled_messages')
        .select('*, auto_messages(*), leads(*)')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .limit(50);

      if (error || !pendingMessages?.length) return;

      for (const scheduled of pendingMessages) {
        if (scheduled.leads?.auto_followup_paused) continue;

        try {
          await sendScheduledMessage(scheduled);
          await supabase
            .from('scheduled_messages')
            .update({ status: 'sent' })
            .eq('id', scheduled.id);
        } catch (err) {
          const attempts = scheduled.attempts + 1;
          const update = {
            attempts,
            last_error: err.message
          };

          if (attempts >= 3) {
            update.status = 'failed';
          } else {
            update.status = 'pending';
            update.scheduled_at = new Date(Date.now() + Math.pow(2, attempts) * 60000).toISOString();
          }

          await supabase
            .from('scheduled_messages')
            .update(update)
            .eq('id', scheduled.id);
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  });

  console.log('Message scheduler started (every 1 min)');
}

module.exports = { startScheduler };
