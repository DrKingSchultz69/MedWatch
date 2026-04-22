import { Router } from 'express';
import { z } from 'zod';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointmentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validate';

const router = Router();

// All appointment routes require authentication
router.use(authMiddleware);

// Validation schemas
const createAppointmentSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorName: z.string().min(1, 'Doctor name is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm format'),
  type: z.string().min(1, 'Type is required'),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']),
});

// Routes
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.post(
  '/',
  roleMiddleware('DOCTOR', 'RECEPTIONIST'),
  validate(createAppointmentSchema),
  createAppointment
);
router.patch(
  '/:id/status',
  roleMiddleware('DOCTOR', 'RECEPTIONIST'),
  validate(updateStatusSchema),
  updateAppointmentStatus
);
router.delete(
  '/:id',
  roleMiddleware('RECEPTIONIST'),
  deleteAppointment
);

export default router;
