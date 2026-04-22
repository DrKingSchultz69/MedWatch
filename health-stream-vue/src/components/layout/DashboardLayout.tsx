import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, type UserRole } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  role: UserRole;
  navItems: { label: string; icon: ReactNode; onClick?: () => void; active?: boolean }[];
}

const ROLE_COLORS: Record<UserRole, string> = {
  DOCTOR: 'bg-primary',
  RECEPTIONIST: 'bg-warning',
  PATIENT: 'bg-success',
  PHARMACIST: 'bg-accent',
  ADMIN: 'bg-danger',
};

export default function DashboardLayout({ children, title, role, navItems }: DashboardLayoutProps) {
  const { user, isAuthenticated, logout, role: userRole } = useAuthStore();
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated || userRole !== role) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="glass-card sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 py-3 rounded-none border-b border-border/50">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={`w-2 h-2 rounded-full ${ROLE_COLORS[role]}`} />
          <h1 className="text-lg font-heading font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-muted-foreground">{user?.name}</span>
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" aria-label="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-57px)] glass-card rounded-none border-r border-border/50 p-3 gap-1">
          {navItems.map((item) => (
            <button key={item.label} onClick={item.onClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${item.active ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        {/* Sidebar - Mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
              <motion.aside initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-[57px] bottom-0 w-56 glass-card rounded-none border-r border-border/50 p-3 z-50 flex flex-col gap-1 md:hidden"
              >
                {navItems.map((item) => (
                  <button key={item.label} onClick={() => { item.onClick?.(); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${item.active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
