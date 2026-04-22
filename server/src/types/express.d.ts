import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
      };
    }
  }
}

export interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  name: string;
  role: 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
}
