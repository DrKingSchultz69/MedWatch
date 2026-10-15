import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('medwatch_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  status: 'pending' | 'dispensed' | 'cancelled';
  diagnosis: string;
}

interface PrescriptionState {
  prescriptions: Prescription[];
  isLoading: boolean;
  fetchPrescriptions: () => Promise<void>;
  addPrescription: (p: Omit<Prescription, 'id'>) => Promise<void>;
  updateStatus: (id: string, status: Prescription['status']) => Promise<void>;
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
  prescriptions: [],
  isLoading: false,

  fetchPrescriptions: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/prescriptions`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      const data = await res.json();
      set({ prescriptions: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      set({ isLoading: false });
    }
  },

  addPrescription: async (p) => {
    try {
      const res = await fetch(`${API_BASE}/prescriptions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error('Failed to create prescription');
      const newPrescription = await res.json();
      set((state) => ({
        prescriptions: [newPrescription, ...state.prescriptions],
      }));
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/prescriptions/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update prescription status');
      const updated = await res.json();
      set((state) => ({
        prescriptions: state.prescriptions.map((p) =>
          p.id === id ? updated : p
        ),
      }));
    } catch (error) {
      console.error('Error updating prescription status:', error);
      throw error;
    }
  },
}));
