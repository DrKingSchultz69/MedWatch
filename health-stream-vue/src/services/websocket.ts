import { useVitalsStore } from '@/stores/vitalsStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const VITALS_POLL_MS = 2000;

/**
 * Real-time vitals client. Polls the backend for the next simulated reading
 * (serverless hosting can't hold a WebSocket open) and draws the ECG locally.
 * Falls back to local simulation if the backend can't be reached.
 */
class VitalsPoller {
  private patientId = 'default';
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private ecgInterval: ReturnType<typeof setInterval> | null = null;
  private ecgPhase = 0;

  /**
   * Start streaming vitals for a patient.
   * @param patientId - The patient to monitor
   */
  start(patientId?: string) {
    // Clean up any existing stream
    this.stop();

    this.patientId = patientId || 'default';

    // ECG waveform is simulated client-side (it was never persisted)
    this.ecgInterval = setInterval(() => {
      useVitalsStore.getState().pushECG(this.generateECG(8));
    }, 100);

    this.poll();
    this.pollInterval = setInterval(() => this.poll(), VITALS_POLL_MS);
  }

  private async poll() {
    const token = localStorage.getItem('medwatch_token');
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/vitals/${encodeURIComponent(this.patientId)}/live`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          useVitalsStore.getState().setVitals(await res.json());
          return;
        }
      } catch {
        // fall through to local simulation
      }
    }

    // Fallback: local simulation (same as original VitalsSimulator)
    useVitalsStore.getState().setVitals({
      timestamp: Date.now(),
      heart_rate: 72 + Math.floor(Math.random() * 12 - 6),
      spo2: 97 + Math.floor(Math.random() * 3 - 1),
      temperature: Math.round((36.6 + (Math.random() * 0.6 - 0.3)) * 10) / 10,
      respiration_rate: 16 + Math.floor(Math.random() * 4 - 2),
      bp_systolic: 120 + Math.floor(Math.random() * 10 - 5),
      bp_diastolic: 80 + Math.floor(Math.random() * 8 - 4),
    });
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
    this.patientId = patientId;
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.ecgInterval) {
      clearInterval(this.ecgInterval);
      this.ecgInterval = null;
    }
  }
}

export const vitalsSimulator = new VitalsPoller();
