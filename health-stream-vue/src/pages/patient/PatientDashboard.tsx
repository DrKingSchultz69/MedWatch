import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { CalendarDays, FileText, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type PatientView = 'appointments' | 'book' | 'prescriptions' | 'vitals-history';

// Mock vitals history
const MOCK_VITALS_HISTORY = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  hr: 70 + Math.floor(Math.random() * 15),
  spo2: 95 + Math.floor(Math.random() * 4),
  temp: +(36.2 + Math.random() * 0.8).toFixed(1),
}));

const API_BASE = 'http://localhost:4000/api';

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

export default function PatientDashboard() {
  const [view, setView] = useState<PatientView>('appointments');
  const { appointments, addAppointment, fetchAppointments } = useAppointmentStore();
  const prescriptions = usePrescriptionStore(s => s.prescriptions);
  const fetchPrescriptions = usePrescriptionStore(s => s.fetchPrescriptions);

  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    fetchAppointments();
    fetchPrescriptions();
    fetchDoctors();
  }, [view]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/users?role=DOCTOR`, { headers: authHeaders() });
      if (res.ok) setDoctors(await res.json());
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  const navItems = [
    { label: 'Appointments', icon: <CalendarDays size={18} />, onClick: () => setView('appointments'), active: view === 'appointments' },
    { label: 'Book Appointment', icon: <CalendarDays size={18} />, onClick: () => setView('book'), active: view === 'book' },
    { label: 'Prescriptions', icon: <FileText size={18} />, onClick: () => setView('prescriptions'), active: view === 'prescriptions' },
    { label: 'Vitals History', icon: <BarChart3 size={18} />, onClick: () => setView('vitals-history'), active: view === 'vitals-history' },
  ];

  return (
    <DashboardLayout title="Patient Portal" role="PATIENT" navItems={navItems}>
      {view === 'appointments' && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-lg">My Appointments</h2>
          {appointments.length === 0 && <p className="text-muted-foreground text-sm">No appointments found.</p>}
          {appointments.map((apt, i) => (
            <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{apt.type}</p>
                <p className="text-sm text-muted-foreground">{apt.doctorName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{apt.date}</p>
                <p className="text-sm font-mono text-muted-foreground">{apt.time}</p>
                <p className={`text-xs mt-1 capitalize px-2 py-0.5 rounded-full inline-block ${
                    apt.status === 'completed' ? 'bg-success/20 text-success' :
                    apt.status === 'in-progress' ? 'bg-warning/20 text-warning' :
                    apt.status === 'cancelled' ? 'bg-danger/20 text-danger' :
                    'bg-primary/20 text-primary'
                }`}>{apt.status}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {view === 'book' && <BookAppointmentForm onBook={addAppointment} doctors={doctors} onSuccess={() => setView('appointments')} />}
      {view === 'prescriptions' && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-lg">My Prescriptions</h2>
          {prescriptions.length === 0 && <p className="text-muted-foreground text-sm">No prescriptions found.</p>}
          {prescriptions.map((rx) => (
            <div key={rx.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{rx.diagnosis}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${rx.status === 'dispensed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>{rx.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{rx.doctorName} • {rx.date}</p>
              {rx.medications.map((med: any, i: number) => (
                <p key={i} className="text-sm">• {med.name} {med.dosage} — {med.frequency}</p>
              ))}
            </div>
          ))}
        </div>
      )}
      {view === 'vitals-history' && (
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-lg">Vitals History (24h)</h2>
          <div className="glass-card p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Heart Rate (bpm)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MOCK_VITALS_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="hr" stroke="hsl(var(--vital-hr))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">SpO2 (%)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MOCK_VITALS_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[90, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="spo2" stroke="hsl(var(--vital-spo2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function BookAppointmentForm({ onBook, doctors, onSuccess }: { onBook: (apt: any) => Promise<void>, doctors: any[], onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    
    const selectedDoctor = fd.get('doctor') as string;
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    const [doctorId, doctorName] = selectedDoctor.split('|');

    // Decode token to get patient's own ID/Name
    const token = getToken();
    if (!token) return;
    const payload = JSON.parse(atob(token.split('.')[1]));

    setSaving(true);
    try {
      await onBook({
        patientName: payload.name,
        patientId: payload.id,
        doctorName,
        doctorId,
        date: fd.get('date') as string,
        time: fd.get('time') as string,
        type: fd.get('type') as string,
        status: 'scheduled',
      });
      toast.success('Appointment booked successfully');
      (e.target as HTMLFormElement).reset();
      onSuccess();
    } catch(err: any) {
      toast.error(err.message || 'Error booking appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 max-w-lg">
      <h2 className="font-heading font-semibold mb-4">Book New Appointment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Select Doctor</Label>
          <select name="doctor" required className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
            <option value="">— Choose a doctor —</option>
            {doctors.map(d => (
              <option key={d.id} value={`${d.id}|${d.name}`}>{d.name} — {d.specialty || 'General'}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Date</Label><Input name="date" type="date" required /></div>
          <div className="space-y-2"><Label>Time</Label><Input name="time" type="time" required /></div>
        </div>
        <div className="space-y-2"><Label>Type of Visit</Label><Input name="type" placeholder="Check-up, Follow-up, etc." required /></div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Booking...' : 'Book Appointment'}
        </Button>
      </form>
    </div>
  );
}
