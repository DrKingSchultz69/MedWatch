import { Request, Response, NextFunction } from 'express';
import Prescription from '../models/Prescription';
import { ApiError } from '../middleware/errorHandler';

/**
 * GET /api/prescriptions
 * List prescriptions filtered by role:
 * - DOCTOR: sees own prescriptions (as prescriber)
 * - PATIENT: sees own prescriptions (as patient)
 * - PHARMACIST: sees all pending prescriptions
 * - RECEPTIONIST: sees all
 */
export const getPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    let filter: Record<string, unknown> = {};

    switch (user.role) {
      case 'DOCTOR':
        filter = { doctorId: user.id };
        break;
      case 'PATIENT':
        filter = { patientId: user.id };
        break;
      case 'PHARMACIST':
        // Pharmacist sees all (primarily pending, but can view all for history)
        break;
      case 'RECEPTIONIST':
        // Receptionist sees all
        break;
      default:
        throw new ApiError('Access denied', 403, 'INSUFFICIENT_ROLE');
    }

    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });
    res.json(prescriptions.map((p) => p.toJSON()));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/prescriptions/:id
 * Get a single prescription by ID
 */
export const getPrescriptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      throw new ApiError('Prescription not found', 404, 'NOT_FOUND');
    }

    res.json(prescription.toJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/prescriptions
 * Create a new prescription (DOCTOR only)
 */
export const createPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientName, patientId, doctorName, date, diagnosis, medications } = req.body;
    const user = req.user!;

    const prescription = await Prescription.create({
      patientName,
      patientId,
      doctorId: user.id,
      doctorName: doctorName || user.name,
      date,
      diagnosis,
      medications,
      status: 'pending',
    });

    res.status(201).json(prescription.toJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/prescriptions/:id/status
 * Update prescription status:
 * - PHARMACIST: can dispense (pending → dispensed)
 * - DOCTOR: can cancel
 */
export const updatePrescriptionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const user = req.user!;

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      throw new ApiError('Prescription not found', 404, 'NOT_FOUND');
    }

    // Validate status transitions
    if (user.role === 'PHARMACIST' && status !== 'dispensed') {
      throw new ApiError('Pharmacist can only mark prescriptions as dispensed', 400, 'INVALID_STATUS');
    }
    if (user.role === 'DOCTOR' && status !== 'cancelled') {
      throw new ApiError('Doctor can only cancel prescriptions', 400, 'INVALID_STATUS');
    }

    prescription.status = status;
    await prescription.save();

    res.json(prescription.toJSON());
  } catch (error) {
    next(error);
  }
};
