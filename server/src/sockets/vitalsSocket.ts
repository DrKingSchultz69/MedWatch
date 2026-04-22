import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { URL } from 'url';
import { generateVitals, generateECG, clearPatientState } from '../services/vitalsSimulator';
import VitalReading from '../models/VitalReading';
import { TokenPayload } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'medwatch-dev-secret';

interface VitalsClient {
  ws: WebSocket;
  patientId: string;
  userId: string;
  vitalsInterval: ReturnType<typeof setInterval> | null;
  ecgInterval: ReturnType<typeof setInterval> | null;
  persistErrorLogged?: boolean;
}

const clients = new Map<WebSocket, VitalsClient>();

/**
 * Initialize WebSocket server for real-time vitals streaming.
 * Endpoint: ws://localhost:4000/ws/vitals?patientId=xxx&token=JWT
 */
export function setupVitalsWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/ws/vitals',
  });

  console.log('🔌 WebSocket server ready at /ws/vitals');

  wss.on('connection', (ws: WebSocket, req) => {
    try {
      // Parse query parameters
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const patientId = url.searchParams.get('patientId');

      // Authenticate
      if (!token) {
        ws.close(4001, 'Authentication required');
        return;
      }

      let decoded: TokenPayload;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      } catch {
        ws.close(4001, 'Invalid or expired token');
        return;
      }

      if (!patientId) {
        ws.close(4002, 'Patient ID required');
        return;
      }

      console.log(`🔗 WebSocket connected: user=${decoded.email}, patientId=${patientId}`);

      const client: VitalsClient = {
        ws,
        patientId,
        userId: decoded.id,
        vitalsInterval: null,
        ecgInterval: null,
      };

      clients.set(ws, client);

      // Stream vitals every 1 second (persisted to MongoDB if valid patientId)
      const canPersist = mongoose.Types.ObjectId.isValid(patientId);
      client.vitalsInterval = setInterval(async () => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const vitals = generateVitals(patientId);

        // Send to client
        ws.send(JSON.stringify({ type: 'vitals', data: vitals }));

        // Persist to MongoDB only if patientId is a valid ObjectId
        if (canPersist) {
          try {
            await VitalReading.create({
              patientId,
              ...vitals,
            });
          } catch (err: any) {
            // Log only once, not on every tick
            if (!client.persistErrorLogged) {
              console.error('Failed to persist vital reading:', err.message);
              client.persistErrorLogged = true;
            }
          }
        }
      }, 1000);

      // Stream ECG every 100ms (in-memory only, not persisted)
      client.ecgInterval = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const ecgData = generateECG(8);
        ws.send(JSON.stringify({ type: 'ecg', data: ecgData }));
      }, 100);

      // Handle disconnect
      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected: user=${decoded.email}`);
        cleanup(ws);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        cleanup(ws);
      });

      // Handle incoming messages (e.g., change patient)
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'changePatient' && msg.patientId) {
            client.patientId = msg.patientId;
            console.log(`🔄 Switched to patient: ${msg.patientId}`);
          }
        } catch {
          // Ignore malformed messages
        }
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(4000, 'Internal server error');
    }
  });

  return wss;
}

function cleanup(ws: WebSocket): void {
  const client = clients.get(ws);
  if (client) {
    if (client.vitalsInterval) clearInterval(client.vitalsInterval);
    if (client.ecgInterval) clearInterval(client.ecgInterval);
    clearPatientState(client.patientId);
    clients.delete(ws);
  }
}
