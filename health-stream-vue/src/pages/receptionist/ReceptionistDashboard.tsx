import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { UserPlus, CalendarPlus, ClipboardList, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type RecView = 'appointments' | 'register' | 'register-doc' | 'register-pharm' | 'book' | 'vitals';

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

export default function ReceptionistDashboard() {
  const [view, setView] = useState<RecView>('appointments');
  const { appointments, addAppointment, fetchAppointments } = useAppointmentStore();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    fetchAppointments();
    fetchUsers();
  }, [view]); // refetch when changing views

  const fetchUsers = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        fetch(`${API_BASE}/users?role=PATIENT`, { headers: authHeaders() }),
        fetch(`${API_BASE}/users?role=DOCTOR`, { headers: authHeaders() })
      ]);
      if (patRes.ok) setPatients(await patRes.json());
      if (docRes.ok) setDoctors(await docRes.json());
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const navItems = [
    { label: 'Appointments', icon: <ClipboardList size={18} />, onClick: () => setView('appointments'), active: view === 'appointments' },
    { label: 'Register Patient', icon: <UserPlus size={18} />, onClick: () => setView('register'), active: view === 'register' },
    { label: 'Register Doctor', icon: <UserPlus size={18} />, onClick: () => setView('register-doc'), active: view === 'register-doc' },
    { label: 'Register Pharmacist', icon: <UserPlus size={18} />, onClick: () => setView('register-pharm'), active: view === 'register-pharm' },
    { label: 'Book Appointment', icon: <CalendarPlus size={18} />, onClick: () => setView('book'), active: view === 'book' },
    { label: 'Enter Vitals', icon: <Activity size={18} />, onClick: () => setView('vitals'), active: view === 'vitals' },
  ];

  return (
    <DashboardLayout title="Reception" role="RECEPTIONIST" navItems={navItems}>
      {view === 'appointments' && <AppointmentsTable appointments={appointments} />}
      {view === 'register' && <RegisterPatientForm onSuccess={() => setView('appointments')} />}
      {view === 'register-doc' && <RegisterDoctorForm onSuccess={() => setView('appointments')} />}
      {view === 'register-pharm' && <RegisterPharmacistForm onSuccess={() => setView('appointments')} />}
      {view === 'book' && <BookAppointmentForm onBook={addAppointment} patients={patients} doctors={doctors} />}
      {view === 'vitals' && <EnterVitalsForm patients={patients} />}
    </DashboardLayout>
  );
}

function AppointmentsTable({ appointments }: { appointments: any[] }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-semibold">All Appointments</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {['Patient', 'Doctor', 'Date', 'Time', 'Type', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No appointments found.</td></tr>
            )}
            {appointments.map((apt, i) => (
              <motion.tr key={apt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3 font-medium">{apt.patientName}</td>
                <td className="px-4 py-3 text-muted-foreground">{apt.doctorName}</td>
                <td className="px-4 py-3 font-mono text-xs">{apt.date}</td>
                <td className="px-4 py-3 font-mono text-xs">{apt.time}</td>
                <td className="px-4 py-3">{apt.type}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    apt.status === 'completed' ? 'bg-success/20 text-success' :
                    apt.status === 'in-progress' ? 'bg-warning/20 text-warning' :
                    apt.status === 'cancelled' ? 'bg-danger/20 text-danger' :
                    'bg-primary/20 text-primary'
                  }`}>{apt.status}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegisterPatientForm({ onSuccess }: { onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    
    // Auto-generate password if we're registering a user directly 
    // Usually a real system sends an email with a setup link or lets receptionist set it
    const password = fd.get('password') as string;
    const name = fd.get('name') as string;
    const email = fd.get('email') as string;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'PATIENT' })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }
      toast.success('Patient registered successfully! They can now log in.');
      (e.target as HTMLFormElement).reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 max-w-lg">
      <h2 className="font-heading font-semibold mb-4">Register New Patient</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2"><Label>Full Name</Label><Input name="name" placeholder="John Doe" required /></div>
        <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" placeholder="john@example.com" required /></div>
        <div className="space-y-2"><Label>Set Password (for portal login)</Label><Input name="password" type="password" required /></div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Registering...' : 'Register Patient'}
        </Button>
      </form>
    </div>
  );
}

function RegisterDoctorForm({ onSuccess }: { onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    
    const password = fd.get('password') as string;
    const name = fd.get('name') as string;
    const email = fd.get('email') as string;
    const specialty = fd.get('specialty') as string;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'DOCTOR', specialty })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }
      toast.success('Doctor registered successfully! They can now log in.');
      (e.target as HTMLFormElement).reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 max-w-lg">
      <h2 className="font-heading font-semibold mb-4">Register New Doctor</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2"><Label>Full Name</Label><Input name="name" placeholder="Dr. Jane Doe" required /></div>
        <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" placeholder="jane@example.com" required /></div>
        <div className="space-y-2"><Label>Specialty</Label><Input name="specialty" placeholder="e.g. Cardiologist" required /></div>
        <div className="space-y-2"><Label>Set Password (for portal login)</Label><Input name="password" type="password" required /></div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Registering...' : 'Register Doctor'}
        </Button>
      </form>
    </div>
  );
}

function RegisterPharmacistForm({ onSuccess }: { onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    
    const password = fd.get('password') as string;
    const name = fd.get('name') as string;
    const email = fd.get('email') as string;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'PHARMACIST' })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }
      toast.success('Pharmacist registered successfully! They can now log in.');
      (e.target as HTMLFormElement).reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 max-w-lg">
      <h2 className="font-heading font-semibold mb-4">Register New Pharmacist</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2"><Label>Full Name</Label><Input name="name" placeholder="John Pharmacist" required /></div>
        <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" placeholder="pharm@example.com" required /></div>
        <div className="space-y-2"><Label>Set Password (for portal login)</Label><Input name="password" type="password" required /></div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Registering...' : 'Register Pharmacist'}
        </Button>
      </form>
    </div>
  );
}

function BookAppointmentForm({ onBook, patients, doctors }: { onBook: (apt: any) => Promise<void>, patients: any[], doctors: any[] }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    
    const selectedPatient = fd.get('patient') as string;
    const selectedDoctor = fd.get('doctor') as string;
    
    if (!selectedPatient || !selectedDoctor) {
      toast.error('Please select both a patient and a doctor');
      return;
    }

    const [patientId, patientName] = selectedPatient.split('|');
    const [doctorId, doctorName] = selectedDoctor.split('|');

    setSaving(true);
    try {
      await onBook({
        patientName,
        patientId,
        doctorName,
        doctorId,
        date: fd.get('date') as string,
        time: fd.get('time') as string,
        type: fd.get('type') as string,
        status: 'scheduled',
      });
      toast.success('Appointment booked successfully');
      (e.target as HTMLFormElement).reset();
    } catch(err: any) {
      toast.error(err.message || 'Error booking appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 max-w-lg">
      <h2 className="font-heading font-semibold mb-4">Book Appointment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="space-y-2">
          <Label>Select Patient</Label>
          <select name="patient" required className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
            <option value="">— Choose a patient —</option>
            {patients.map(p => (
              <option key={p.id} value={`${p.id}|${p.name}`}>{p.name} ({p.email})</option>
            ))}
          </select>
        </div>

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
        <div className="space-y-2"><Label>Type</Label><Input name="type" placeholder="Check-up, Follow-up, etc." required /></div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Booking...' : 'Book Appointment'}
        </Button>
      </form>
    </div>
  );
}

function EnterVitalsForm({ patients }: { patients: any[] }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const selectedPatient = fd.get('patient') as string;

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    const [patientId, patientName] = selectedPatient.split('|');

    const body = {
      patientId,
      patientName,
      heart_rate: Number(fd.get('heart_rate')) || 0,
      spo2: Number(fd.get('spo2')) || 0,
      temperature: Number(fd.get('temperature')) || 0,
      respiration_rate: Number(fd.get('respiration_rate')) || 0,
      bp_systolic: Number(fd.get('bp_systolic')) || 0,
      bp_diastolic: Number(fd.get('bp_diastolic')) || 0,
    };

    setSaving(true);
    try {
      const token = localStorage.getItem('medwatch_token');
      const res = await fetch(`${API_BASE}/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save vitals');
      }
      toast.success(`Vitals recorded for ${patientName}`);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record vitals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 max-w-lg">
      <h2 className="font-heading font-semibold mb-4">Enter Patient Vitals</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Select Patient (All Registered Patients)</Label>
          <select name="patient" required className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
            <option value="">— Choose a patient —</option>
            {patients.map(p => (
              <option key={p.id} value={`${p.id}|${p.name}`}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Heart Rate (bpm)</Label><Input name="heart_rate" type="number" placeholder="72" required /></div>
          <div className="space-y-2"><Label>SpO2 (%)</Label><Input name="spo2" type="number" placeholder="98" required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Temperature (°C)</Label><Input name="temperature" type="number" step="0.1" placeholder="36.6" required /></div>
          <div className="space-y-2"><Label>Resp Rate (/min)</Label><Input name="respiration_rate" type="number" placeholder="16" required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>BP Systolic</Label><Input name="bp_systolic" type="number" placeholder="120" required /></div>
          <div className="space-y-2"><Label>BP Diastolic</Label><Input name="bp_diastolic" type="number" placeholder="80" required /></div>
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Recording...' : 'Record Vitals'}
        </Button>
      </form>
    </div>
  );
}
