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

export interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
}

interface AppointmentState {
  appointments: Appointment[];
  isLoading: boolean;
  fetchAppointments: () => Promise<void>;
  addAppointment: (apt: Omit<Appointment, 'id'>) => Promise<void>;
  updateStatus: (id: string, status: Appointment['status']) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  isLoading: false,

  fetchAppointments: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      set({ appointments: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      set({ isLoading: false });
    }
  },

  addAppointment: async (apt) => {
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(apt),
      });
      if (!res.ok) throw new Error('Failed to create appointment');
      const newApt = await res.json();
      set((state) => ({
        appointments: [...state.appointments, newApt],
      }));
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update appointment status');
      const updated = await res.json();
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? updated : a
        ),
      }));
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  deleteAppointment: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete appointment');
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },
}));
