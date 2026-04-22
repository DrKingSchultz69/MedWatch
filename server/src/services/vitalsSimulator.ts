/**
 * Realistic vital signs simulator.
 * Generates vitals matching the frontend simulator ranges:
 * - Heart Rate: 66-78 bpm
 * - SpO2: 96-100%
 * - Temperature: 36.3-36.9°C
 * - Respiration Rate: 14-18 breaths/min
 * - BP Systolic: 115-125 mmHg
 * - BP Diastolic: 76-84 mmHg
 *
 * ECG waveform: P wave → QRS complex → T wave + slight noise
 */

export interface GeneratedVitals {
  timestamp: number;
  heart_rate: number;
  spo2: number;
  temperature: number;
  respiration_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
}

// Smooth random walk state per patient
const patientStates = new Map<string, {
  hr: number;
  spo2: number;
  temp: number;
  rr: number;
  sys: number;
  dia: number;
}>();

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function drift(current: number, min: number, max: number, maxDelta: number): number {
  const delta = (Math.random() - 0.5) * 2 * maxDelta;
  return clamp(current + delta, min, max);
}

export function generateVitals(patientId: string): GeneratedVitals {
  let state = patientStates.get(patientId);

  if (!state) {
    // Initialize with realistic baseline
    state = {
      hr: 72,
      spo2: 98,
      temp: 36.6,
      rr: 16,
      sys: 120,
      dia: 80,
    };
    patientStates.set(patientId, state);
  }

  // Smooth random walk
  state.hr = Math.round(drift(state.hr, 66, 78, 2));
  state.spo2 = Math.round(drift(state.spo2, 96, 100, 0.5));
  state.temp = Math.round(drift(state.temp, 36.3, 36.9, 0.1) * 10) / 10;
  state.rr = Math.round(drift(state.rr, 14, 18, 1));
  state.sys = Math.round(drift(state.sys, 115, 125, 2));
  state.dia = Math.round(drift(state.dia, 76, 84, 1.5));

  return {
    timestamp: Date.now(),
    heart_rate: state.hr,
    spo2: state.spo2,
    temperature: state.temp,
    respiration_rate: state.rr,
    bp_systolic: state.sys,
    bp_diastolic: state.dia,
  };
}

/**
 * ECG waveform generator.
 * Produces a batch of `count` samples representing a realistic ECG waveform.
 * Uses the same algorithm as the frontend VitalsSimulator.
 */
let ecgPhase = 0;

export function generateECG(count: number = 8): number[] {
  const data: number[] = [];
  for (let i = 0; i < count; i++) {
    ecgPhase += 0.15;
    const cycle = ecgPhase % (2 * Math.PI);
    let value = 0;

    // P wave
    if (cycle > 0.5 && cycle < 1.2) {
      value = 0.15 * Math.sin(((cycle - 0.5) * Math.PI) / 0.7);
    }
    // QRS complex
    else if (cycle > 1.5 && cycle < 1.7) {
      value = -0.2;
    } else if (cycle > 1.7 && cycle < 2.0) {
      value = 1.0 * Math.sin(((cycle - 1.7) * Math.PI) / 0.3);
    } else if (cycle > 2.0 && cycle < 2.2) {
      value = -0.15;
    }
    // T wave
    else if (cycle > 2.8 && cycle < 3.6) {
      value = 0.2 * Math.sin(((cycle - 2.8) * Math.PI) / 0.8);
    }

    // Noise
    value += (Math.random() - 0.5) * 0.03;
    data.push(Math.round(value * 1000) / 1000);
  }
  return data;
}

/**
 * Clean up state for a patient when they disconnect.
 */
export function clearPatientState(patientId: string): void {
  patientStates.delete(patientId);
}
