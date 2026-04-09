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
const usersRouter = require('./routes/users');
const kestraRouter = require('./routes/kestra');
const botConfigRouter = require('./routes/botConfig');

const app = express();
const PORT = process.env.PORT || 3001;

// Em dev, aceita qualquer origin localhost (Vite pode subir em 5173, 5174, etc).
// Em prod, restringe ao CLIENT_URL configurado.
const isDev = process.env.NODE_ENV === 'development';
const corsOrigin = isDev
  ? (origin, callback) => {
      if (!origin) return callback(null, true); // requests same-origin / curl
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // permissivo em dev
    }
  : process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: corsOrigin, credentials: true }));
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
app.use('/api/users', usersRouter);
app.use('/api/kestra', kestraRouter);
app.use('/api/bot-config', botConfigRouter);

// Error handling
app.use(errorHandler);

// Start scheduler
startScheduler();

app.listen(PORT, () => {
  console.log(`LeadTrack API running on http://localhost:${PORT}`);
});
