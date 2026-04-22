import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const ROLE_ROUTES: Record<string, string> = {
  DOCTOR: '/doctor',
  RECEPTIONIST: '/receptionist',
  PATIENT: '/patient',
  PHARMACIST: '/pharmacist',
  ADMIN: '/admin',
};

export default function Index() {
  const { isAuthenticated, role } = useAuthStore();
  if (isAuthenticated && role) return <Navigate to={ROLE_ROUTES[role]} replace />;
  return <Navigate to="/login" replace />;
}
