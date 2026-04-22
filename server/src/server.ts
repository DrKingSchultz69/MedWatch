import http from 'http';
import dotenv from 'dotenv';

// Load env vars before anything else
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { setupVitalsWebSocket } from './sockets/vitalsSocket';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Attach WebSocket server
    setupVitalsWebSocket(server);

    // Start listening
    server.listen(PORT, () => {
      console.log('');
      console.log('══════════════════════════════════════════════');
      console.log('  🏥 MedWatch HMS Backend');
      console.log('══════════════════════════════════════════════');
      console.log(`  🚀 REST API:    http://localhost:${PORT}/api`);
      console.log(`  🔌 WebSocket:   ws://localhost:${PORT}/ws/vitals`);
      console.log(`  🩺 Health:      http://localhost:${PORT}/api/health`);
      console.log(`  🌐 CORS:        ${process.env.CORS_ORIGIN}`);
      console.log('══════════════════════════════════════════════');
      console.log('');
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
