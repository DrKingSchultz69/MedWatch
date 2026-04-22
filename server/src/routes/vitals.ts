import { Router } from 'express';
import { getVitalsHistory, getAllVitals, recordVitals } from '../controllers/vitalsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// All vitals routes require authentication
router.use(authMiddleware);

// GET all vitals (for doctor dashboard) — must be before /:patientId routes
router.get('/all', getAllVitals);

// GET vitals history for a specific patient
router.get('/:patientId/history', getVitalsHistory);

// POST new vitals reading (receptionist or doctor)
router.post('/', roleMiddleware('RECEPTIONIST', 'DOCTOR'), recordVitals);

export default router;
