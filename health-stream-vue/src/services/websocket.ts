import { useVitalsStore } from '@/stores/vitalsStore';

const WS_BASE = 'ws://localhost:4000/ws/vitals';

/**
 * Real-time WebSocket client that connects to the backend vitals stream.
 * Falls back to local simulation if WebSocket connection fails.
 */
class VitalsWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private fallbackInterval: ReturnType<typeof setInterval> | null = null;
  private ecgPhase = 0;

  /**
   * Connect to the backend WebSocket vitals stream.
   * @param patientId - The patient to monitor
   */
  start(patientId?: string) {
    // Clean up any existing connection
    this.stop();

    const token = localStorage.getItem('medwatch_token');
    const pid = patientId || 'default';

    if (token) {
      try {
        const url = `${WS_BASE}?patientId=${pid}&token=${token}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('🔗 Vitals WebSocket connected');
          // Clear any fallback simulator
          if (this.fallbackInterval) {
            clearInterval(this.fallbackInterval);
            this.fallbackInterval = null;
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'vitals') {
              useVitalsStore.getState().setVitals(msg.data);
            } else if (msg.type === 'ecg') {
              useVitalsStore.getState().pushECG(msg.data);
            }
          } catch (err) {
            console.error('Failed to parse WS message:', err);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 Vitals WebSocket disconnected');
          // Fall back to local simulation
          this.startFallback();
          // Try reconnect after 5s
          this.reconnectTimer = setTimeout(() => this.start(patientId), 5000);
        };

        this.ws.onerror = (err) => {
          console.warn('WebSocket error, falling back to local simulation:', err);
        };

        return;
      } catch {
        console.warn('WebSocket connection failed, using local simulation');
      }
    }

    // Fallback: local simulation (same as original VitalsSimulator)
    this.startFallback();
  }

  /**
   * Local fallback simulator (same algorithm as original code).
   */
  private startFallback() {
    if (this.fallbackInterval) return;

    this.fallbackInterval = setInterval(() => {
      const vitals = {
        timestamp: Date.now(),
        heart_rate: 72 + Math.floor(Math.random() * 12 - 6),
        spo2: 97 + Math.floor(Math.random() * 3 - 1),
        temperature: Math.round((36.6 + (Math.random() * 0.6 - 0.3)) * 10) / 10,
        respiration_rate: 16 + Math.floor(Math.random() * 4 - 2),
        bp_systolic: 120 + Math.floor(Math.random() * 10 - 5),
        bp_diastolic: 80 + Math.floor(Math.random() * 8 - 4),
      };

      useVitalsStore.getState().setVitals(vitals);
      useVitalsStore.getState().pushECG(this.generateECG(8));
    }, 100);
  }

  private generateECG(count: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
      this.ecgPhase += 0.15;
      const cycle = this.ecgPhase % (2 * Math.PI);
      let value = 0;
      if (cycle > 0.5 && cycle < 1.2) value = 0.15 * Math.sin((cycle - 0.5) * Math.PI / 0.7);
      else if (cycle > 1.5 && cycle < 1.7) value = -0.2;
      else if (cycle > 1.7 && cycle < 2.0) value = 1.0 * Math.sin((cycle - 1.7) * Math.PI / 0.3);
      else if (cycle > 2.0 && cycle < 2.2) value = -0.15;
      else if (cycle > 2.8 && cycle < 3.6) value = 0.2 * Math.sin((cycle - 2.8) * Math.PI / 0.8);
      value += (Math.random() - 0.5) * 0.03;
      data.push(value);
    }
    return data;
  }

  /**
   * Change the patient being monitored.
   */
  changePatient(patientId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'changePatient', patientId }));
    }
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }
}

export const vitalsSimulator = new VitalsWebSocket();
