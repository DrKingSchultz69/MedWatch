import { create } from 'zustand';

export interface VitalReading {
  timestamp: number;
  heart_rate: number;
  spo2: number;
  temperature: number;
  respiration_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
}

export type VitalStatus = 'normal' | 'warning' | 'danger';

export const getHeartRateStatus = (hr: number): VitalStatus => {
  if (hr < 60 || hr > 100) return hr < 50 || hr > 120 ? 'danger' : 'warning';
  return 'normal';
};

export const getSpO2Status = (spo2: number): VitalStatus => {
  if (spo2 >= 95) return 'normal';
  if (spo2 >= 90) return 'warning';
  return 'danger';
};

export const getTempStatus = (temp: number): VitalStatus => {
  if (temp >= 36.1 && temp <= 37.2) return 'normal';
  if (temp > 37.2 && temp <= 38) return 'warning';
  return temp > 38 || temp < 35 ? 'danger' : 'warning';
};

interface VitalsState {
  currentVitals: VitalReading | null;
  history: VitalReading[];
  ecgData: number[];
  selectedPatientId: string | null;
  setVitals: (vitals: VitalReading) => void;
  pushECG: (data: number[]) => void;
  setSelectedPatient: (id: string | null) => void;
  clearHistory: () => void;
}

const ECG_BUFFER_SIZE = 500;
const HISTORY_SIZE = 60;

export const useVitalsStore = create<VitalsState>((set) => ({
  currentVitals: null,
  history: [],
  ecgData: [],
  selectedPatientId: null,
  setVitals: (vitals) => set((state) => ({
    currentVitals: vitals,
    history: [...state.history.slice(-(HISTORY_SIZE - 1)), vitals],
  })),
  pushECG: (data) => set((state) => ({
    ecgData: [...state.ecgData, ...data].slice(-ECG_BUFFER_SIZE),
  })),
  setSelectedPatient: (id) => set({ selectedPatientId: id }),
  clearHistory: () => set({ history: [], ecgData: [], currentVitals: null }),
}));
