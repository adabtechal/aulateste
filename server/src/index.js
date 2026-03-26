const path = require('path');
// Try root .env first, then server/.env as fallback
const rootEnv = path.resolve(__dirname, '../../.env');
const serverEnv = path.resolve(__dirname, '../.env');
const fs = require('fs');
const envPath = fs.existsSync(rootEnv) ? rootEnv : serverEnv;
require('dotenv').config({ path: envPath });

const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const { startScheduler } = require('./services/scheduler');

const leadsRouter = require('./routes/leads');
const stagesRouter = require('./routes/stages');
const messagesRouter = require('./routes/messages');
const whatsappRouter = require('./routes/whatsapp');
const autoMessagesRouter = require('./routes/autoMessages');
const webhookRouter = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', async (req, res) => {
  const supabase = require('./lib/supabase');
  const { data, error } = await supabase.from('kanban_stages').select('id').limit(1);

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: error ? 'error' : 'connected',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/leads', leadsRouter);
app.use('/api/stages', stagesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/auto-messages', autoMessagesRouter);
app.use('/api/webhook', webhookRouter);

// Error handling
app.use(errorHandler);

// Start scheduler
startScheduler();

app.listen(PORT, () => {
  console.log(`LeadTrack API running on http://localhost:${PORT}`);
});
