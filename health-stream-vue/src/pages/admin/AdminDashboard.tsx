import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { useVitalsStore } from '@/stores/vitalsStore';
import { vitalsSimulator } from '@/services/websocket';
import ECGCanvas from '@/components/vitals/ECGCanvas';
import { Users, BarChart3, Activity, Shield, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type AdminView = 'overview' | 'users' | 'monitor' | 'logs';

const MOCK_USERS = [
  { id: '1', name: 'Dr. Sarah Chen', role: 'DOCTOR', email: 'doctor@hospital.com', status: 'active' },
  { id: '2', name: 'Maria Santos', role: 'RECEPTIONIST', email: 'receptionist@hospital.com', status: 'active' },
  { id: '3', name: 'John Doe', role: 'PATIENT', email: 'patient@hospital.com', status: 'active' },
  { id: '4', name: 'James Wilson', role: 'PHARMACIST', email: 'pharmacist@hospital.com', status: 'active' },
  { id: '5', name: 'Admin User', role: 'ADMIN', email: 'admin@hospital.com', status: 'active' },
];

const STATS_DATA = [
  { name: 'Mon', patients: 32, appointments: 28 },
  { name: 'Tue', patients: 45, appointments: 40 },
  { name: 'Wed', patients: 38, appointments: 35 },
  { name: 'Thu', patients: 50, appointments: 44 },
  { name: 'Fri', patients: 42, appointments: 38 },
  { name: 'Sat', patients: 20, appointments: 15 },
  { name: 'Sun', patients: 12, appointments: 8 },
];

export default function AdminDashboard() {
  const [view, setView] = useState<AdminView>('overview');
  const appointments = useAppointmentStore(s => s.appointments);
  const prescriptions = usePrescriptionStore(s => s.prescriptions);
  const vitals = useVitalsStore(s => s.currentVitals);

  useEffect(() => {
    if (view === 'monitor') {
      vitalsSimulator.start();
      return () => vitalsSimulator.stop();
    }
  }, [view]);

  const navItems = [
    { label: 'Overview', icon: <BarChart3 size={18} />, onClick: () => setView('overview'), active: view === 'overview' },
    { label: 'Users', icon: <Users size={18} />, onClick: () => setView('users'), active: view === 'users' },
    { label: 'Live Monitor', icon: <Activity size={18} />, onClick: () => setView('monitor'), active: view === 'monitor' },
    { label: 'System Logs', icon: <Shield size={18} />, onClick: () => setView('logs'), active: view === 'logs' },
  ];

  return (
    <DashboardLayout title="Admin Panel" role="ADMIN" navItems={navItems}>
      {view === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: MOCK_USERS.length, icon: <Users size={20} /> },
              { label: 'Appointments', value: appointments.length, icon: <BarChart3 size={20} /> },
              { label: 'Prescriptions', value: prescriptions.length, icon: <Heart size={20} /> },
              { label: 'Active Monitors', value: 3, icon: <Activity size={20} /> },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-heading font-bold mt-1">{s.value}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary text-primary">{s.icon}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold mb-4">Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={STATS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="patients" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="appointments" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {view === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border"><h2 className="font-heading font-semibold">All Users</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['Name', 'Email', 'Role', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{u.role}</span></td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success font-medium">{u.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view === 'monitor' && (
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Live Monitors
          </h2>
          <div className="glass-card p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">Bed 12A — Jane Smith</p>
            <ECGCanvas width={800} height={180} />
            {vitals && (
              <div className="flex gap-6 mt-3 text-sm font-mono">
                <span>HR: <strong className="text-vital-hr">{vitals.heart_rate}</strong></span>
                <span>SpO2: <strong className="text-vital-spo2">{vitals.spo2}%</strong></span>
                <span>Temp: <strong className="text-vital-temp">{vitals.temperature.toFixed(1)}°C</strong></span>
                <span>BP: <strong className="text-vital-bp">{vitals.bp_systolic}/{vitals.bp_diastolic}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}
      {view === 'logs' && (
        <div className="glass-card p-5">
          <h2 className="font-heading font-semibold mb-4">System Logs</h2>
          <div className="space-y-2 font-mono text-xs">
            {[
              { time: '14:32:01', msg: 'Vitals stream connected — Bed 12A', level: 'info' },
              { time: '14:31:45', msg: 'Prescription rx1 dispensed by James Wilson', level: 'info' },
              { time: '14:30:22', msg: 'SpO2 alert — Patient p2 below threshold', level: 'warn' },
              { time: '14:28:10', msg: 'New appointment booked — Robert Brown', level: 'info' },
              { time: '14:25:00', msg: 'User login — Dr. Sarah Chen', level: 'info' },
              { time: '14:20:15', msg: 'Heart rate alert — Patient p3 elevated', level: 'danger' },
            ].map((log, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded ${log.level === 'danger' ? 'bg-danger/10' : log.level === 'warn' ? 'bg-warning/10' : 'bg-secondary/50'}`}>
                <span className="text-muted-foreground">{log.time}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${log.level === 'danger' ? 'bg-danger' : log.level === 'warn' ? 'bg-warning' : 'bg-success'}`} />
                <span>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
