import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/medwatch';

// Cached across invocations on a warm serverless instance
let connecting: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 }).catch((err) => {
      connecting = null;
      throw err;
    });
  }
  const conn = await connecting;
  console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

export default connectDB;
