import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth';
import appointmentRoutes from './routes/appointments';
import prescriptionRoutes from './routes/prescriptions';
import vitalsRoutes from './routes/vitals';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Behind Vercel's proxy: trust X-Forwarded-For so rate limiting sees real client IPs
app.set('trust proxy', 1);

// ─── Security ────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsing ────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────
app.use(morgan('dev'));

// ─── Health check ────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MedWatch API',
    timestamp: new Date().toISOString(),
  });
});

import usersRoutes from './routes/users';

// ─── API Routes ──────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/vitals', vitalsRoutes);

// ─── 404 handler ─────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: { message: 'Route not found', code: 'NOT_FOUND' },
  });
});

// ─── Error handler ───────────────────────────────────
app.use(errorHandler);

export default app;
