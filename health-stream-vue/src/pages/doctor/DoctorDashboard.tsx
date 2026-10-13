import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ECGCanvas from '@/components/vitals/ECGCanvas';
import VitalCard from '@/components/vitals/VitalCard';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { vitalsSimulator } from '@/services/websocket';
import { Stethoscope, Users, FileText, Activity, Heart, Thermometer, Wind, Droplets, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDeviceType } from '@/hooks/useDeviceType';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('medwatch_token');
}

type DoctorView = 'overview' | 'monitor' | 'prescriptions';

export default function DoctorDashboard() {
  const [view, setView] = useState<DoctorView>('overview');
  const appointments = useAppointmentStore(s => s.appointments);
  const fetchAppointments = useAppointmentStore(s => s.fetchAppointments);
  const { prescriptions, fetchPrescriptions } = usePrescriptionStore();
  const device = useDeviceType();
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === today);

  useEffect(() => {
    fetchAppointments();
    fetchPrescriptions();
  }, []);

  const navItems = [
    { label: 'Overview', icon: <Stethoscope size={18} />, onClick: () => setView('overview'), active: view === 'overview' },
    { label: 'Vitals Monitor', icon: <Activity size={18} />, onClick: () => setView('monitor'), active: view === 'monitor' },
    { label: 'Prescriptions', icon: <FileText size={18} />, onClick: () => setView('prescriptions'), active: view === 'prescriptions' },
  ];

  return (
    <DashboardLayout title="Doctor Dashboard" role="DOCTOR" navItems={navItems}>
      {view === 'overview' && <OverviewPanel todayAppts={todayAppts} allAppts={appointments} onOpenMonitor={() => setView('monitor')} />}
      {view === 'monitor' && <MonitorPanel device={device} />}
      {view === 'prescriptions' && <PrescriptionsPanel prescriptions={prescriptions} />}
    </DashboardLayout>
  );
}

function OverviewPanel({ todayAppts, allAppts, onOpenMonitor }: { todayAppts: any[]; allAppts: any[]; onOpenMonitor: () => void }) {
  const stats = [
    { label: "Today's Patients", value: todayAppts.length, icon: <Users size={20} />, color: 'text-primary' },
    { label: 'In Progress', value: todayAppts.filter(a => a.status === 'in-progress').length, icon: <Activity size={20} />, color: 'text-warning' },
    { label: 'Completed', value: todayAppts.filter(a => a.status === 'completed').length, icon: <Clock size={20} />, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-heading font-bold mt-1">{s.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-secondary ${s.color}`}>{s.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* All Appointments (not just today) */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">All Appointments</h2>
          <button onClick={onOpenMonitor} className="text-sm text-primary hover:underline flex items-center gap-1">
            Open Monitor <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {allAppts.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No appointments found.</p>}
          {allAppts.map((apt) => (
            <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${apt.status === 'completed' ? 'bg-success' : apt.status === 'in-progress' ? 'bg-warning' : apt.status === 'cancelled' ? 'bg-danger' : 'bg-primary'}`} />
                <div>
                  <p className="text-sm font-medium">{apt.patientName}</p>
                  <p className="text-xs text-muted-foreground">{apt.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{apt.date} {apt.time}</p>
                <p className="text-xs text-muted-foreground capitalize">{apt.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface VitalsReading {
  patientId: string;
  patientName: string;
  timestamp: number;
  heart_rate: number;
  spo2: number;
  temperature: number;
  respiration_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
}

function getHeartRateStatus(hr: number): string {
  if (hr < 60 || hr > 100) return 'critical';
  if (hr < 65 || hr > 90) return 'warning';
  return 'normal';
}

function getSpO2Status(spo2: number): string {
  if (spo2 < 90) return 'critical';
  if (spo2 < 95) return 'warning';
  return 'normal';
}

function getTempStatus(temp: number): string {
  if (temp < 35 || temp > 38.5) return 'critical';
  if (temp < 36 || temp > 37.8) return 'warning';
  return 'normal';
}

function MonitorPanel({ device }: { device: string }) {
  const [vitalsReadings, setVitalsReadings] = useState<VitalsReading[]>([]);
  const [loading, setLoading] = useState(true);

  // Start ECG animation (live, not from DB)
  useEffect(() => {
    vitalsSimulator.start();
    return () => vitalsSimulator.stop();
  }, []);

  // Fetch vitals entered by receptionist from DB
  const fetchVitals = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/vitals/all?limit=50`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVitalsReadings(data);
      }
    } catch (err) {
      console.error('Error fetching vitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, []);

  // Group vitals by patient — show latest reading per patient
  const latestByPatient: Record<string, VitalsReading> = {};
  vitalsReadings.forEach((r) => {
    const key = r.patientId;
    if (!latestByPatient[key] || r.timestamp > latestByPatient[key].timestamp) {
      latestByPatient[key] = r;
    }
  });
  const patientVitals = Object.values(latestByPatient);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Activity size={48} className="animate-pulse mb-4" />
        <p className="font-mono text-sm">Loading patient vitals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
          <Activity size={20} className="text-primary" />
          Patient Vitals Monitor
        </h2>
        <button onClick={fetchVitals} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ECG Waveform — live animation */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-vital-ecg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            ECG Lead II (Live)
          </span>
          <span className="text-xs font-mono text-muted-foreground">25mm/s</span>
        </div>
        <ECGCanvas width={device === 'mobile' ? 340 : device === 'tablet' ? 700 : 900} height={device === 'mobile' ? 150 : 200} />
      </div>

      {/* Patient vitals from database */}
      {patientVitals.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Activity size={40} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No vitals recorded yet</p>
          <p className="text-xs text-muted-foreground mt-1">Receptionist can enter vitals from their dashboard</p>
        </div>
      ) : (
        patientVitals.map((v, idx) => {
          const hrStatus = getHeartRateStatus(v.heart_rate);
          const spo2Status = getSpO2Status(v.spo2);
          const tempStatus = getTempStatus(v.temperature);
          const timeStr = new Date(v.timestamp).toLocaleTimeString();

          return (
            <motion.div key={v.patientId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-heading font-semibold">{v.patientName || 'Unknown Patient'}</p>
                    <p className="text-xs text-muted-foreground">Last recorded: {timeStr}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-mono">
                    Recorded by Receptionist
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <VitalCard label="Heart Rate" value={v.heart_rate} unit="bpm" status={hrStatus} icon={<Heart size={18} />} colorVar="--vital-hr" />
                  <VitalCard label="SpO2" value={v.spo2} unit="%" status={spo2Status} icon={<Droplets size={18} />} colorVar="--vital-spo2" />
                  <VitalCard label="Blood Pressure" value={`${v.bp_systolic}/${v.bp_diastolic}`} unit="mmHg" status="normal" icon={<Activity size={18} />} colorVar="--vital-bp" />
                  <VitalCard label="Temperature" value={v.temperature.toFixed(1)} unit="°C" status={tempStatus} icon={<Thermometer size={18} />} colorVar="--vital-temp" />
                  <VitalCard label="Resp Rate" value={v.respiration_rate} unit="/min" status="normal" icon={<Wind size={18} />} colorVar="--vital-resp" />
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

function PrescriptionsPanel({ prescriptions }: { prescriptions: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">Prescriptions</h2>
      {prescriptions.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No prescriptions found.</p>}
      <div className="space-y-3">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">{rx.patientName}</p>
                <p className="text-xs text-muted-foreground">{rx.diagnosis}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${rx.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                {rx.status}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              {rx.medications.map((med: any, i: number) => (
                <div key={i} className="text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="font-medium">{med.name}</span>
                  <span className="text-muted-foreground">— {med.dosage}, {med.frequency}, {med.duration}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
