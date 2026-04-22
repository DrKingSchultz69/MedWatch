import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { Activity, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

const ROLE_ROUTES: Record<string, string> = {
  DOCTOR: '/doctor',
  RECEPTIONIST: '/receptionist',
  PATIENT: '/patient',
  PHARMACIST: '/pharmacist',
  ADMIN: '/admin',
};

const DEMO_ACCOUNTS = [
  { email: 'doctor@hospital.com', password: 'doctor123', role: 'Doctor' },
  { email: 'receptionist@hospital.com', password: 'reception123', role: 'Receptionist' },
  { email: 'patient@hospital.com', password: 'patient123', role: 'Patient' },
  { email: 'pharmacist@hospital.com', password: 'pharma123', role: 'Pharmacist' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const role = useAuthStore.getState().role;
      if (role) navigate(ROLE_ROUTES[role] || '/');
    } catch {
      setError('Invalid email or password');
    }
  };

  const handleDemoLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-accent/5 blur-3xl" />
      </div>

      <button onClick={toggle} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors z-10" aria-label="Toggle theme">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Activity className="text-primary-foreground" size={28} />
          </div>
          <h1 className="text-2xl font-heading font-bold">MedWatch</h1>
          <p className="text-sm text-muted-foreground mt-1">Hospital Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-3">Demo Accounts (click to fill)</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.role} onClick={() => handleDemoLogin(acc)}
                className="text-xs px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors font-medium"
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
