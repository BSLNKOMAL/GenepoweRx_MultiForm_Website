require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB = require('./config/db');

const app = express();
connectDB();

// ── CORS — allow Vercel frontend + localhost dev ──────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'https://genepowe-rx-multi-form-website.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', require('./routes/api'));

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  env: process.env.NODE_ENV,
  timestamp: new Date()
}));

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);
});