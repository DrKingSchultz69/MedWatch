import { Router } from 'express';
import { z } from 'zod';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
} from '../controllers/prescriptionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validate';

const router = Router();

// All prescription routes require authentication
router.use(authMiddleware);

// Validation schemas
const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
});

const createPrescriptionSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorName: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'dispensed', 'cancelled']),
});

// Routes
router.get('/', getPrescriptions);
router.get('/:id', getPrescriptionById);
router.post(
  '/',
  roleMiddleware('DOCTOR'),
  validate(createPrescriptionSchema),
  createPrescription
);
router.patch(
  '/:id/status',
  roleMiddleware('DOCTOR', 'PHARMACIST'),
  validate(updateStatusSchema),
  updatePrescriptionStatus
);

export default router;
