const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '2026-06-01-claude-4-5' });
});

app.use('/api/leads', require('./routes/leads'));
app.use('/api/outreach', require('./routes/outreach'));
app.use('/api/inbox', require('./routes/inbox'));
app.use('/api/websites', require('./routes/websites'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/clients', require('./routes/clients'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));