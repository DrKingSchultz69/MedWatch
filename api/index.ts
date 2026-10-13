import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server/src/app';
import { connectDB } from '../server/src/config/db';

// Vercel serverless entry: every /api/* request is rewritten here
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { message: 'Database unavailable', code: 'DB_UNAVAILABLE' } }));
    return;
  }
  return app(req as any, res as any);
}
