import { Request, Response, NextFunction } from 'express';
import Appointment from '../models/Appointment';
import { ApiError } from '../middleware/errorHandler';

/**
 * GET /api/appointments
 * List appointments filtered by role:
 * - DOCTOR: sees own appointments
 * - PATIENT: sees own appointments
 * - RECEPTIONIST: sees all
 * - PHARMACIST: no access (handled by role middleware)
 */
export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      case 'RECEPTIONIST':
        // Receptionist sees all appointments
        break;
      default:
        throw new ApiError('Access denied', 403, 'INSUFFICIENT_ROLE');
    }

    const appointments = await Appointment.find(filter).sort({ date: -1, time: -1 });
    res.json(appointments.map((a) => a.toJSON()));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/appointments/:id
 * Get a single appointment by ID
 */
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      throw new ApiError('Appointment not found', 404, 'NOT_FOUND');
    }

    // Access control: only the involved doctor, patient, or receptionist
    const user = req.user!;
    if (
      user.role !== 'RECEPTIONIST' &&
      appointment.doctorId.toString() !== user.id &&
      appointment.patientId.toString() !== user.id
    ) {
      throw new ApiError('Access denied', 403, 'INSUFFICIENT_ROLE');
    }

    res.json(appointment.toJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/appointments
 * Create a new appointment (DOCTOR, RECEPTIONIST)
 */
export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientName, patientId, doctorName, doctorId, date, time, type, notes } = req.body;

    const appointment = await Appointment.create({
      patientName,
      patientId,
      doctorName,
      doctorId,
      date,
      time,
      status: 'scheduled',
      type,
      notes,
    });

    res.status(201).json(appointment.toJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status (DOCTOR, RECEPTIONIST)
 */
export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      throw new ApiError('Appointment not found', 404, 'NOT_FOUND');
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment.toJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/appointments/:id
 * Cancel/delete an appointment (RECEPTIONIST)
 */
export const deleteAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      throw new ApiError('Appointment not found', 404, 'NOT_FOUND');
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
