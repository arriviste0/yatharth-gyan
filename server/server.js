require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

const authRouter     = require('./routes/auth');
const profileRouter  = require('./routes/profile');
const progressRouter = require('./routes/progress');
const aiRouter       = require('./routes/ai');

const app  = express();
const PORT = process.env.PORT || 5001;

/* ── Middleware ─────────────────────────────────────────────────── */
app.use(cors({
  origin: [
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    'http://localhost:4173',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

/* ── Routes ─────────────────────────────────────────────────────── */
app.use('/api/auth',     authRouter);
app.use('/api/profile',  profileRouter);
app.use('/api/progress', progressRouter);
app.use('/api/ai',       aiRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

/* ── 404 ─────────────────────────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

/* ── Error handler ───────────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

/* ── DB + listen ─────────────────────────────────────────────────── */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Dharma API → http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
