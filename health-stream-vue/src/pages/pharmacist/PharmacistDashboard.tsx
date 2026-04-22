import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { Pill, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type PharmView = 'pending' | 'history';

export default function PharmacistDashboard() {
  const [view, setView] = useState<PharmView>('pending');
  const { prescriptions, updateStatus, fetchPrescriptions } = usePrescriptionStore();
  const pending = prescriptions.filter(p => p.status === 'pending');
  const dispensed = prescriptions.filter(p => p.status === 'dispensed');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const navItems = [
    { label: 'Pending', icon: <Clock size={18} />, onClick: () => setView('pending'), active: view === 'pending' },
    { label: 'Dispensed', icon: <CheckCircle2 size={18} />, onClick: () => setView('history'), active: view === 'history' },
  ];

  const handleDispense = (id: string) => {
    updateStatus(id, 'dispensed');
    toast.success('Prescription dispensed');
  };

  const items = view === 'pending' ? pending : dispensed;

  return (
    <DashboardLayout title="Pharmacy" role="PHARMACIST" navItems={navItems}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg">{view === 'pending' ? 'Pending Prescriptions' : 'Dispensed History'}</h2>
          <span className="text-sm text-muted-foreground">{items.length} items</span>
        </div>
        {items.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No prescriptions found.</p>}
        {items.map((rx, i) => (
          <motion.div key={rx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{rx.patientName}</p>
                <p className="text-xs text-muted-foreground">{rx.doctorName} • {rx.date}</p>
                <p className="text-sm mt-1 text-muted-foreground">{rx.diagnosis}</p>
                <div className="mt-2 space-y-1">
                  {rx.medications.map((med, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Pill size={12} className="text-primary" />
                      <span className="font-medium">{med.name}</span>
                      <span className="text-muted-foreground">{med.dosage} • {med.frequency} • {med.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
              {rx.status === 'pending' && (
                <Button size="sm" onClick={() => handleDispense(rx.id)} className="shrink-0">Dispense</Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}
