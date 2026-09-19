import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import blockReportRoutes from './routes/blockReportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initSocketServer, onlineSocketsMap } from './socket/socketHandler.js';
import { locations, getCountries, getStates, getDistricts } from './utils/locationsData.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:7001',
  'http://localhost:7001',
  'http://127.0.0.1:7001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://chatmate-1-3khk.onrender.com',
  'https://chatmate-7we0.onrender.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // Allow client requests dynamically in dev
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', globalLimiter);

// Auth Rate Limiting (Brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', blockReportRoutes);
app.use('/api/admin', adminRoutes);

// Location hierarchy API (Countries, States, Districts/Places)
app.get('/api/locations/countries', (req, res) => {
  res.json({ countries: getCountries() });
});

app.get('/api/locations/states', (req, res) => {
  const { country = 'India' } = req.query;
  res.json({ states: getStates(country) });
});

app.get('/api/locations/districts', (req, res) => {
  const { country = 'India', state } = req.query;
  if (!state) {
    return res.status(400).json({ error: 'State parameter is required' });
  }
  res.json({ districts: getDistricts(country, state) });
});

// Live Online Users Count API Endpoint
app.get('/api/stats/online-count', (req, res) => {
  const count = onlineSocketsMap ? onlineSocketsMap.size : 0;
  res.json({ onlineCount: count });
});

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dbConnected: mongoose.connection.readyState === 1,
    onlineCount: onlineSocketsMap ? onlineSocketsMap.size : 0,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.',
  });
});

// Initialize Socket.IO Server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

initSocketServer(io);

// Database Connection & Server Listener
const PORT = process.env.PORT || 7000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/privacy_dating';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔒 E2EE & WebRTC Signaling active`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    // Allow server to run even if DB is connecting asynchronously
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (DB Connection pending)`);
    });
  });
